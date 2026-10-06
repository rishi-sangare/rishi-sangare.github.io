"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { FONT, currentGpt, sceneY, visibility } from "./shared";
import { buildArcs, meanHeads } from "./arcs";
import { state } from "@/lib/store";
import { useStore } from "@/lib/useStore";

/** Scene 0: the visitor's prompt as 3D token chips, with real GPT-2 attention arcing above them. */
export function PromptTokens() {
  const tokens = useStore((s) => s.tokens);
  const prompt = useStore((s) => s.prompt);
  const group = useRef<THREE.Group>(null);
  const arcMat = useRef<THREE.LineBasicMaterial>(null);

  const { items, xs } = useMemo(() => {
    const { data } = currentGpt();
    const list = tokens.length ? tokens : data.ids.map((id, i) => ({ id, text: data.tokens[i] }));
    const widths = list.map((t) => Math.max(0.7, t.text.trim().length * 0.24 + 0.5));
    const gap = 0.22, total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    let x = -total / 2;
    const xs: number[] = [];
    const items = list.map((t, i) => {
      const cx = x + widths[i] / 2; x += widths[i] + gap; xs.push(cx);
      return { ...t, w: widths[i], x: cx };
    });
    return { items, xs };
  }, [tokens]);

  const arcs = useMemo(() => {
    const { data, exact } = currentGpt();
    if (!exact || data.ids.length !== items.length) return null;
    return buildArcs(xs, meanHeads(data.attention[11]), 0.42, 0.06, 0.16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xs, prompt]);

  const scale = Math.min(0.72, 6.5 / Math.max(1, (xs.at(-1) ?? 0) - (xs[0] ?? 0) + 2));

  useFrame(({ clock, size }) => {
    const v = visibility(0);
    const narrow = size.width < size.height;
    if (!group.current) return;
    group.current.visible = v > 0.01;
    const t = clock.elapsedTime;
    group.current.rotation.y = state.pointer.x * 0.18;
    group.current.rotation.x = -state.pointer.y * 0.08;
    group.current.position.set(narrow ? 0 : 2.2, sceneY(0) + (narrow ? 4.6 : 2.35) + Math.sin(t * 0.6) * 0.06 + state.local.prompt * 2.5, -1.5);
    group.current.scale.setScalar(narrow ? scale * 0.62 : scale);
    if (arcMat.current) arcMat.current.opacity = v * (0.65 + 0.35 * Math.sin(t * 1.4));
    group.current.children.forEach((c) => {
      if (c.userData.chip !== undefined) {
        const k = c.userData.chip as number;
        c.position.z = Math.sin(t * 1.1 - k * 0.6) * 0.12 - state.local.prompt * k * 0.4;
      }
    });
  });

  return (
    <group ref={group}>
      {items.map((t, i) => (
        <group key={`${t.id}-${i}`} position={[t.x, 0, 0]} userData={{ chip: i }}>
          <RoundedBox args={[t.w, 0.62, 0.12]} radius={0.1} smoothness={3}>
            <meshStandardMaterial color="#121626" emissive="#ffb547" emissiveIntensity={0.08} roughness={0.35} metalness={0.2} />
          </RoundedBox>
          <Text font={FONT} fontSize={0.26} position={[0, 0.02, 0.07]} color="#ecedf6" anchorX="center" anchorY="middle">
            {t.text.replace(/\n/g, "↵")}
          </Text>
          <Text font={FONT} fontSize={0.13} position={[0, -0.5, 0.07]} color="#6c7290" anchorX="center" anchorY="middle">
            {String(t.id)}
          </Text>
        </group>
      ))}
      {arcs && (
        <lineSegments geometry={arcs}>
          <lineBasicMaterial ref={arcMat} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </lineSegments>
      )}
    </group>
  );
}
