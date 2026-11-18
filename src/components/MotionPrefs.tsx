"use client";

import { MotionConfig } from "framer-motion";

// Honours the visitor's "reduce motion" system setting for every Framer Motion
// animation below it: slides and scales are skipped, fades stay.
export default function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
