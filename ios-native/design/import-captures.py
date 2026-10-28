#!/usr/bin/env python3
"""Import named XCTest captures into the offline InfoHub design catalog."""

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, features

HERE = Path(__file__).resolve().parent
SUFFIX = re.compile(r"_\d+_[0-9A-F-]+\.png$", re.IGNORECASE)

if len(sys.argv) < 2:
    raise SystemExit("Usage: python3 import-captures.py <xcresult attachment export> [...]")
if not features.check("webp"):
    raise SystemExit("Pillow with WebP support is required")

captures = {}
for argument in sys.argv[1:]:
    directory = Path(argument)
    for test in json.loads((directory / "manifest.json").read_text(encoding="utf-8")):
        for attachment in test["attachments"]:
            name = attachment.get("suggestedHumanReadableName", "")
            if not SUFFIX.search(name):
                continue
            name = SUFFIX.sub("", name)
            if name not in captures or attachment["timestamp"] > captures[name]["timestamp"]:
                captures[name] = {**attachment, "test": test["testIdentifier"], "directory": directory}

catalog = json.loads((HERE / "catalog-map.json").read_text(encoding="utf-8"))
previous_path = HERE / "catalog.json"
previous = {}
if previous_path.exists():
    old_catalog = json.loads(previous_path.read_text(encoding="utf-8"))
    previous = {
        (item["id"], frame["theme"]): frame
        for group in old_catalog["groups"] for item in group["items"] for frame in item["frames"]
    }

def retained_capture(item, frame):
    old = previous.get((item["id"], frame["theme"]))
    if not old or old.get("capture") != frame["capture"]:
        return None
    path = (HERE / old["src"]).resolve()
    if path.parent != (HERE / "screens").resolve() or not path.is_file():
        return None
    return old if hashlib.sha256(path.read_bytes()).hexdigest() == old.get("sha256") else None

missing = [
    frame["capture"]
    for group in catalog["groups"] for item in group["items"] for frame in item["frames"]
    if frame["capture"] not in captures and not retained_capture(item, frame)
]
if missing:
    raise SystemExit("Missing captures: " + ", ".join(missing))

(HERE / "screens").mkdir(exist_ok=True)
imported = 0
retained = 0
for group in catalog["groups"]:
    for item in group["items"]:
        for frame in item["frames"]:
            if frame["capture"] not in captures:
                frame.update(retained_capture(item, frame))
                retained += 1
                continue
            capture = captures[frame["capture"]]
            destination = HERE / "screens" / f'{item["id"]}-{frame["theme"]}.webp'
            with Image.open(capture["directory"] / capture["exportedFileName"]) as source:
                has_transparency = "A" in source.getbands() and source.getchannel("A").getextrema() != (255, 255)
                image = source.convert("RGBA" if has_transparency else "RGB")
                image.save(destination, format="WEBP", lossless=True, method=4, exact=True)
                with Image.open(destination) as output:
                    if output.mode != image.mode or output.size != image.size or output.tobytes() != image.tobytes():
                        raise ValueError(f'Pixel mismatch: {frame["capture"]}')
                frame.update({
                    "src": f"screens/{destination.name}",
                    "width": image.width,
                    "height": image.height,
                    "test": capture["test"],
                    "device": capture["deviceName"],
                    "captured": datetime.fromtimestamp(capture["timestamp"], timezone.utc).isoformat(),
                    "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
                })
                imported += 1

(HERE / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f'Imported {imported} pixel-verified captures; retained {retained} verified captures.')
