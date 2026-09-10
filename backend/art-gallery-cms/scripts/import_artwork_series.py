#!/usr/bin/env python3
"""Safely import a photographed artwork series into a remote Strapi 5 CMS."""

from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import os
import re
import unicodedata
import uuid
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any, NamedTuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener


EXPECTED_COLUMNS = ("filename", "caption", "description", "series", "dimensions")
DEFAULT_CATEGORY_SLUG = "pen-and-ink-drawings"
DEFAULT_MEDIUM = "Pen and ink"
ARTWORK_MODEL = "api::artwork.artwork"
MAX_IMAGE_BYTES = 12 * 1024 * 1024
DIMENSIONS_PATTERN = re.compile(r"^\d+(?:\.\d+)? x \d+(?:\.\d+)? in$")


class ArtworkRow(NamedTuple):
    filename: str
    caption: str
    description: str
    series: str
    dimensions: str
    slug: str


class StrapiRequestError(RuntimeError):
    pass


class RejectRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        raise StrapiRequestError(f"Unexpected redirect from Strapi ({code}) to {new_url}")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-") or "artwork"


def load_manifest(path: Path) -> list[ArtworkRow]:
    if not path.is_file():
        raise ValueError(f"CSV manifest not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != EXPECTED_COLUMNS:
            raise ValueError(f"CSV columns must be exactly: {', '.join(EXPECTED_COLUMNS)}")

        items: list[ArtworkRow] = []
        for row_number, source in enumerate(reader, start=2):
            values = {key: str(source.get(key) or "").strip() for key in EXPECTED_COLUMNS}
            missing = [key for key, value in values.items() if not value]
            if missing:
                raise ValueError(f"CSV row {row_number} is missing: {', '.join(missing)}")

            filename = values["filename"]
            if Path(filename).name != filename or Path(filename).suffix.lower() not in {".jpg", ".jpeg"}:
                raise ValueError(f"CSV row {row_number} has an unsafe or unsupported filename: {filename}")
            if not DIMENSIONS_PATTERN.fullmatch(values["dimensions"]):
                raise ValueError(
                    f"CSV row {row_number} has invalid dimensions: {values['dimensions']}"
                )

            items.append(
                ArtworkRow(
                    filename=filename,
                    caption=values["caption"],
                    description=values["description"],
                    series=values["series"],
                    dimensions=values["dimensions"],
                    slug=slugify(values["caption"]),
                )
            )

    if not items:
        raise ValueError("CSV manifest contains no artworks")

    duplicate_files = _duplicates(item.filename for item in items)
    if duplicate_files:
        raise ValueError(f"Duplicate filenames: {', '.join(duplicate_files)}")

    duplicate_slugs = _duplicates(item.slug for item in items)
    if duplicate_slugs:
        raise ValueError(f"Duplicate artwork slugs: {', '.join(duplicate_slugs)}")

    series_names = sorted({item.series for item in items})
    if len(series_names) != 1:
        raise ValueError(f"A single import must contain one series, found: {', '.join(series_names)}")

    return items


def _duplicates(values) -> list[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    return sorted(duplicates)


def inspect_archive(path: Path, items: list[ArtworkRow]) -> dict[str, zipfile.ZipInfo]:
    if not path.is_file():
        raise ValueError(f"ZIP archive not found: {path}")

    entries: dict[str, zipfile.ZipInfo] = {}
    with zipfile.ZipFile(path) as archive:
        for entry in archive.infolist():
            if entry.is_dir():
                continue

            normalized = entry.filename.replace("\\", "/")
            parts = PurePosixPath(normalized).parts
            if len(parts) != 1 or normalized.startswith("/") or ".." in parts:
                raise ValueError(f"Unsafe ZIP entry: {entry.filename}")
            if entry.flag_bits & 0x1:
                raise ValueError(f"Encrypted ZIP entries are not supported: {entry.filename}")
            if entry.file_size <= 0 or entry.file_size > MAX_IMAGE_BYTES:
                raise ValueError(f"Invalid image size for {entry.filename}: {entry.file_size} bytes")
            if entry.filename in entries:
                raise ValueError(f"Duplicate ZIP entry: {entry.filename}")

            with archive.open(entry) as image_handle:
                if image_handle.read(3) != b"\xff\xd8\xff":
                    raise ValueError(f"ZIP entry is not a valid JPEG: {entry.filename}")
            entries[entry.filename] = entry

    expected = {item.filename for item in items}
    actual = set(entries)
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing or extra:
        details = []
        if missing:
            details.append(f"missing: {', '.join(missing)}")
        if extra:
            details.append(f"extra: {', '.join(extra)}")
        raise ValueError("ZIP and CSV do not match (" + "; ".join(details) + ")")

    return entries


def description_blocks(description: str) -> list[dict[str, Any]]:
    return [
        {
            "type": "paragraph",
            "children": [{"type": "text", "text": description}],
        }
    ]


def build_artwork_payload(
    item: ArtworkRow,
    *,
    category_document_id: str,
    price: int,
    year: int,
    medium: str,
) -> dict[str, Any]:
    return {
        "title": item.caption,
        "Description": description_blocks(item.description),
        "price": price,
        "category": category_document_id,
        "medium": medium,
        "dimensions": item.dimensions,
        "yearCreated": year,
        "isAvailable": True,
        "availabilityStatus": "available",
        "slug": item.slug,
        "isFeatured": False,
        "seriesName": item.series,
        "framingStatus": "to_be_confirmed",
        "shippingNote": "Shipping details will be confirmed directly before dispatch.",
        "certificateNote": "A certificate of authenticity is included with the artwork.",
    }


def encode_multipart(
    fields: dict[str, str],
    *,
    file_field: str,
    filename: str,
    file_bytes: bytes,
) -> tuple[bytes, str]:
    boundary = f"----sunilsawane-{uuid.uuid4().hex}"
    body = bytearray()

    for name, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("ascii"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("ascii"))
        body.extend(value.encode("utf-8"))
        body.extend(b"\r\n")

    safe_filename = filename.replace('"', "")
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    body.extend(f"--{boundary}\r\n".encode("ascii"))
    body.extend(
        f'Content-Disposition: form-data; name="{file_field}"; filename="{safe_filename}"\r\n'.encode("ascii")
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("ascii"))
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("ascii"))
    return bytes(body), f"multipart/form-data; boundary={boundary}"


class StrapiClient:
    def __init__(self, base_url: str, token: str, timeout: int = 90):
        self.base_url = base_url.rstrip("/")
        self.token = token.strip()
        self.timeout = timeout
        self.opener = build_opener(RejectRedirects())

        if not self.token:
            raise ValueError("STRAPI_API_TOKEN is empty")
        if not (self.base_url.startswith("https://") or self.base_url.startswith("http://127.0.0.1")):
            raise ValueError("Remote Strapi imports require HTTPS")

    def request_json(
        self,
        method: str,
        path: str,
        *,
        payload: dict[str, Any] | None = None,
        body: bytes | None = None,
        content_type: str = "application/json",
    ) -> Any:
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

        request = Request(
            f"{self.base_url}{path}",
            data=body,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/json",
                **({"Content-Type": content_type} if body is not None else {}),
            },
        )
        try:
            with self.opener.open(request, timeout=self.timeout) as response:
                response_body = response.read()
        except HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")[:1000]
            raise StrapiRequestError(f"Strapi {method} {path} failed with HTTP {error.code}: {details}") from error
        except URLError as error:
            raise StrapiRequestError(f"Unable to reach Strapi at {self.base_url}: {error.reason}") from error

        return json.loads(response_body.decode("utf-8")) if response_body else None

    def get_category_by_slug(self, slug: str) -> dict[str, Any]:
        query = urlencode(
            {
                "filters[slug][$eq]": slug,
                "status": "published",
                "pagination[pageSize]": 2,
            }
        )
        response = self.request_json("GET", f"/api/categories?{query}")
        categories = response.get("data", [])
        if len(categories) != 1:
            raise StrapiRequestError(f"Expected one published category with slug '{slug}', found {len(categories)}")
        return categories[0]

    def list_published_artworks(self) -> list[dict[str, Any]]:
        artworks: list[dict[str, Any]] = []
        page = 1
        while True:
            query = urlencode(
                {
                    "status": "published",
                    "populate": "images",
                    "pagination[page]": page,
                    "pagination[pageSize]": 100,
                }
            )
            response = self.request_json("GET", f"/api/artworks?{query}")
            artworks.extend(response.get("data", []))
            pagination = response.get("meta", {}).get("pagination", {})
            if page >= int(pagination.get("pageCount", page)):
                break
            page += 1
        return artworks

    def create_artwork(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.request_json(
            "POST",
            "/api/artworks?status=published",
            payload={"data": payload},
        )
        return response["data"]

    def update_artwork(self, document_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.request_json(
            "PUT",
            f"/api/artworks/{document_id}?status=published",
            payload={"data": payload},
        )
        return response["data"]

    def upload_artwork_image(
        self,
        artwork_id: int,
        filename: str,
        image_bytes: bytes,
        alternative_text: str,
    ) -> dict[str, Any]:
        body, content_type = encode_multipart(
            {
                "ref": ARTWORK_MODEL,
                "refId": str(artwork_id),
                "field": "images",
                "fileInfo": json.dumps(
                    {
                        "name": filename,
                        "alternativeText": alternative_text,
                        "caption": alternative_text,
                    },
                    ensure_ascii=False,
                ),
            },
            file_field="files",
            filename=filename,
            file_bytes=image_bytes,
        )
        response = self.request_json("POST", "/api/upload", body=body, content_type=content_type)
        if not isinstance(response, list) or len(response) != 1:
            raise StrapiRequestError(f"Unexpected upload response for {filename}")
        return response[0]


def import_series(
    client,
    archive_path: Path,
    entries: dict[str, zipfile.ZipInfo],
    items: list[ArtworkRow],
    *,
    price: int,
    year: int,
    medium: str = DEFAULT_MEDIUM,
    category_slug: str = DEFAULT_CATEGORY_SLUG,
) -> dict[str, int]:
    category = client.get_category_by_slug(category_slug)
    existing_artworks = client.list_published_artworks()
    existing_by_slug: dict[str, dict[str, Any]] = {}
    for artwork in existing_artworks:
        slug = str(artwork.get("slug") or "").strip()
        if slug in existing_by_slug:
            raise RuntimeError(f"Production contains duplicate published artwork slug: {slug}")
        if slug:
            existing_by_slug[slug] = artwork

    for item in items:
        existing = existing_by_slug.get(item.slug)
        if existing and (
            str(existing.get("title") or "").strip() != item.caption
            or str(existing.get("seriesName") or "").strip() != item.series
        ):
            raise RuntimeError(
                f"Slug '{item.slug}' belongs to a different artwork or series; no records were changed"
            )

    result = {"created": 0, "updated": 0, "uploaded": 0}
    with zipfile.ZipFile(archive_path) as archive:
        for item in items:
            payload = build_artwork_payload(
                item,
                category_document_id=category["documentId"],
                price=price,
                year=year,
                medium=medium,
            )
            existing = existing_by_slug.get(item.slug)
            existing_images = existing.get("images") if existing else []

            if existing:
                artwork = client.update_artwork(existing["documentId"], payload)
                result["updated"] += 1
            else:
                artwork = client.create_artwork(payload)
                result["created"] += 1

            if not existing_images:
                image_bytes = archive.read(entries[item.filename])
                client.upload_artwork_image(
                    int(artwork["id"]),
                    item.filename,
                    image_bytes,
                    item.caption,
                )
                result["uploaded"] += 1

    return result


def update_series_dimensions(client, items: list[ArtworkRow]) -> dict[str, int]:
    existing_by_slug: dict[str, dict[str, Any]] = {}
    for artwork in client.list_published_artworks():
        slug = str(artwork.get("slug") or "").strip()
        if slug in existing_by_slug:
            raise RuntimeError(f"Production contains duplicate published artwork slug: {slug}")
        if slug:
            existing_by_slug[slug] = artwork

    resolved: list[tuple[ArtworkRow, dict[str, Any]]] = []
    for item in items:
        existing = existing_by_slug.get(item.slug)
        if not existing:
            raise RuntimeError(f"Published artwork is missing for slug '{item.slug}'; no records were changed")
        if (
            str(existing.get("title") or "").strip() != item.caption
            or str(existing.get("seriesName") or "").strip() != item.series
        ):
            raise RuntimeError(
                f"Slug '{item.slug}' belongs to a different artwork or series; no records were changed"
            )
        resolved.append((item, existing))

    for item, existing in resolved:
        client.update_artwork(
            existing["documentId"],
            {"dimensions": item.dimensions},
        )

    return {"updated": len(resolved)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import one artwork series into Strapi and Cloudinary.")
    parser.add_argument("--csv", type=Path, default=repo_root() / "new-artwork-series-copy.csv")
    parser.add_argument("--zip", type=Path, required=True)
    parser.add_argument("--base-url", default=os.environ.get("STRAPI_URL", ""))
    parser.add_argument("--price", type=int, default=7999)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--medium", default=DEFAULT_MEDIUM)
    parser.add_argument("--category-slug", default=DEFAULT_CATEGORY_SLUG)
    parser.add_argument("--expected-count", type=int, default=31)
    parser.add_argument(
        "--dimensions-only",
        action="store_true",
        help="Update only the dimensions field on matching published artworks.",
    )
    parser.add_argument("--apply", action="store_true", help="Write to Strapi. Without this flag, validate only.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    items = load_manifest(args.csv.resolve())
    entries = inspect_archive(args.zip.resolve(), items)

    if len(items) != args.expected_count:
        raise SystemExit(f"Expected {args.expected_count} artworks but validated {len(items)}")

    print(f"validated={len(items)} series={items[0].series!r} price={args.price} year={args.year}")
    print(f"archive_files={len(entries)} total_bytes={sum(entry.file_size for entry in entries.values())}")

    if not args.apply:
        print("dry_run=true no remote records or uploads were changed")
        return

    token = os.environ.get("STRAPI_API_TOKEN", "")
    if not args.base_url:
        raise SystemExit("--base-url or STRAPI_URL is required with --apply")
    if not token:
        raise SystemExit("STRAPI_API_TOKEN is required with --apply")

    client = StrapiClient(args.base_url, token)
    if args.dimensions_only:
        result = update_series_dimensions(client, items)
    else:
        result = import_series(
            client,
            args.zip.resolve(),
            entries,
            items,
            price=args.price,
            year=args.year,
            medium=args.medium,
            category_slug=args.category_slug,
        )
    print(json.dumps({"applied": True, **result}, sort_keys=True))


if __name__ == "__main__":
    main()
