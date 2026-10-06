"use client";
import { useEffect, useState } from "react";
import { state, subscribe } from "./store";

/** Re-render when the shared store emits (low-frequency changes only: prompt, tokens, sims). */
export function useStore<T>(select: (s: typeof state) => T): T {
  const [v, setV] = useState(() => select(state));
  useEffect(() => subscribe(() => setV(() => select(state))), [select]);
  return v;
}
