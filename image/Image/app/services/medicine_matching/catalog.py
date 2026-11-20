import json
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "medicine_catalog.json"

def load_catalog():
    with open(CATALOG_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)
    return [item for item in data.get("medicines", []) if item.get("reviewed") is True]
