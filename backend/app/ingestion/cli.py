"""Command-line interface for the data ingestion pipeline.

The ``scripts/data/import_*.py`` files are thin wrappers around
:func:`run_cli`; ``scripts/data/import_all.py`` wraps :func:`run_cli_all`.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlmodel import Session

from app.database import engine
from app.ingestion.importer import DOMAIN_SPECS, run_import


def _add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--file", required=True, help="Path to the CSV file to import")
    parser.add_argument("--dry-run", action="store_true", help="Validate only — write nothing")
    parser.add_argument("--source", help="Override the provenance source name")
    parser.add_argument("--source-url", help="Provenance: URL the dataset came from")
    parser.add_argument("--data-year", type=int, help="Provenance: reference year of the dataset")


def run_cli(domain: str, argv: list[str] | None = None) -> int:
    """Run one domain import from CLI args.  Returns a process exit code."""
    parser = argparse.ArgumentParser(description=f"Import {domain} CSV data into Supabase")
    _add_common_args(parser)
    if domain == "markets":
        parser.add_argument(
            "--kind",
            choices=["markets", "market_prices"],
            default="markets",
            help="Whether this CSV holds market locations or daily prices",
        )
    args = parser.parse_args(argv)

    actual_domain = args.kind if domain == "markets" else domain
    with Session(engine) as db:
        report = run_import(
            db,
            actual_domain,
            args.file,
            source=args.source,
            source_url=args.source_url,
            data_year=args.data_year,
            dry_run=args.dry_run,
        )
    print(report.summary())
    return 1 if report.rejected else 0


def run_cli_all(argv: list[str] | None = None) -> int:
    """Unified runner: one file via --domain/--file, or every CSV under data/raw/."""
    parser = argparse.ArgumentParser(
        description="Run data imports — a single file, or every CSV under data/raw/<domain>/"
    )
    parser.add_argument("--domain", choices=sorted(DOMAIN_SPECS), help="Domain to import")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Import every CSV found under data/raw/<domain>/ for every domain",
    )
    parser.add_argument(
        "--data-dir",
        default="data/raw",
        help="Root folder scanned in --all mode (default: data/raw)",
    )
    _add_common_args(parser)
    args = parser.parse_args(argv)

    if args.all:
        jobs = []
        for domain in sorted(DOMAIN_SPECS):
            domain_dir = Path(args.data_dir) / domain
            for csv_path in sorted(domain_dir.glob("*.csv")):
                jobs.append((domain, csv_path))
        if not jobs:
            print(f"no CSV files found under {args.data_dir}/")
            return 0
    elif args.domain and args.file:
        jobs = [(args.domain, args.file)]
    else:
        parser.error("either --all, or both --domain and --file, are required")
        return 2

    rejected = 0
    for domain, path in jobs:
        with Session(engine) as db:
            report = run_import(
                db,
                domain,
                path,
                source=args.source,
                source_url=args.source_url,
                data_year=args.data_year,
                dry_run=args.dry_run,
            )
        print(report.summary())
        print()
        rejected += report.rejected
    return 1 if rejected else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(run_cli_all())
