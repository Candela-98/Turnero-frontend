"use client";

import { type ReactNode, useContext, useEffect, useEffectEvent, useState } from "react";

import { InlineAlert } from "@/components/ui/inline-alert";
import { cn } from "@/lib/utils";
import { SaveFeedbackContext } from "./save-feedback-context";

export type FloatingAlertProps = {
  autoDismissMs?: number;
  className?: string;
  placement?: "dialog" | "viewport";
  children: ReactNode;
  dismissLabel: string;
  onDismiss: () => void;
  title: string;
  tone: "error" | "positive";
};

/** Viewport feedback follows scroll by default. Dialog feedback must be explicit. */
export function FloatingAlert({ autoDismissMs, className, placement = "viewport", children, dismissLabel, onDismiss, title, tone }: FloatingAlertProps) {
  const aboveSaveAction = useContext(SaveFeedbackContext);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const timeoutMs = autoDismissMs ?? (tone === "positive" ? 6000 : undefined);
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!timeoutMs || isHovered || hasFocus) return;
    const timeout = window.setTimeout(() => dismiss(), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [hasFocus, isHovered, timeoutMs, title]);

  return (
    <div
      className={cn(
        placement === "dialog" ? "relative w-full" : "pointer-events-none fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-11rem)] overflow-y-auto md:inset-x-auto md:bottom-6 md:right-6 md:w-[min(28rem,calc(100vw-23rem))]",
        placement === "viewport" && aboveSaveAction && "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-44",
        className,
      )}
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
