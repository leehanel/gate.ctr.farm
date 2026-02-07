#!/usr/bin/env python3
"""
Build script for the gate.ctr.farm static site.

Reads Jinja2 templates, locale/data JSON files, and static assets,
then writes everything to the docs/ directory ready for deployment
to Cloudflare Pages (or any static hosting).

Usage:
    python build.py
"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
TEMPLATES_DIR = ROOT / "templates"
STATIC_DIR = ROOT / "static"
PUBLIC_DIR = ROOT / "public"
LOCALES_DIR = ROOT / "locales"
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "docs"


def load_json(path: Path) -> dict | list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build():
    # ── lazy import so the script gives a clear error if jinja2 is missing ──
    try:
        from jinja2 import Environment, FileSystemLoader
    except ImportError:
        print("ERROR: jinja2 is not installed.")
        print("  Run:  pip install -r requirements.txt")
        raise SystemExit(1)

    print("Building site...")

    # ── Load data ──
    locales = {}
    for locale_file in sorted(LOCALES_DIR.glob("*.json")):
        lang = locale_file.stem
        locales[lang] = load_json(locale_file)
        print(f"  Loaded locale: {lang}")

    contacts = load_json(DATA_DIR / "contacts.json")
    print(f"  Loaded contacts ({len(contacts)} groups)")

    # ── Template context ──
    context = {
        "locales_json": json.dumps(locales, ensure_ascii=False),
        "contacts_json": json.dumps(contacts, ensure_ascii=False),
    }

    # ── Set up Jinja2 ──
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,  # templates output trusted JSON / known HTML
    )

    # ── Clean output directory ──
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    # ── Render pages ──
    pages = {
        "index.html": "index.html",
        "playground.html": "playground/index.html",
        "guests.html": "guests/index.html",
        "pin_generator.html": "pin-generator/index.html",
    }

    for template_name, output_path in pages.items():
        template = env.get_template(template_name)
        html = template.render(**context)
        out_file = OUTPUT_DIR / output_path
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(html, encoding="utf-8")
        print(f"  Rendered: {output_path}")

    # ── Copy static assets (JS, CSS) ──
    if STATIC_DIR.exists():
        shutil.copytree(STATIC_DIR, OUTPUT_DIR / "static")
        print("  Copied: static/")

    # ── Copy public assets (images, favicon, 404.html, etc.) ──
    if PUBLIC_DIR.exists():
        for item in PUBLIC_DIR.iterdir():
            dest = OUTPUT_DIR / item.name
            if item.is_dir():
                shutil.copytree(item, dest)
            else:
                shutil.copy2(item, dest)
        print("  Copied: public/ contents")

    print(f"\n✅ Build complete!  Output in {OUTPUT_DIR}/")


if __name__ == "__main__":
    build()
