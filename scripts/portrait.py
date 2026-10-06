"""Photo -> dot portrait: person mask (rembg), depth (Depth Anything V2), stippled points with real depth.

Output: portrait.json = {"n": N, "p": [x, y, z, b, ...]} with x,y in [-1,1] (y up), z in [0,1] (1 = nearest), b = brightness 0..1.
"""
import json, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps
import cv2

src, out_dir = sys.argv[1], sys.argv[2]
img = Image.open(src).convert("RGB")
if len(sys.argv) > 5:  # crop "x0,y0,x1,y1" so every pose frames the head the same way
    img = img.crop(tuple(int(v) for v in sys.argv[5].split(",")))
if len(sys.argv) > 6:  # blank out a background distraction "x0,y0,x1,y1" (cropped-image coords)
    from PIL import ImageDraw
    ImageDraw.Draw(img).rectangle(tuple(int(v) for v in sys.argv[6].split(",")), fill=(38, 34, 30))
W0, H0 = img.size
# work at ~860 px wide: upscale small photos for smooth stipple positions, downscale big ones
k = 860 / W0
big = img.resize((round(W0 * k), round(H0 * k)), Image.LANCZOS)

# 1. person mask
from rembg import remove, new_session
sess = new_session("u2net_human_seg")
cut = remove(big, session=sess, post_process_mask=True)
mask = np.asarray(cut.split()[-1]).astype(np.float32) / 255.0
# keep only the largest connected shape (the subject), dropping people in the background
n_lab, lab, stats, _ = cv2.connectedComponentsWithStats((mask > 0.5).astype(np.uint8))
if n_lab > 2:
    keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask *= cv2.dilate((lab == keep).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
# keep head and shoulders only: drop the lowest 18% (table/shirt clutter), soften edge
H, W = mask.shape
mask[int(H * 0.86):] *= np.linspace(1, 0, H - int(H * 0.86))[:, None]
mask = cv2.GaussianBlur(mask, (0, 0), 1.2)

# 2. depth
from transformers import pipeline
depth_pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf")
d = np.asarray(depth_pipe(big)["depth"].resize((W, H), Image.BILINEAR)).astype(np.float32)
m = mask > 0.5
d = (d - d[m].min()) / (d[m].max() - d[m].min() + 1e-6)

# 3. tone: local contrast so curls, glasses and features read
gray = np.asarray(ImageOps.grayscale(big)).astype(np.uint8)
clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(6, 6))
lum = clahe.apply(gray).astype(np.float32) / 255.0
edges = cv2.Canny(cv2.GaussianBlur(gray, (0, 0), 1.4), 30, 90).astype(np.float32) / 255.0
edges = cv2.GaussianBlur(edges, (0, 0), 1.0)
edges /= edges.max() + 1e-6

# density: a base so dark hair still shows its curls, brightness for skin, edges for frames/curl outlines
dens = (0.06 + 1.0 * lum ** 2.0 + 0.85 * edges) * mask
dens = np.clip(dens, 0, None)
# spend the dots on the face: fade the shirt below the chin
rows = np.linspace(0, 1, H)[:, None]
dens *= np.clip(1 - (rows - 0.50) / 0.30 * 0.78, 0.22, 1)

rng = np.random.default_rng(7)
N = int(sys.argv[3]) if len(sys.argv) > 3 else 26000
flat = dens.ravel() / dens.sum()
idx = rng.choice(dens.size, size=N, replace=True, p=flat)
ys, xs = np.divmod(idx, W)
xs = xs + rng.random(N) - 0.5
ys = ys + rng.random(N) - 0.5
scale = max(W, H) / 2
cx, cy = W / 2, H / 2
xi, yi = np.clip(xs.astype(int), 0, W - 1), np.clip(ys.astype(int), 0, H - 1)
pts = np.stack([(xs - cx) / scale, -(ys - cy) / scale, d[yi, xi], np.clip(0.25 + 0.75 * lum[yi, xi] + 0.3 * edges[yi, xi], 0, 1)], 1)
name = sys.argv[4] if len(sys.argv) > 4 else "portrait"
q = np.empty((N, 3), np.uint16)
q[:, 0] = np.clip((pts[:, 0] + 1) / 2 * 65535, 0, 65535); q[:, 1] = np.clip((pts[:, 1] + 1) / 2 * 65535, 0, 65535); q[:, 2] = np.clip(pts[:, 2] * 65535, 0, 65535)
b = np.clip(pts[:, 3] * 255, 0, 255).astype(np.uint8)
open(f"{out_dir}/{name}.bin", "wb").write(q.tobytes() + b.tobytes())  # [uint16 xyz * N][uint8 b * N]

# previews
Image.fromarray((mask * 255).astype(np.uint8)).save(f"{out_dir}/mask.png")
Image.fromarray((d * mask * 255).astype(np.uint8)).save(f"{out_dir}/depth.png")
prev = np.zeros((H, W), np.float32)
for x, y, b in zip(xi, yi, pts[:, 3]):
    prev[y, x] = min(1, prev[y, x] + b)
Image.fromarray((np.clip(prev, 0, 1) * 255).astype(np.uint8)).save(f"{out_dir}/stipple.png")
print("ok", W, H, N)
