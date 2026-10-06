"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { C, FONT, currentGpt, sceneY, visibility } from "./shared";
import { state } from "@/lib/store";

const LAYERS = 12;
const H = 11; // vertical extent of the stack

/**
 * Scene 4: the camera falls through GPT-2's 12 blocks along the residual stream.
 * Each block's glow is the real residual-stream norm at that layer for the last token.
 * At the bottom the stream splits into chosen / rejected: DPO, drawn literally.
 */
export function LayerStack() {
  const root = useRef<THREE.Group>(null);
  const blocks = useRef<THREE.InstancedMesh>(null);
  const pulse = useRef<THREE.Mesh>(null);

  const glow = useMemo(() => {
    const { data } = currentGpt();
    const last = data.residualNorms.map((row) => row[row.length - 1]).slice(1); // after each block
    const lo = Math.min(...last), hi = Math.max(...last);
    return last.map((v) => 0.25 + (0.75 * (v - lo)) / (hi - lo || 1));
  }, []);

  const ribbons = useMemo(() => {
    const mk = (dir: number) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -H / 2 - 0.2, 0), new THREE.Vector3(dir * 0.8, -H / 2 - 1.4, 0.3),
          new THREE.Vector3(dir * 2.6, -H / 2 - 2.6, 0.6), new THREE.Vector3(dir * 4.2, -H / 2 - 3.1, 0.2),
        ]), 64, 0.06, 10, false);
    return { chosen: mk(-1), rejected: mk(1) };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const v = visibility(4);
    if (!root.current) return;
    root.current.visible = v > 0.01;
    root.current.rotation.y = clock.elapsedTime * 0.05 + state.pointer.x * 0.25;
    const lp = state.local.layers;
    if (blocks.current) {
      for (let i = 0; i < LAYERS; i++) {
        const y = H / 2 - (i + 0.5) * (H / LAYERS);
        const active = Math.max(0, 1 - Math.abs(lp * LAYERS - i) * 0.6);
        for (let k = 0; k < 2; k++) {
          dummy.position.set(k === 0 ? -0.75 : 0.75, y, 0);
          dummy.scale.set(1.2, 0.55, 1.2 + active * 0.25);
          dummy.updateMatrix();
          blocks.current.setMatrixAt(i * 2 + k, dummy.matrix);
          col.copy(k === 0 ? C.violet : C.amber).multiplyScalar(0.12 + glow[i] * 0.5 + active * 0.9);
          blocks.current.setColorAt(i * 2 + k, col);
        }
      }
      blocks.current.instanceMatrix.needsUpdate = true;
      if (blocks.current.instanceColor) blocks.current.instanceColor.needsUpdate = true;
    }
    if (pulse.current) pulse.current.position.y = H / 2 - lp * (H + 2.5);
  });

  return (
    <group ref={root} position={[1.6, sceneY(4), -1]}>
      <instancedMesh ref={blocks} args={[undefined, undefined, LAYERS * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.55} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      {Array.from({ length: LAYERS }, (_, i) => (
        <Text key={i} font={FONT} fontSize={0.16} color="#6c7290" position={[-2.1, H / 2 - (i + 0.5) * (H / LAYERS), 0]} anchorX="right">
          {`block ${String(i + 1).padStart(2, "0")}  attn · mlp`}
        </Text>
      ))}
      {/* residual stream */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, H + 1, 12]} />
        <meshBasicMaterial color="#ffb547" toneMapped={false} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshBasicMaterial color="#fff2d6" toneMapped={false} />
      </mesh>
      <mesh geometry={ribbons.chosen}>
        <meshBasicMaterial color="#5fe3a1" toneMapped={false} />
      </mesh>
      <mesh geometry={ribbons.rejected}>
        <meshBasicMaterial color="#ff7a9c" toneMapped={false} transparent opacity={0.6} />
      </mesh>
      <Text font={FONT} fontSize={0.24} color="#5fe3a1" position={[-4.4, -H / 2 - 3.5, 0.2]} anchorX="center">chosen</Text>
      <Text font={FONT} fontSize={0.24} color="#ff7a9c" position={[4.4, -H / 2 - 3.5, 0.2]} anchorX="center">rejected</Text>
    </group>
  );
}
