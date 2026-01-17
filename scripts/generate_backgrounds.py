#!/usr/bin/env python3
"""
Generate 20 top-down pixel-art backgrounds and update backgroundConfig.ts.

Usage:
  1. export OPENAI_API_KEY="your_key"
  2. python3 scripts/generate_backgrounds.py

The script will:
  - Generate 20 background images in src/assets/backgrounds/
  - Auto-update src/mainGame/backgroundConfig.ts with correct filenames
"""

from __future__ import annotations

import os
import json
import time
import base64
import random
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

import requests

# ----------------------------
# Config
# ----------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
if not OPENAI_API_KEY:
    raise SystemExit("Missing OPENAI_API_KEY env var. Set it and rerun.")

# Use gpt-image-1 or dall-e-3 depending on your access
IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "dall-e-3")
IMAGE_SIZE = os.getenv("OPENAI_IMAGE_SIZE", "1024x1024")

# Paths relative to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(PROJECT_ROOT, "src/assets/backgrounds")
CONFIG_PATH = os.path.join(PROJECT_ROOT, "src/mainGame/backgroundConfig.ts")


@dataclass
class BackgroundSpec:
    id: str
    title: str
    description: str
    tags: List[str]


# 20 Background Specifications with tags for AI matching
SPECS: List[BackgroundSpec] = [
    BackgroundSpec("bg1", "Sunny Meadow Clearing",
                   "Bright grass, soft wildflowers, warm midday sunlight. Child-friendly, simple composition.",
                   ["sunshine", "happy", "bright", "meadow", "flowers"]),
    BackgroundSpec("bg2", "Rainbow Field",
                   "Pastel meadow with a soft rainbow arc and sparkly accents. Cheerful, playful magic vibe.",
                   ["rainbow", "colorful", "sky", "joyful", "clouds"]),
    BackgroundSpec("bg3", "Dark Enchanted Forest",
                   "Mysterious forest with deep shadows and glowing elements. Magical but not scary.",
                   ["dark", "mysterious", "forest", "spooky", "night"]),
    BackgroundSpec("bg4", "Ocean Sunset Beach",
                   "Warm sunset over calm ocean waters with sandy beach. Peaceful and relaxing.",
                   ["ocean", "sunset", "beach", "peaceful", "waves"]),
    BackgroundSpec("bg5", "Snowy Mountain Peak",
                   "Snow-covered mountain clearing with cool blue shadows. Majestic winter feel.",
                   ["snow", "mountain", "cold", "winter", "majestic"]),
    BackgroundSpec("bg6", "Magical Castle Grounds",
                   "Fantasy castle courtyard with magical sparkles. Royal and enchanting.",
                   ["castle", "magical", "fantasy", "fairy tale", "royal"]),
    BackgroundSpec("bg7", "Space Nebula",
                   "Cosmic space scene with colorful nebula and stars. Dreamy and vast.",
                   ["space", "stars", "nebula", "cosmic", "galaxy"]),
    BackgroundSpec("bg8", "Autumn Park Path",
                   "Orange and red leaves scattered over dirt paths. Cozy fall mood.",
                   ["autumn", "leaves", "park", "orange", "peaceful"]),
    BackgroundSpec("bg9", "Underwater Coral Reef",
                   "Vibrant coral reef with fish silhouettes. Blue and colorful underwater world.",
                   ["underwater", "ocean", "coral", "fish", "blue"]),
    BackgroundSpec("bg10", "Cherry Blossom Garden",
                   "Pink cherry blossom trees with petals floating. Spring Japanese garden feel.",
                   ["cherry", "blossom", "pink", "spring", "japan"]),
    BackgroundSpec("bg11", "Desert Sand Dunes",
                   "Warm desert landscape with rolling sand dunes. Adventure and exploration vibe.",
                   ["desert", "sand", "hot", "dry", "adventure"]),
    BackgroundSpec("bg12", "City Night Skyline",
                   "Nighttime city with glowing lights and modern buildings. Urban energy.",
                   ["city", "night", "lights", "urban", "modern"]),
    BackgroundSpec("bg13", "Enchanted Garden",
                   "Magical garden with glowing flowers and fantasy plants. Whimsical nature.",
                   ["garden", "enchanted", "flowers", "magical", "nature"]),
    BackgroundSpec("bg14", "Stormy Sky",
                   "Dramatic clouds with thunder and lightning. Intense but exciting.",
                   ["storm", "clouds", "dramatic", "thunder", "intense"]),
    BackgroundSpec("bg15", "Cozy Cabin Interior",
                   "Warm wooden cabin with fireplace glow. Safe and comfortable.",
                   ["cabin", "cozy", "warm", "home", "comfort"]),
    BackgroundSpec("bg16", "Tropical Jungle",
                   "Dense green jungle with tropical plants. Wild adventure awaits.",
                   ["jungle", "tropical", "adventure", "green", "wild"]),
    BackgroundSpec("bg17", "Floating Islands",
                   "Fantasy floating islands in the sky with waterfalls. Surreal and dreamy.",
                   ["floating", "islands", "fantasy", "dreamy", "surreal"]),
    BackgroundSpec("bg18", "Northern Lights",
                   "Aurora borealis dancing over arctic landscape. Magical night sky.",
                   ["aurora", "northern lights", "night", "magical", "arctic"]),
    BackgroundSpec("bg19", "Candy Land",
                   "Whimsical candy-themed landscape with sweets everywhere. Fun and colorful.",
                   ["candy", "sweet", "colorful", "fun", "whimsical"]),
    BackgroundSpec("bg20", "Ancient Temple Ruins",
                   "Mysterious ancient ruins with vines and stone. History and adventure.",
                   ["ancient", "ruins", "history", "mystery", "adventure"]),
]


def build_prompt(spec: BackgroundSpec) -> str:
    """Build the image generation prompt."""
    return f"""
Create a single, standalone 2D pixel-art background for a child-friendly game.

STYLE:
- Top-down orthographic (bird's-eye view), completely flat camera, like a classic RPG map tile.
- Clean pixel art, crisp edges, readable shapes, high color harmony.
- No characters, no animals, no UI, no text, no labels, no watermarks.

SCENE:
- Theme: {spec.title}
- Description: {spec.description}

COLOR/LIGHT:
- Match these mood tags: {", ".join(spec.tags)}
- Child-friendly, bright, pleasant palette.

OUTPUT:
- One cohesive background image, suitable for a game scene.
""".strip()


def call_images_api(prompt: str, *, retries: int = 6, timeout_s: int = 120) -> bytes:
    """Call OpenAI Images API and return PNG bytes."""
    url = "https://api.openai.com/v1/images/generations"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: Dict[str, Any] = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "n": 1,
        "size": IMAGE_SIZE,
        "response_format": "b64_json",
    }

    backoff = 2.0
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=timeout_s)
            if r.status_code == 200:
                data = r.json()
                b64 = data["data"][0].get("b64_json")
                if not b64:
                    # Try URL fallback for dall-e-3
                    url_field = data["data"][0].get("url")
                    if url_field:
                        img_response = requests.get(url_field, timeout=60)
                        return img_response.content
                    raise RuntimeError(f"No image data in response: {data}")
                return base64.b64decode(b64)

            if r.status_code in (429, 500, 502, 503, 504):
                sleep_s = backoff + random.random()
                print(f"[warn] HTTP {r.status_code}. Retry {attempt}/{retries} in {sleep_s:.1f}s")
                time.sleep(sleep_s)
                backoff *= 1.8
                continue

            raise RuntimeError(f"HTTP {r.status_code}: {r.text}")

        except (requests.Timeout, requests.ConnectionError) as e:
            sleep_s = backoff + random.random()
            print(f"[warn] Network error: {e}. Retry {attempt}/{retries} in {sleep_s:.1f}s")
            time.sleep(sleep_s)
            backoff *= 1.8

    raise RuntimeError("Failed after retries.")


def safe_filename(s: str) -> str:
    """Convert title to safe filename."""
    keep = []
    for ch in s.lower():
        if ch.isalnum():
            keep.append(ch)
        elif ch in (" ", "-", "_"):
            keep.append("_")
    name = "".join(keep).strip("_")
    while "__" in name:
        name = name.replace("__", "_")
    return name[:50] or "background"


def generate_config_ts(specs: List[BackgroundSpec], filenames: Dict[str, str]) -> str:
    """Generate the TypeScript config file content."""
    lines = [
        '/**',
        ' * Background Configuration',
        ' * ',
        ' * AUTO-GENERATED by scripts/generate_backgrounds.py',
        ' * Do not edit manually - regenerate using the script.',
        ' */',
        '',
        'export interface BackgroundImage {',
        '  id: string;',
        '  filename: string;',
        '  tags: string[];',
        '}',
        '',
        'export const backgrounds: BackgroundImage[] = [',
    ]
    
    for spec in specs:
        filename = filenames.get(spec.id, f"{spec.id}.png")
        tags_str = ', '.join(f'"{tag}"' for tag in spec.tags)
        lines.append(f'  {{ id: "{spec.id}", filename: "{filename}", tags: [{tags_str}] }},')
    
    lines.extend([
        '];',
        '',
        '// Default fallback background if matching fails',
        'export const defaultBackground = backgrounds[0];',
        '',
    ])
    
    return '\n'.join(lines)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    filenames: Dict[str, str] = {}
    
    print(f"Generating {len(SPECS)} backgrounds...")
    print(f"Output directory: {OUT_DIR}")
    print(f"Using model: {IMAGE_MODEL}")
    print("-" * 50)

    for i, spec in enumerate(SPECS, 1):
        print(f"\n[{i:02d}/{len(SPECS)}] Generating: {spec.title}")
        
        prompt = build_prompt(spec)
        
        try:
            img_bytes = call_images_api(prompt)
            
            # Create filename
            filename = f"{safe_filename(spec.title)}.png"
            filepath = os.path.join(OUT_DIR, filename)
            
            # Save image
            with open(filepath, "wb") as f:
                f.write(img_bytes)
            
            filenames[spec.id] = filename
            print(f"    ✓ Saved: {filename}")
            
            # Rate limit pause
            time.sleep(1.0)
            
        except Exception as e:
            print(f"    ✗ Failed: {e}")
            filenames[spec.id] = f"{spec.id}_placeholder.png"

    # Update TypeScript config
    print("\n" + "-" * 50)
    print("Updating backgroundConfig.ts...")
    
    config_content = generate_config_ts(SPECS, filenames)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        f.write(config_content)
    
    print(f"✓ Updated: {CONFIG_PATH}")

    # Save manifest for reference
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    manifest = [
        {
            "id": spec.id,
            "title": spec.title,
            "filename": filenames.get(spec.id),
            "tags": spec.tags
        }
        for spec in SPECS
    ]
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    
    print(f"✓ Saved manifest: {manifest_path}")
    
    print("\n" + "=" * 50)
    print("DONE!")
    print(f"Generated {len([f for f in filenames.values() if 'placeholder' not in f])} backgrounds")
    print(f"Images: {OUT_DIR}/")
    print(f"Config: {CONFIG_PATH}")


if __name__ == "__main__":
    main()
