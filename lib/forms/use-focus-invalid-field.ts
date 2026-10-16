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
        const container = input.closest<HTMLElement>("[data-dialog-scroll]");
        const start = container ? container.scrollTop : window.scrollY;
        const height = container ? container.clientHeight : window.innerHeight;
        const top = container ? container.getBoundingClientRect().top : 0;
        const scrollTo = (value: number) => container ? container.scrollTo(0, value) : window.scrollTo(0, value);
        const maxScroll = Math.max(0, container ? container.scrollHeight - height : document.documentElement.scrollHeight - height);
        const target = Math.max(0, Math.min(maxScroll, start + input.getBoundingClientRect().top - top - height / 2));

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          scrollTo(target);
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
          scrollTo(start + (target - start) * eased);
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
