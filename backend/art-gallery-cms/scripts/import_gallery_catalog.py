#!/usr/bin/env python3
"""
Import the legacy static gallery into the local Strapi shop catalog.

The current frontend shop reads Strapi artworks and shows products only when
price > 0 and isAvailable is not false. This script keeps the frontend UI
unchanged and populates the local Strapi SQLite database with purchasable
artwork records based on the deployed static gallery metadata.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import random
import re
import shutil
import sqlite3
import string
import time
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from urllib.request import urlopen

from PIL import Image


DEFAULT_SOURCE_URL = "https://sunilsawane.vercel.app/js/gallery.js"
ARTWORK_TYPE = "api::artwork.artwork"
IMAGE_FIELD = "images"
PUBLISHED_CATEGORY_SLUG = "pen-and-ink-drawings"
SKETCH_CATEGORY_SLUG = "sketches"


@dataclass(frozen=True)
class GalleryItem:
    title: str
    image: str
    description: str
    image_number: int
    slug: str


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def cms_root() -> Path:
    return Path(__file__).resolve().parents[1]


def now_ms() -> int:
    return int(time.time() * 1000)


def document_id(length: int = 24) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return slug or "artwork"


def js_string(value: str) -> str:
    return ast.literal_eval(value)


def fetch_gallery_js(source_url: str) -> str:
    with urlopen(source_url, timeout=30) as response:
        return response.read().decode("utf-8")


def parse_gallery_items(source: str) -> list[GalleryItem]:
    quoted = r"""'(?:\\.|[^'])*'|"(?:\\.|[^"])*" """
    item_pattern = re.compile(
        rf"title:\s*(?P<title>{quoted})\s*,\s*"
        rf"image:\s*(?P<image>{quoted})\s*,\s*(?://[^\n]*\n\s*)?"
        rf"description:\s*(?P<description>{quoted})",
        re.VERBOSE | re.DOTALL,
    )

    items: list[GalleryItem] = []
    seen_slugs: set[str] = set()
    for match in item_pattern.finditer(source):
        title = js_string(match.group("title"))
        image = js_string(match.group("image"))
        description = js_string(match.group("description"))
        number_match = re.search(r"gallery-(\d+)\.jpg$", image)
        if not number_match:
            continue

        base_slug = slugify(title)
        slug = base_slug
        suffix = 2
        while slug in seen_slugs:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        seen_slugs.add(slug)

        items.append(
            GalleryItem(
                title=title,
                image=image,
                description=description,
                image_number=int(number_match.group(1)),
                slug=slug,
            )
        )

    return sorted(items, key=lambda item: item.image_number)


def blocks(description: str) -> str:
    return json.dumps(
        [
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": description}],
            }
        ],
        ensure_ascii=False,
    )


def image_size_bytes(path: Path) -> int:
    return path.stat().st_size


def file_size_kb(path: Path) -> float:
    return round(image_size_bytes(path) / 1000, 2)


def make_upload_hash(image_path: Path) -> str:
    digest = hashlib.sha1(image_path.read_bytes()).hexdigest()[:10]
    return f"{image_path.stem.replace('-', '_')}_{digest}"


def save_jpeg(image: Image.Image, path: Path) -> None:
    image.save(path, "JPEG", quality=85, optimize=True)


def create_upload_files(source_path: Path, uploads_dir: Path) -> tuple[str, str, int, int, str]:
    with Image.open(source_path) as image:
        image = image.convert("RGB")
        width, height = image.size
        upload_hash = make_upload_hash(source_path)
        ext = ".jpg"
        original_name = f"{upload_hash}{ext}"
        original_path = uploads_dir / original_name

        if not original_path.exists():
            shutil.copy2(source_path, original_path)

        formats = {}
        for label, max_size in (
            ("thumbnail", 245),
            ("small", 500),
            ("medium", 750),
            ("large", 1000),
        ):
            variant = image.copy()
            variant.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            variant_name = f"{label}_{upload_hash}{ext}"
            variant_path = uploads_dir / variant_name
            if not variant_path.exists():
                save_jpeg(variant, variant_path)
            variant_width, variant_height = variant.size
            formats[label] = {
                "name": f"{label}_{source_path.name}",
                "hash": f"{label}_{upload_hash}",
                "ext": ext,
                "mime": "image/jpeg",
                "path": None,
                "width": variant_width,
                "height": variant_height,
                "size": file_size_kb(variant_path),
                "sizeInBytes": image_size_bytes(variant_path),
                "url": f"/uploads/{variant_name}",
            }

    return upload_hash, json.dumps(formats, ensure_ascii=False), width, height, f"/uploads/{original_name}"


def find_category_ids(cur: sqlite3.Cursor, slug: str) -> tuple[int | None, int | None]:
    draft_id = None
    published_id = None
    for row in cur.execute(
        "select id, published_at from categories where slug = ? order by id",
        (slug,),
    ).fetchall():
        if row["published_at"] is None:
            draft_id = row["id"]
        else:
            published_id = row["id"]
    return draft_id, published_id


def ensure_category(cur: sqlite3.Cursor, name: str, slug: str) -> tuple[int, int]:
    draft_id, published_id = find_category_ids(cur, slug)
    if draft_id and published_id:
        return draft_id, published_id

    timestamp = now_ms()
    doc_id = document_id()
    if not draft_id:
        cur.execute(
            """
            insert into categories
            (document_id, name, description, slug, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (doc_id, name, None, slug, timestamp, timestamp, None, 1, 1, None),
        )
        draft_id = cur.lastrowid
    else:
        doc_id = cur.execute("select document_id from categories where id = ?", (draft_id,)).fetchone()["document_id"]

    if not published_id:
        cur.execute(
            """
            insert into categories
            (document_id, name, description, slug, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (doc_id, name, None, slug, timestamp, timestamp, timestamp, 1, 1, None),
        )
        published_id = cur.lastrowid

    return draft_id, published_id


def ensure_file(cur: sqlite3.Cursor, source_path: Path, uploads_dir: Path) -> int:
    existing = cur.execute(
        "select id, url from files where name = ? order by id limit 1",
        (source_path.name,),
    ).fetchone()
    if existing:
        return int(existing["id"])

    timestamp = now_ms()
    upload_hash, formats, width, height, url = create_upload_files(source_path, uploads_dir)
    cur.execute(
        """
        insert into files
        (document_id, name, alternative_text, caption, width, height, formats, hash, ext, mime, size,
         url, preview_url, provider, provider_metadata, folder_path, created_at, updated_at, published_at,
         created_by_id, updated_by_id, locale, focal_point)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            document_id(),
            source_path.name,
            None,
            None,
            width,
            height,
            formats,
            upload_hash,
            ".jpg",
            "image/jpeg",
            file_size_kb(source_path),
            url,
            None,
            "local",
            None,
            "/",
            timestamp,
            timestamp,
            timestamp,
            1,
            1,
            None,
            None,
        ),
    )
    return int(cur.lastrowid)


def existing_artwork_rows(cur: sqlite3.Cursor, slug: str) -> tuple[sqlite3.Row | None, sqlite3.Row | None]:
    draft = None
    published = None
    rows = cur.execute("select * from artworks where slug = ? order by id", (slug,)).fetchall()
    for row in rows:
        if row["published_at"] is None:
            draft = row
        else:
            published = row
    return draft, published


def upsert_artwork_row(
    cur: sqlite3.Cursor,
    *,
    row_id: int | None,
    document_id_value: str,
    item: GalleryItem,
    price: float,
    medium: str,
    year: int | None,
    is_featured: bool,
    published: bool,
) -> int:
    timestamp = now_ms()
    description = blocks(item.description)
    published_at = timestamp if published else None
    if row_id:
        cur.execute(
            """
            update artworks
            set title = ?, description = ?, price = ?, dimensions = ?, medium = ?, year_created = ?,
                is_available = ?, slug = ?, updated_at = ?, published_at = ?, updated_by_id = ?, is_featured = ?
            where id = ?
            """,
            (
                item.title,
                description,
                price,
                None,
                medium,
                year,
                1,
                item.slug,
                timestamp,
                published_at,
                1,
                1 if is_featured else 0,
                row_id,
            ),
        )
        return row_id

    cur.execute(
        """
        insert into artworks
        (document_id, title, description, price, dimensions, medium, year_created, is_available, slug,
         created_at, updated_at, published_at, created_by_id, updated_by_id, locale, is_featured)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            document_id_value,
            item.title,
            description,
            price,
            None,
            medium,
            year,
            1,
            item.slug,
            timestamp,
            timestamp,
            published_at,
            1,
            1,
            None,
            1 if is_featured else 0,
        ),
    )
    return int(cur.lastrowid)


def set_category(cur: sqlite3.Cursor, artwork_id: int, category_id: int) -> None:
    cur.execute("delete from artworks_category_lnk where artwork_id = ?", (artwork_id,))
    cur.execute(
        "insert into artworks_category_lnk (artwork_id, category_id, artwork_ord) values (?, ?, ?)",
        (artwork_id, category_id, None),
    )


def set_image(cur: sqlite3.Cursor, artwork_id: int, file_id: int) -> None:
    cur.execute(
        """
        delete from files_related_mph
        where related_id = ? and related_type = ? and field = ?
        """,
        (artwork_id, ARTWORK_TYPE, IMAGE_FIELD),
    )
    cur.execute(
        """
        insert into files_related_mph (file_id, related_id, related_type, field, "order")
        values (?, ?, ?, ?, ?)
        """,
        (file_id, artwork_id, ARTWORK_TYPE, IMAGE_FIELD, 1.0),
    )


def archive_sample_artwork(cur: sqlite3.Cursor) -> int:
    timestamp = now_ms()
    cur.execute(
        """
        update artworks
        set is_available = 0, published_at = null, updated_at = ?
        where slug = 'sample-painting'
        """,
        (timestamp,),
    )
    return cur.rowcount


def import_catalog(args: argparse.Namespace) -> None:
    root = repo_root()
    cms = cms_root()
    db_path = cms / ".tmp" / "data.db"
    images_dir = root / "frontend" / "images"
    uploads_dir = cms / "public" / "uploads"

    if not db_path.exists():
        raise SystemExit(f"Strapi SQLite database not found: {db_path}")
    if not images_dir.exists():
        raise SystemExit(f"Frontend image directory not found: {images_dir}")

    gallery_js = fetch_gallery_js(args.source_url)
    items = parse_gallery_items(gallery_js)
    if not items:
        raise SystemExit("No gallery items found in source JS.")

    missing = [item.image for item in items if not (root / "frontend" / item.image).exists()]
    if missing:
        raise SystemExit("Missing local image files:\n" + "\n".join(missing))

    print(f"Found {len(items)} gallery artworks to import.")
    if args.dry_run:
        for item in items:
            print(f"[dry-run] {item.image} -> {item.title} ({item.slug})")
        return

    backup_path = db_path.with_suffix(f".before-shop-import-{time.strftime('%Y%m%d-%H%M%S')}.bak")
    shutil.copy2(db_path, backup_path)
    print(f"Database backup created: {backup_path}")

    uploads_dir.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=30)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        pen_draft_id, pen_published_id = ensure_category(cur, "Pen & Ink Drawings", PUBLISHED_CATEGORY_SLUG)
        sketch_draft_id, sketch_published_id = ensure_category(cur, "Sketches", SKETCH_CATEGORY_SLUG)

        created = 0
        updated = 0
        for item in items:
            image_path = root / "frontend" / item.image
            file_id = ensure_file(cur, image_path, uploads_dir)
            draft_row, published_row = existing_artwork_rows(cur, item.slug)
            doc_id = (
                draft_row["document_id"]
                if draft_row
                else published_row["document_id"]
                if published_row
                else document_id()
            )
            is_featured = item.image_number <= args.featured_count
            is_sketch = item.image_number in {36, 37, 38, 39}

            draft_id = upsert_artwork_row(
                cur,
                row_id=draft_row["id"] if draft_row else None,
                document_id_value=doc_id,
                item=item,
                price=args.default_price,
                medium=args.medium,
                year=args.year,
                is_featured=is_featured,
                published=False,
            )
            published_id = upsert_artwork_row(
                cur,
                row_id=published_row["id"] if published_row else None,
                document_id_value=doc_id,
                item=item,
                price=args.default_price,
                medium=args.medium,
                year=args.year,
                is_featured=is_featured,
                published=True,
            )

            set_category(cur, draft_id, sketch_draft_id if is_sketch else pen_draft_id)
            set_category(cur, published_id, sketch_published_id if is_sketch else pen_published_id)
            set_image(cur, draft_id, file_id)
            set_image(cur, published_id, file_id)

            if draft_row or published_row:
                updated += 1
            else:
                created += 1

        archived = archive_sample_artwork(cur)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"Imported catalog: {created} created, {updated} updated, sample rows archived: {archived}.")
    print(f"Default price applied to every artwork: INR {args.default_price:,.0f}")
    print("Frontend shop UI was not modified.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import legacy gallery artworks into local Strapi shop catalog.")
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_URL, help="URL for the legacy static gallery JS.")
    parser.add_argument("--default-price", type=float, default=5000, help="Price applied to every imported artwork.")
    parser.add_argument("--medium", default="Pen and ink", help="Medium value for imported artworks.")
    parser.add_argument("--year", type=int, default=2024, help="Year value for imported artworks.")
    parser.add_argument("--featured-count", type=int, default=6, help="Mark the first N gallery artworks as featured.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be imported without changing files or DB.")
    args = parser.parse_args()
    import_catalog(args)


if __name__ == "__main__":
    main()
