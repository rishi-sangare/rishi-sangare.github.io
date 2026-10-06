import * as THREE from "three";

/** One merged LineSegments geometry of bezier arcs between token positions, weighted by attention. */
export function buildArcs(xs: number[], weights: number[][], y = 0, minW = 0.04, lift = 0.55, seg = 28) {
  const pos: number[] = [], col: number[] = [];
  const c = new THREE.Color("#9b8cff"), hot = new THREE.Color("#ffb547");
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j <= i; j++) {
      const w = weights[i]?.[j] ?? 0;
      if (w < minW || i === j) continue;
      const a = new THREE.Vector3(xs[j], y, 0), b = new THREE.Vector3(xs[i], y, 0);
      const h = 0.4 + Math.abs(xs[i] - xs[j]) * lift;
      const curve = new THREE.CubicBezierCurve3(a, new THREE.Vector3(xs[j], y + h, 0.2), new THREE.Vector3(xs[i], y + h, 0.2), b);
      const pts = curve.getPoints(seg);
      const k = Math.min(1, 0.3 + w * 1.8);
      const cc = c.clone().lerp(hot, Math.max(0, (w - 0.35) * 1.5));
      for (let s = 0; s < pts.length - 1; s++) {
        pos.push(pts[s].x, pts[s].y, pts[s].z, pts[s + 1].x, pts[s + 1].y, pts[s + 1].z);
        for (let r = 0; r < 2; r++) col.push(cc.r * k, cc.g * k, cc.b * k);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** Average the heads of one layer into a single [T][T] matrix. */
export function meanHeads(layer: number[][][]) {
  const H = layer.length, T = layer[0].length;
  return Array.from({ length: T }, (_, i) => Array.from({ length: T }, (_, j) => layer.reduce((a, h) => a + h[i][j], 0) / H));
}
