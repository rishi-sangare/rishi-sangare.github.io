"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Text } from "@react-three/drei";
import * as THREE from "three";
import { FONT, currentGpt, sceneY, visibility } from "./shared";
import { buildArcs } from "./arcs";
import { state } from "@/lib/store";
import { useStore } from "@/lib/useStore";

/** Scene 3: real GPT-2 attention for the prompt. Layer/head picked by the DOM controls or swept by scroll. */
export function AttentionScene({ quality }: { quality: 1 | 2 }) {
  const att = useStore((s) => `${s.attention.layer}:${s.attention.head}:${s.prompt}`);
  const root = useRef<THREE.Group>(null);
  const lens = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const { viewport } = useThree();

  const { data } = currentGpt();
  const xs = useMemo(() => {
    const n = data.tokens.length, span = Math.min(8, n * 1.2);
    return data.tokens.map((_, i) => -span / 2 + (span * i) / Math.max(1, n - 1));
  }, [data]);

  const geo = useMemo(() => {
    const { layer, head } = state.attention;
    return buildArcs(xs, data.attention[layer][head], 0, 0.03, 0.42, 36);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [att, xs, data]);

  useFrame(({ clock }) => {
    const v = visibility(3);
    if (!root.current) return;
    root.current.visible = v > 0.01;
    root.current.rotation.x = -0.12 + state.pointer.y * 0.1;
    root.current.rotation.y = state.pointer.x * 0.2;
    if (mat.current) mat.current.opacity = v;
    if (lens.current) {
      const target = new THREE.Vector3(state.pointer.x * viewport.width * 0.35, 1.2 + state.pointer.y * viewport.height * 0.25, 1.6);
      lens.current.position.lerp(target, 0.08);
      lens.current.rotation.y = clock.elapsedTime * 0.4;
    }
  });

  return (
    <group ref={root} position={[0.6, sceneY(3) - 0.9, -0.5]}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial ref={mat} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {data.tokens.map((t, i) => (
        <group key={i} position={[xs[i], -0.32, 0]}>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color="#ffb547" toneMapped={false} />
          </mesh>
          <Text font={FONT} fontSize={0.3} color="#ecedf6" anchorX="center" anchorY="top">
            {t.replace(/\n/g, "↵")}
          </Text>
        </group>
      ))}
      {quality === 2 && (
        <mesh ref={lens} position={[0, 1.2, 1.6]}>
          <torusGeometry args={[0.7, 0.28, 48, 96]} />
          <MeshTransmissionMaterial
            samples={4} resolution={384} thickness={0.6} roughness={0.05} ior={1.35}
            chromaticAberration={0.25} anisotropy={0.2} distortion={0.25} distortionScale={0.4}
            temporalDistortion={0.1} backside={false} transmission={1} color="#e6e8ff"
          />
        </mesh>
      )}
    </group>
  );
}
