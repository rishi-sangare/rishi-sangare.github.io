"use client";
import { Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { state } from "@/lib/store";
import { SPACING } from "./shared";
import { Dust } from "./Dust";
import { PromptTokens } from "./PromptTokens";
import { MigrationField } from "./MigrationField";
import { EmbeddingCloud } from "./EmbeddingCloud";
import { AttentionScene } from "./AttentionScene";
import { LayerStack } from "./LayerStack";
import { LogitBars } from "./LogitBars";
import { DecodeStream, EosRing } from "./DecodeAndEos";

/** The camera falls down the model as you scroll; the pointer adds a little parallax. */
function CameraRig() {
  const look = new THREE.Vector3();
  useFrame(({ camera, size }, dt) => {
    const y = -state.scroll * SPACING;
    const k = Math.min(1, dt * 5);
    // on wide screens the copy panel sits on the left, so frame the 3D on the right
    const shift = size.width > 900 ? -2.4 : 0;
    camera.position.x += (shift + state.pointer.x * 0.9 - camera.position.x) * k;
    camera.position.y += (y + state.pointer.y * 0.5 - camera.position.y) * k;
    camera.position.z += (10 - camera.position.z) * k;
    look.set(shift - 1.6 * Math.sign(shift), camera.position.y - state.pointer.y * 0.5, 0);
    camera.lookAt(look);
  });
  return null;
}

export default function World({ quality }: { quality: 1 | 2 }) {
  const [dpr, setDpr] = useState<[number, number]>(quality === 2 ? [1, 1.75] : [1, 1.25]);
  const [fx, setFx] = useState(quality === 2);
  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 120 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor("#07080f");
        scene.fog = new THREE.FogExp2("#07080f", 0.045);
      }}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100lvh", zIndex: 0 }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => { setDpr([1, 1]); setFx(false); }} onIncline={() => setDpr(quality === 2 ? [1, 1.75] : [1, 1.25])} />
      <AdaptiveDpr pixelated={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} color="#fff3df" />
      <pointLight position={[-6, -10, 4]} intensity={30} color="#5ee3ff" />
      <CameraRig />
      <Suspense fallback={null}>
        <Dust count={quality === 2 ? 7000 : 2500} />
        <PromptTokens />
        <MigrationField quality={quality} />
        <EmbeddingCloud />
        <AttentionScene quality={quality} />
        <LayerStack />
        <LogitBars />
        <DecodeStream />
        <EosRing />
        <Preload all />
      </Suspense>
      {fx && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.3} mipmapBlur />
          <Noise opacity={0.045} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
