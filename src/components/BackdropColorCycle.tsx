"use client";

import { useEffect } from "react";

type Props = {
  /** Colours to rotate through, in order */
  colors: string[];
  /** Seconds each colour is held before moving to the next */
  interval?: number;
  /** Seconds the cross-fade between two colours takes */
  fade?: number;
};

// One clock for every backdrop on the page. It steps --fp-color on <html>, a
// registered <color> property (see globals.css), so the CSS transition cross-fades
// it. The falling pattern reads it straight from CSS and the hero shader samples
// the computed value each frame, which keeps the two in step.
export default function BackdropColorCycle({ colors, interval = 30, fade = 4 }: Props) {
  const key = colors.join(",");

  useEffect(() => {
    const palette = key.split(",").filter(Boolean);
    if (palette.length === 0) return;
    const root = document.documentElement;
    const previousTransition = root.style.transition;
    let index = 0;

    root.style.setProperty("--fp-color", palette[0]);
    root.style.transition = `--fp-color ${fade}s ease-in-out`;

    const id = palette.length > 1
      ? setInterval(() => {
          index = (index + 1) % palette.length;
          root.style.setProperty("--fp-color", palette[index]);
        }, interval * 1000)
      : undefined;

    return () => {
      if (id) clearInterval(id);
      root.style.removeProperty("--fp-color");
      root.style.transition = previousTransition;
    };
  }, [key, interval, fade]);

  return null;
}
