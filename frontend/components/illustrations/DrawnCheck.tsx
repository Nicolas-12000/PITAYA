"use client";

import { motion, useReducedMotion } from "motion/react";

/** Check que se dibuja al guardar (§21). */
export function DrawnCheck({ size = 20 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="stroke-series-3">
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      />
    </svg>
  );
}
