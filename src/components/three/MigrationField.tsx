"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneY, visibility } from "./shared";
import { state } from "@/lib/store";

export const RECORDS = 253_541;

/**
 * Scene 1: one point per migrated activity record (or 1 per 4 on reduced quality).
 * Start: scattered across skewed, gappy "legacy tables". End: a clean lattice, three schema slabs.
 * Mid-way a sliver of points blinks out and back: the ghost-row bug, found and fixed.
 */
export function MigrationField({ quality }: { quality: 1 | 2 }) {
  const count = quality === 2 ? RECORDS : Math.ceil(RECORDS / 4);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const pts = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const start = new Float32Array(count * 3), end = new Float32Array(count * 3), seed = new Float32Array(count * 2);
    // legacy: 9 skewed table planes with holes
    const tables = Array.from({ length: 9 }, (_, k) => ({
      c: new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 8),
      rx: (Math.random() - 0.5) * 1.6, ry: (Math.random() - 0.5) * 1.8, w: 2.5 + Math.random() * 3.5, h: 1.5 + Math.random() * 2.5, k,
    }));
    const m = new THREE.Matrix4(), v = new THREE.Vector3();
    // ordered: lattice split into 3 slabs (entity groups)
    const per = Math.ceil(count / 3), side = Math.ceil(Math.sqrt(per / 6));
    for (let i = 0; i < count; i++) {
      const t = tables[i % tables.length];
      const gx = Math.floor(Math.random() * 40) / 40, gy = Math.floor(Math.random() * 24) / 24;
      v.set((gx - 0.5) * t.w, (gy - 0.5) * t.h, (Math.random() - 0.5) * 0.08);
      m.makeRotationFromEuler(new THREE.Euler(t.rx, t.ry, 0));
      v.applyMatrix4(m).add(t.c);
      start.set([v.x, v.y, v.z], i * 3);

      const slab = Math.floor(i / per), j = i % per;
      const x = j % side, y = Math.floor(j / side) % side, z = Math.floor(j / (side * side));
      end.set([(x / side - 0.5) * 5.2 + (slab - 1) * 6.0, (y / side - 0.5) * 5.2, (z / 6 - 0.5) * 1.2], i * 3);
      seed.set([Math.random(), Math.random()], i * 2);
    }
    g.setAttribute("position", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return g;
  }, [count]);

  useFrame((_, dt) => {
    const v = visibility(1);
    if (pts.current) pts.current.visible = v > 0.01;
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value += dt;
    u.uVis.value = v;
    // migration runs across the middle of the scene's scroll runway
    const target = Math.min(1, Math.max(0, (state.local.tokenize - 0.12) / 0.7));
    u.uProg.value += (target - u.uProg.value) * Math.min(1, dt * 4);
  });

  return (
    <points ref={pts} geometry={geo} position={[0.5, sceneY(1), -2]} scale={0.78} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uProg: { value: 0 }, uVis: { value: 0 }, uSize: { value: quality === 2 ? 1.7 : 2.6 } }}
        vertexShader={`
          attribute vec3 aEnd; attribute vec2 aSeed;
          uniform float uTime, uProg, uVis, uSize;
          varying vec3 vCol; varying float vA;
          void main(){
            float delay = aSeed.x * 0.55;
            float p = smoothstep(0.0, 1.0, clamp((uProg - delay) / 0.45, 0.0, 1.0));
            vec3 pos = mix(position, aEnd, p);
            // swirl while in flight
            float fly = sin(p * 3.14159);
            pos.x += sin(uTime * 0.9 + aSeed.y * 30.0) * 0.6 * fly;
            pos.z += cos(uTime * 0.7 + aSeed.x * 30.0) * 0.9 * fly;
            // legacy jitter
            pos += (1.0 - p) * 0.03 * vec3(sin(uTime * 3.0 + aSeed.y * 90.0), cos(uTime * 2.0 + aSeed.x * 90.0), 0.0);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * (1.0 + p * 0.6) * (12.0 / -mv.z);
            // each legacy table gets its own muted hue
            float tbl = floor(aSeed.y * 9.0);
            vec3 legacy = 0.55 * (0.5 + 0.5 * cos(6.2831 * (tbl / 9.0 + vec3(0.0, 0.33, 0.67)))) + 0.15;
            vec3 clean = mix(vec3(1.0, 0.71, 0.28), vec3(0.37, 0.89, 1.0), step(0.66, aSeed.y) * 0.6);
            vCol = mix(legacy, clean, p);
            // ghost rows: a small slice vanishes mid-migration, flashes rose, then comes back
            float ghost = step(aSeed.y, 0.025) * smoothstep(0.38, 0.45, uProg) * (1.0 - smoothstep(0.62, 0.7, uProg));
            vCol = mix(vCol, vec3(1.0, 0.48, 0.61), ghost);
            vA = uVis * mix(0.55, 0.95, p) * (1.0 - ghost * (0.5 + 0.5 * sin(uTime * 22.0)));
          }`}
        fragmentShader={`
          varying vec3 vCol; varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(vCol, vA * (1.0 - d * 1.6));
          }`}
      />
    </points>
  );
}
