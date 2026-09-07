#!/usr/bin/env python3
"""
Apply approved artwork descriptions from docs to the local Strapi SQLite DB.

The gallery and artwork detail pages read the Strapi blocks field, so this
script stores each note as Strapi-compatible paragraph blocks.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


SECTION_RE = re.compile(
    r"^##\s+(?P<number>\d+)\.\s+(?P<title>.+?)\s*"
    r"\n\s*Document ID:\s*`(?P<document_id>[^`]+)`\s*"
    r"\n\s*(?P<description>.*?)(?=\n##\s+\d+\.\s+|\Z)",
    re.MULTILINE | re.DOTALL,
)


@dataclass(frozen=True)
class ArtworkDescription:
    number: int
    title: str
    document_id: str
    description: str


def cms_root() -> Path:
    return Path(__file__).resolve().parents[1]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def now_ms() -> int:
    return int(time.time() * 1000)


def parse_descriptions(path: Path) -> list[ArtworkDescription]:
    source = path.read_text(encoding="utf-8")
    items = [
        ArtworkDescription(
            number=int(match.group("number")),
            title=match.group("title").strip(),
            document_id=match.group("document_id").strip(),
            description=match.group("description").strip(),
        )
        for match in SECTION_RE.finditer(source)
    ]

    if not items:
        raise SystemExit(f"No artwork descriptions found in {path}")

    seen: set[str] = set()
    duplicates = sorted(
        item.document_id
        for item in items
        if item.document_id in seen or seen.add(item.document_id)
    )
    if duplicates:
        raise SystemExit(f"Duplicate document IDs in description file: {', '.join(duplicates)}")

    missing_description = [item.title for item in items if not item.description]
    if missing_description:
        raise SystemExit(f"Missing descriptions for: {', '.join(missing_description)}")

    return items


def blocks(description: str) -> str:
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", description) if paragraph.strip()]
    return json.dumps(
        [
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": paragraph}],
            }
            for paragraph in paragraphs
        ],
        ensure_ascii=False,
    )


def create_backup(db_path: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = db_path.with_name(f"{db_path.stem}.before-description-update-{timestamp}{db_path.suffix}.bak")
    shutil.copy2(db_path, backup_path)
    return backup_path


def apply_descriptions(db_path: Path, items: list[ArtworkDescription], dry_run: bool) -> int:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    try:
        cur = conn.cursor()
        existing = {
            row["document_id"]: {
                "title": row["title"],
                "rows": row["rows"],
            }
            for row in cur.execute(
                """
                select document_id, min(title) as title, count(*) as rows
                from artworks
                group by document_id
                """
            ).fetchall()
        }

        missing = [item for item in items if item.document_id not in existing]
        if missing:
            missing_list = ", ".join(f"{item.title} ({item.document_id})" for item in missing)
            raise SystemExit(f"Descriptions not applied. Missing Strapi artworks: {missing_list}")

        timestamp = now_ms()
        updated_rows = 0
        for item in items:
            cur.execute(
                """
                update artworks
                set description = ?, updated_at = ?
                where document_id = ?
                """,
                (blocks(item.description), timestamp, item.document_id),
            )
            updated_rows += cur.rowcount

        if dry_run:
            conn.rollback()
        else:
            conn.commit()

        return updated_rows
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply approved artwork descriptions to local Strapi.")
    parser.add_argument(
        "--source",
        type=Path,
        default=repo_root() / "docs" / "artwork-descriptions-modern-artist.md",
        help="Markdown file containing artwork description sections.",
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=cms_root() / ".tmp" / "data.db",
        help="Local Strapi SQLite database path.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate and report without changing the DB.")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup creation for non-dry runs.")
    args = parser.parse_args()

    source_path = args.source.resolve()
    db_path = args.db.resolve()

    if not source_path.exists():
        raise SystemExit(f"Description source not found: {source_path}")
    if not db_path.exists():
        raise SystemExit(f"Strapi SQLite database not found: {db_path}")

    items = parse_descriptions(source_path)
    backup_path = None
    if not args.dry_run and not args.no_backup:
        backup_path = create_backup(db_path)

    updated_rows = apply_descriptions(db_path, items, args.dry_run)

    mode = "validated" if args.dry_run else "updated"
    print(f"{mode} {len(items)} artwork descriptions")
    print(f"affected_rows={updated_rows}")
    if backup_path:
        print(f"backup={backup_path}")


if __name__ == "__main__":
    main()
