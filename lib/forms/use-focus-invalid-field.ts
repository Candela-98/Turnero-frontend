"use client";

import { useCallback, useEffect, useRef } from "react";

/** Focus the first invalid input after a measured, reduced-motion-aware scroll. */
export function useFocusInvalidField() {
  const scrollFrame = useRef<number | null>(null);

  useEffect(() => () => {
    if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
  }, []);

  return useCallback((fieldId: string) => {
    if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = window.requestAnimationFrame(() => {
      const input = document.getElementById(fieldId);
      if (!input) {
        scrollFrame.current = null;
        return;
      }

      scrollFrame.current = window.requestAnimationFrame(() => {
        const start = window.scrollY;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const target = Math.max(0, Math.min(maxScroll, start + input.getBoundingClientRect().top - window.innerHeight / 2));

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          window.scrollTo(0, target);
          input.focus({ preventScroll: true });
          scrollFrame.current = null;
          return;
        }

        let startedAt: number | null = null;
        const animate = (now: number) => {
          startedAt ??= now;
          const progress = Math.min((now - startedAt) / 700, 1);
          const eased = progress < 0.5
            ? 4 * progress ** 3
            : 1 - (-2 * progress + 2) ** 3 / 2;
          window.scrollTo(0, start + (target - start) * eased);
          if (progress < 1) {
            scrollFrame.current = window.requestAnimationFrame(animate);
          } else {
            input.focus({ preventScroll: true });
            scrollFrame.current = null;
          }
        };
        scrollFrame.current = window.requestAnimationFrame(animate);
      });
    });
  }, []);
}
