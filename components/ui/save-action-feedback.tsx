import type { ReactNode } from "react";

import { SaveChangesButton } from "@/components/ui/save-changes-button";

export type SaveActionFeedbackProps = {
  children: ReactNode;
  hasChanges: boolean;
  isSaving: boolean;
};

/** Anchors desktop feedback eight pixels above Save; mobile feedback stays above the sticky action. */
export function SaveActionFeedback({ children, hasChanges, isSaving }: SaveActionFeedbackProps) {
  return (
    <div className="relative md:mt-7 md:flex md:justify-end md:border-t md:border-outline-variant md:pt-6">
      <div className="relative h-0 md:flex md:h-auto">
        <SaveChangesButton className="hidden md:inline-flex" hasChanges={hasChanges} isSaving={isSaving} />
        {children}
      </div>
    </div>
  );
}
