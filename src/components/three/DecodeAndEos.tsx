"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { FONT, sceneY, visibility } from "./shared";
import { state } from "@/lib/store";

/** Scene 6: tokens stream out of the model into a product frame. */
export function DecodeStream() {
  const root = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const N = 420;
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random(), Math.random(), Math.random()]), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const v = visibility(6);
    if (!root.current) return;
    root.current.visible = v > 0.01;
    root.current.rotation.y = -0.35 + state.pointer.x * 0.2;
    const t = clock.elapsedTime;
    if (!inst.current) return;
    for (let i = 0; i < N; i++) {
      const [a, b, c] = seeds[i];
      const k = (t * (0.12 + a * 0.18) + b) % 1; // 0 → 1 along the path from the model (top) into the frame
      const x = THREE.MathUtils.lerp((b - 0.5) * 8, (a - 0.5) * 4.4, k * k);
      const y = THREE.MathUtils.lerp(6, (c - 0.5) * 2.6, k);
      const z = THREE.MathUtils.lerp(-3, 0.1, k);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.05 + 0.05 * (1 - k));
      dummy.updateMatrix();
      inst.current.setMatrixAt(i, dummy.matrix);
    }
    inst.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} position={[2.2, sceneY(6), -1.5]}>
      <RoundedBox args={[5.4, 3.4, 0.08]} radius={0.12} smoothness={4}>
        <meshStandardMaterial color="#0c0e19" emissive="#5ee3ff" emissiveIntensity={0.05} roughness={0.25} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 1.48, 0.05]}>
        <planeGeometry args={[5.2, 0.28]} />
        <meshBasicMaterial color="#161a2c" />
      </mesh>
      {[-2.4, -2.2, -2.0].map((x, i) => (
        <mesh key={i} position={[x, 1.48, 0.06]}>
          <circleGeometry args={[0.05, 16]} />
          <meshBasicMaterial color={["#ff7a9c", "#ffb547", "#5fe3a1"][i]} />
        </mesh>
      ))}
      <Text font={FONT} fontSize={0.13} color="#6c7290" position={[-1.7, 1.48, 0.07]} anchorX="left" anchorY="middle">refine-cv.com · recruiter copilot</Text>
      {[
        ["RefineCV", "B2B CV formatting SaaS", "435 commits · 203 PRs", "#5ee3ff"],
        ["security", "cross-tenant authz fix", "63 call sites", "#5fe3a1"],
        ["reliability", "event-loop starvation", "root-caused · fixed", "#ffb547"],
        ["Recruiter Copilot", "Chrome Web Store", "11 releases · 400+ installs", "#9b8cff"],
      ].map(([a, b, c, col], i) => (
        <group key={a} position={[-2.45, 0.92 - i * 0.62, 0.07]}>
          <mesh position={[2.45, -0.04, -0.005]}>
            <planeGeometry args={[4.95, 0.5]} />
            <meshBasicMaterial color="#121626" />
          </mesh>
          <mesh position={[0.06, -0.04, 0]}>
            <planeGeometry args={[0.05, 0.38]} />
            <meshBasicMaterial color={col} toneMapped={false} />
          </mesh>
          <Text font={FONT} fontSize={0.17} color="#ecedf6" position={[0.25, 0.04, 0]} anchorX="left" anchorY="middle">{a}</Text>
          <Text font={FONT} fontSize={0.12} color="#6c7290" position={[0.25, -0.15, 0]} anchorX="left" anchorY="middle">{b}</Text>
          <Text font={FONT} fontSize={0.15} color={col} position={[4.75, -0.04, 0]} anchorX="right" anchorY="middle">{c}</Text>
        </group>
      ))}
      <instancedMesh ref={inst} args={[undefined, undefined, N]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffb547" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Scene 7: generation complete. A slow ring, the end-of-sequence token. */
export function EosRing() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const v = visibility(7);
    if (!ring.current) return;
    ring.current.visible = v > 0.01;
    ring.current.rotation.x = clock.elapsedTime * 0.25;
    ring.current.rotation.y = clock.elapsedTime * 0.18 + state.pointer.x * 0.4;
  });
  return (
    <group position={[2.6, sceneY(7), -2]}>
      <mesh ref={ring}>
        <torusKnotGeometry args={[1.6, 0.05, 280, 12, 2, 5]} />
        <meshBasicMaterial color="#ffb547" toneMapped={false} />
      </mesh>
      <Text font={FONT} fontSize={0.42} color="#ecedf6" position={[0, 0, 0.3]} anchorX="center" anchorY="middle">{"<eos>"}</Text>
    </group>
  );
}
