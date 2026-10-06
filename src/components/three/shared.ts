import * as THREE from "three";
import gpt2 from "@/data/gpt2.json";
import { state } from "@/lib/store";

export const SPACING = 16; // world-space distance between scenes along -Y
export const sceneY = (i: number) => -i * SPACING;
export const FONT = "/fonts/JetBrainsMono-Medium.ttf";

export const C = {
  amber: new THREE.Color("#ffb547"),
  cyan: new THREE.Color("#5ee3ff"),
  violet: new THREE.Color("#9b8cff"),
  mint: new THREE.Color("#5fe3a1"),
  rose: new THREE.Color("#ff7a9c"),
  dim: new THREE.Color("#3a4064"),
};

export type GptPrompt = (typeof gpt2.prompts)[number];
export const gptPrompts = gpt2.prompts as GptPrompt[];

/** Real GPT-2 data for the current prompt if it is one of the exported presets, else the default. */
export function currentGpt(): { data: GptPrompt; exact: boolean } {
  const hit = gptPrompts.find((p) => p.prompt.trim().toLowerCase() === state.prompt.trim().toLowerCase());
  return { data: hit ?? gptPrompts[0], exact: !!hit };
}

/** Smooth 0..1 visibility for scene i given the fractional scroll position. */
export function visibility(i: number) {
  const d = Math.abs(state.scroll - i);
  return THREE.MathUtils.clamp(1.25 - d * 1.1, 0, 1);
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ease = (t: number) => t * t * (3 - 2 * t);
