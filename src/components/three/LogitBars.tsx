"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { C, FONT, currentGpt, sceneY, visibility } from "./shared";
import { probs } from "@/lib/sampling";
import { state } from "@/lib/store";
import { useStore } from "@/lib/useStore";

const N = 24;

/** Scene 5: an arc of bars, one per candidate next token, heights = real GPT-2 probabilities at the chosen temperature. */
export function LogitBars() {
  useStore((s) => s.prompt);
  const { data } = currentGpt();
  const root = useRef<THREE.Group>(null);
  const bars = useRef<THREE.InstancedMesh>(null);
  const heights = useRef<number[]>(new Array(N).fill(0));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const angle = (i: number) => -Math.PI * 0.55 + (i / (N - 1)) * Math.PI * 1.1;

  useFrame((_, dt) => {
    const v = visibility(5);
    if (!root.current) return;
    root.current.visible = v > 0.01;
    root.current.rotation.y = state.pointer.x * 0.25;
    const p = probs(data.next.logits, state.temperature).slice(0, N);
    const grow = Math.min(1, state.local.sample * 2.2);
    if (!bars.current) return;
    for (let i = 0; i < N; i++) {
      const target = Math.max(0.04, Math.sqrt(p[i]) * 7 * grow);
      heights.current[i] += (target - heights.current[i]) * Math.min(1, dt * 6);
      const h = heights.current[i], a = angle(i), r = 3.8;
      dummy.position.set(Math.sin(a) * r, h / 2 - 2, -Math.cos(a) * r + 2);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.set(0.32, h, 0.32);
      dummy.updateMatrix();
      bars.current.setMatrixAt(i, dummy.matrix);
      col.copy(i === 0 ? C.amber : C.violet).multiplyScalar(i === 0 ? 1.4 : 0.45 + p[i] * 3);
      bars.current.setColorAt(i, col);
    }
    bars.current.instanceMatrix.needsUpdate = true;
    if (bars.current.instanceColor) bars.current.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={root} position={[1.4, sceneY(5) + 0.4, -2]}>
      <instancedMesh ref={bars} args={[undefined, undefined, N]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>
      {data.next.tokens.slice(0, N).map((t, i) => {
        const a = angle(i), r = 4.3;
        return (
          <Text key={i} font={FONT} fontSize={0.17} color={i === 0 ? "#ffb547" : "#a9aec6"}
            position={[Math.sin(a) * r, -2.35, -Math.cos(a) * r + 2]} rotation={[0, -a, 0]} anchorX="center">
            {JSON.stringify(t).slice(1, -1)}
          </Text>
        );
      })}
    </group>
  );
}
