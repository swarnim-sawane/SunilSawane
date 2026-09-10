from __future__ import annotations

import csv
import importlib.util
import tempfile
import unittest
import zipfile
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "import_artwork_series.py"
SPEC = importlib.util.spec_from_file_location("import_artwork_series", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class ArtworkSeriesImportTests(unittest.TestCase):
    def write_manifest(self, directory: Path, rows: list[dict[str, str]]) -> Path:
        path = directory / "series.csv"
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["filename", "caption", "description", "series", "dimensions"],
            )
            writer.writeheader()
            for row in rows:
                row.setdefault("dimensions", "12 x 16 in")
            writer.writerows(rows)
        return path

    def make_zip(self, directory: Path, names: list[str]) -> Path:
        path = directory / "series.zip"
        with zipfile.ZipFile(path, "w") as archive:
            for name in names:
                archive.writestr(name, b"\xff\xd8\xff\xe0test-jpeg")
        return path

    def test_validates_matching_manifest_and_zip(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            rows = [
                {
                    "filename": "first.jpg",
                    "caption": "First Work",
                    "description": "A complete description.",
                    "series": "All That Breathes",
                },
                {
                    "filename": "second.jpg",
                    "caption": "Second Work",
                    "description": "Another complete description.",
                    "series": "All That Breathes",
                },
            ]

            items = MODULE.load_manifest(self.write_manifest(root, rows))
            archive_path = self.make_zip(root, ["first.jpg", "second.jpg"])
            entries = MODULE.inspect_archive(archive_path, items)

            self.assertEqual([item.slug for item in items], ["first-work", "second-work"])
            self.assertEqual(set(entries), {"first.jpg", "second.jpg"})

    def test_rejects_duplicate_slugs_before_uploading(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            rows = [
                {
                    "filename": "first.jpg",
                    "caption": "Same Work",
                    "description": "Description one.",
                    "series": "All That Breathes",
                },
                {
                    "filename": "second.jpg",
                    "caption": "Same-Work",
                    "description": "Description two.",
                    "series": "All That Breathes",
                },
            ]

            with self.assertRaisesRegex(ValueError, "Duplicate artwork slugs"):
                MODULE.load_manifest(self.write_manifest(root, rows))

    def test_rejects_unsafe_or_mismatched_zip_entries(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            rows = [
                {
                    "filename": "first.jpg",
                    "caption": "First Work",
                    "description": "A complete description.",
                    "series": "All That Breathes",
                }
            ]
            items = MODULE.load_manifest(self.write_manifest(root, rows))
            archive_path = self.make_zip(root, ["../first.jpg"])

            with self.assertRaisesRegex(ValueError, "Unsafe ZIP entry"):
                MODULE.inspect_archive(archive_path, items)

    def test_builds_published_available_artwork_payload(self):
        item = MODULE.ArtworkRow(
            filename="first.jpg",
            caption="First Work",
            description="A complete description.",
            series="All That Breathes",
            dimensions="13 x 16.5 in",
            slug="first-work",
        )

        payload = MODULE.build_artwork_payload(
            item,
            category_document_id="category-document-id",
            price=7999,
            year=2026,
            medium="Pen and ink",
        )

        self.assertEqual(payload["title"], "First Work")
        self.assertEqual(payload["price"], 7999)
        self.assertEqual(payload["availabilityStatus"], "available")
        self.assertTrue(payload["isAvailable"])
        self.assertFalse(payload["isFeatured"])
        self.assertEqual(payload["seriesName"], "All That Breathes")
        self.assertEqual(payload["dimensions"], "13 x 16.5 in")
        self.assertEqual(payload["category"], "category-document-id")
        self.assertEqual(payload["Description"][0]["children"][0]["text"], "A complete description.")

    def test_rejects_malformed_dimensions_before_uploading(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            rows = [
                {
                    "filename": "first.jpg",
                    "caption": "First Work",
                    "description": "A complete description.",
                    "series": "All That Breathes",
                    "dimensions": "about twelve inches",
                }
            ]

            with self.assertRaisesRegex(ValueError, "invalid dimensions"):
                MODULE.load_manifest(self.write_manifest(root, rows))

    def test_import_is_resumable_without_duplicate_uploads(self):
        class FakeClient:
            def __init__(self):
                self.artworks = []
                self.uploads = 0

            def get_category_by_slug(self, slug):
                self.asserted_slug = slug
                return {"documentId": "category-document-id", "name": "Pen & Ink Drawings"}

            def list_published_artworks(self):
                return self.artworks

            def create_artwork(self, payload):
                artwork = {
                    **payload,
                    "id": len(self.artworks) + 1,
                    "documentId": f"document-{len(self.artworks) + 1}",
                    "images": [],
                }
                self.artworks.append(artwork)
                return artwork

            def update_artwork(self, document_id, payload):
                artwork = next(item for item in self.artworks if item["documentId"] == document_id)
                artwork.update(payload)
                return artwork

            def upload_artwork_image(self, artwork_id, filename, image_bytes, alternative_text):
                artwork = next(item for item in self.artworks if item["id"] == artwork_id)
                artwork["images"] = [{"id": 100 + artwork_id, "name": filename}]
                self.uploads += 1
                return artwork["images"][0]

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            rows = [
                {
                    "filename": "first.jpg",
                    "caption": "First Work",
                    "description": "A complete description.",
                    "series": "All That Breathes",
                }
            ]
            items = MODULE.load_manifest(self.write_manifest(root, rows))
            archive_path = self.make_zip(root, ["first.jpg"])
            entries = MODULE.inspect_archive(archive_path, items)
            client = FakeClient()

            first = MODULE.import_series(client, archive_path, entries, items, price=7999, year=2026)
            second = MODULE.import_series(client, archive_path, entries, items, price=7999, year=2026)

            self.assertEqual(first, {"created": 1, "updated": 0, "uploaded": 1})
            self.assertEqual(second, {"created": 0, "updated": 1, "uploaded": 0})
            self.assertEqual(len(client.artworks), 1)
            self.assertEqual(client.uploads, 1)

    def test_import_aborts_before_writes_when_slug_belongs_to_another_series(self):
        class ConflictClient:
            def __init__(self):
                self.created = False

            def get_category_by_slug(self, slug):
                return {"documentId": "category-document-id", "name": "Pen & Ink Drawings"}

            def list_published_artworks(self):
                return [
                    {
                        "id": 1,
                        "documentId": "existing-document",
                        "slug": "first-work",
                        "title": "First Work",
                        "seriesName": "Another Series",
                        "images": [],
                    }
                ]

            def create_artwork(self, payload):
                self.created = True

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            rows = [
                {
                    "filename": "first.jpg",
                    "caption": "First Work",
                    "description": "A complete description.",
                    "series": "All That Breathes",
                }
            ]
            items = MODULE.load_manifest(self.write_manifest(root, rows))
            archive_path = self.make_zip(root, ["first.jpg"])
            entries = MODULE.inspect_archive(archive_path, items)
            client = ConflictClient()

            with self.assertRaisesRegex(RuntimeError, "belongs to a different artwork or series"):
                MODULE.import_series(client, archive_path, entries, items, price=7999, year=2026)

            self.assertFalse(client.created)

    def test_dimensions_only_update_changes_no_other_artwork_fields(self):
        class DimensionsClient:
            def __init__(self):
                self.updates = []

            def list_published_artworks(self):
                return [
                    {
                        "documentId": "existing-document",
                        "slug": "first-work",
                        "title": "First Work",
                        "seriesName": "All That Breathes",
                    }
                ]

            def update_artwork(self, document_id, payload):
                self.updates.append((document_id, payload))
                return {"documentId": document_id, **payload}

        item = MODULE.ArtworkRow(
            filename="first.jpg",
            caption="First Work",
            description="A complete description.",
            series="All That Breathes",
            dimensions="14 x 19 in",
            slug="first-work",
        )
        client = DimensionsClient()

        result = MODULE.update_series_dimensions(client, [item])

        self.assertEqual(result, {"updated": 1})
        self.assertEqual(
            client.updates,
            [("existing-document", {"dimensions": "14 x 19 in"})],
        )


if __name__ == "__main__":
    unittest.main()
