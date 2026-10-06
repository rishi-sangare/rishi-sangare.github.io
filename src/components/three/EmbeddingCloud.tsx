"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import emb from "@/data/embeddings.json";
import { FONT, sceneY, visibility } from "./shared";
import { state } from "@/lib/store";
import { useStore } from "@/lib/useStore";

const GROUP_COLOR: Record<string, string> = {
  migration: "#9ba3c9", retrieval: "#5ee3ff", attention: "#9b8cff", layers: "#ffb547",
  eval: "#5fe3a1", decode: "#ff7a9c", about: "#ecedf6",
};
const R = 4.2; // world radius of the PCA space

/** Scene 2: real MiniLM embeddings of my work in 3D (PCA). The visitor's prompt is embedded live and dropped in. */
export function EmbeddingCloud() {
  const docs = emb.docs as { group: string; text: string; pos: number[] }[];
  const sims = useStore((s) => s.sims);
  const qpos = useStore((s) => s.queryPos);
  const root = useRef<THREE.Group>(null);
  const query = useRef<THREE.Mesh>(null);

  const halo = useMemo(() => {
    const per = 140, g = new THREE.BufferGeometry(), p: number[] = [], c: number[] = [];
    docs.forEach((d) => {
      const col = new THREE.Color(GROUP_COLOR[d.group]);
      for (let i = 0; i < per; i++) {
        const r = Math.pow(Math.random(), 2) * 0.9;
        const v = new THREE.Vector3().randomDirection().multiplyScalar(r);
        p.push(d.pos[0] * R + v.x, d.pos[1] * R + v.y, d.pos[2] * R + v.z);
        c.push(col.r, col.g, col.b);
      }
    });
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
    return g;
  }, [docs]);

  const centroids = useMemo(() => {
    const m = new Map<string, number[]>();
    docs.forEach((d) => {
      const a = m.get(d.group) ?? [0, 0, 0, 0];
      m.set(d.group, [a[0] + d.pos[0], a[1] + d.pos[1], a[2] + d.pos[2], a[3] + 1]);
    });
    return [...m].map(([g, a]) => ({ g, p: [(a[0] / a[3]) * R, (a[1] / a[3]) * R + 0.55, (a[2] / a[3]) * R] as [number, number, number] }));
  }, [docs]);

  const top = useMemo(() => (sims ? sims.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).slice(0, 3) : []), [sims]);

  const lines = useMemo(() => {
    if (!qpos || !top.length) return null;
    const q = new THREE.Vector3(qpos[0] * R, qpos[1] * R, qpos[2] * R);
    const pos: number[] = [];
    top.forEach(({ i }) => pos.push(q.x, q.y, q.z, docs[i].pos[0] * R, docs[i].pos[1] * R, docs[i].pos[2] * R));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [qpos, top, docs]);

  useFrame(({ clock }, dt) => {
    const v = visibility(2);
    if (!root.current) return;
    root.current.visible = v > 0.01;
    root.current.rotation.y += dt * 0.08 + state.pointer.x * dt * 0.3;
    root.current.rotation.x = -0.15 + state.pointer.y * 0.15;
    const s = 0.85 + state.local.embed * 0.3;
    root.current.scale.setScalar(s);
    if (query.current) query.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.15);
  });

  return (
    <group ref={root} position={[0.6, sceneY(2) + 0.8, -1]}>
      <points geometry={halo}>
        <pointsMaterial size={0.035} vertexColors transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {docs.map((d, i) => {
        const hit = top.findIndex((t) => t.i === i);
        return (
          <mesh key={i} position={[d.pos[0] * R, d.pos[1] * R, d.pos[2] * R]} scale={hit >= 0 ? 0.16 : 0.09}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshBasicMaterial color={GROUP_COLOR[d.group]} toneMapped={false} />
          </mesh>
        );
      })}
      {centroids.map((c) => (
        <Text key={c.g} font={FONT} fontSize={0.2} position={c.p} color={GROUP_COLOR[c.g]} anchorX="center" fillOpacity={0.85}>
          {c.g}
        </Text>
      ))}
      {qpos && (
        <mesh ref={query} position={[qpos[0] * R, qpos[1] * R, qpos[2] * R]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshBasicMaterial color="#5ee3ff" toneMapped={false} />
        </mesh>
      )}
      {lines && (
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#5ee3ff" transparent opacity={0.7} />
        </lineSegments>
      )}
    </group>
  );
}
