"use client";

import { X } from "lucide-react";
import { Button } from "./button";

export type AppliedFilterChipProps = {
  label: string;
  onRemove: () => void;
  removeLabel?: string;
};

export function AppliedFilterChip({ label, onRemove, removeLabel = `Quitar filtro ${label}` }: AppliedFilterChipProps) {
  return (
    <Button variant="outline" size="sm" className="max-w-full rounded-md border-primary/30 bg-primary-fixed text-sm font-medium text-primary shadow-none hover:bg-primary-fixed-dim md:h-9 md:min-h-9" aria-label={removeLabel} onClick={onRemove}>
      <span className="truncate">{label}</span><X aria-hidden="true" className="shrink-0" />
    </Button>
  );
}
