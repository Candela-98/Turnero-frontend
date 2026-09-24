"use client";

import { type ReactNode, useEffect, useState } from "react";

import { InlineAlert } from "@/components/ui/inline-alert";

export type FloatingAlertProps = {
  autoDismissMs?: number;
  children: ReactNode;
  dismissLabel: string;
  onDismiss: () => void;
  title: string;
  tone: "error" | "positive";
};

/** Feedback visible regardless of the form's scroll position. Actionable alerts do not time out. */
export function FloatingAlert({ autoDismissMs, children, dismissLabel, onDismiss, title, tone }: FloatingAlertProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const timeoutMs = autoDismissMs ?? (tone === "positive" ? 6000 : undefined);

  useEffect(() => {
    if (!timeoutMs || isHovered || hasFocus) return;
    const timeout = window.setTimeout(onDismiss, timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [hasFocus, isHovered, onDismiss, timeoutMs]);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-11rem)] overflow-y-auto md:inset-x-auto md:bottom-6 md:right-6 md:w-[min(28rem,calc(100vw-3rem))] md:max-h-[calc(100dvh-3rem)]"
      data-testid="floating-alert"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
      onFocusCapture={() => setHasFocus(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <InlineAlert
        className="pointer-events-auto shadow-panel"
        dismissLabel={dismissLabel}
        onDismiss={onDismiss}
        role={tone === "error" ? "alert" : "status"}
        title={title}
        tone={tone}
      >
        {children}
      </InlineAlert>
    </div>
  );
}
