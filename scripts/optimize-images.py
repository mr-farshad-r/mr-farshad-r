"""Generate responsive article images; requires the cwebp command."""

import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
images = sorted((root / "assets/images/posts").glob("*.jpg"))
assert images, "No source images found"
original_bytes = sum(image.stat().st_size for image in images)
for width in (384, 768, 1536):
    total = 0
    for image in images:
        target = image.with_name(f"{image.stem}-{width}.webp")
        subprocess.run(["cwebp", "-quiet", "-q", "82", "-resize", str(width),
                        "0", "-metadata", "none", str(image), "-o", str(target)],
                       check=True)
        data = target.read_bytes()
        assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", target
        assert len(data) < image.stat().st_size, f"Image grew: {target}"
        total += len(data)
    print(f"{width}px: {total:,} bytes vs {original_bytes:,} original "
          f"({1 - total / original_bytes:.1%} smaller)")
