"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING } from "./shared";
import { state } from "@/lib/store";

/** The residual stream as ambient dust: faint particles drifting down through every scene. */
export function Dust({ count = 7000 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3), s = new Float32Array(count), h = new Float32Array(count);
    const top = 8, bottom = -SPACING * 7.6;
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 34;
      p[i * 3 + 1] = bottom + Math.random() * (top - bottom);
      p[i * 3 + 2] = (Math.random() - 0.5) * 22 - 4;
      s[i] = Math.random();
      h[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(s, 1));
    g.setAttribute("aHue", new THREE.BufferAttribute(h, 1));
    return g;
  }, [count]);

  useFrame((_, dt) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uScroll.value = state.scroll;
    }
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uScroll: { value: 0 } }}
        vertexShader={`
          attribute float aSeed; attribute float aHue;
          uniform float uTime; uniform float uScroll;
          varying float vA; varying float vHue;
          void main(){
            vec3 p = position;
            p.y -= mod(uTime * (0.15 + aSeed * 0.35), 3.0);
            p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.2 + aSeed * 2.2) * (14.0 / -mv.z);
            vA = 0.25 + 0.5 * aSeed; vHue = aHue;
          }`}
        fragmentShader={`
          varying float vA; varying float vHue;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            vec3 amber = vec3(1.0, 0.71, 0.28), cyan = vec3(0.37, 0.89, 1.0), violet = vec3(0.61, 0.55, 1.0);
            vec3 col = vHue < 0.6 ? amber : (vHue < 0.85 ? violet : cyan);
            gl_FragColor = vec4(col, vA * (1.0 - d * 2.0) * 0.55);
          }`}
      />
    </points>
  );
}
