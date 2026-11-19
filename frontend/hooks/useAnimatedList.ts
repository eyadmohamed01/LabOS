"use client";

import { useLayoutEffect, useRef } from "react";

// FLIP keeps surviving rows connected to their old positions as a list changes.
export function useAnimatedList<T extends HTMLElement>(signature: string) {
  const ref = useRef<T>(null);
  const previous = useRef(new Map<string, { top: number; left: number }>());
  const initialized = useRef(false);
  const running = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rows = element.querySelectorAll<HTMLElement>("[data-motion-id]");
    running.current.forEach((animation) => animation.cancel());
    running.current = [];
    const next = new Map<string, { top: number; left: number }>();
    const container = element.getBoundingClientRect();

    rows.forEach((row) => {
      const id = row.dataset.motionId;
      if (!id) return;
      const rect = row.getBoundingClientRect();
      const bounds = {
        top: rect.top - container.top,
        left: rect.left - container.left,
      };
      const before = previous.current.get(id);
      next.set(id, bounds);
      if (!initialized.current) return;

      const deltaX = before ? before.left - bounds.left : 0;
      const deltaY = before ? before.top - bounds.top : 7;
      if (before && Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
      running.current.push(
        row.animate(
          [
            {
              transform: `translate(${deltaX}px, ${deltaY}px)`,
              opacity: before ? 1 : 0,
            },
            { transform: "translate(0, 0)", opacity: 1 },
          ],
          {
            duration: before ? 300 : 240,
            easing: "cubic-bezier(.16, 1, .3, 1)",
          },
        ),
      );
    });
    previous.current = next;
    initialized.current = true;
  }, [signature]);

  useLayoutEffect(
    () => () => running.current.forEach((animation) => animation.cancel()),
    [],
  );
  return ref;
}
