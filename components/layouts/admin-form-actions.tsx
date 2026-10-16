"use client";

import type { ReactNode } from "react";

import { SaveActionFeedback } from "@/components/ui/save-action-feedback";
import { SaveChangesButton } from "@/components/ui/save-changes-button";
import { AdminMobileStickyAction } from "./admin-mobile-sticky-action";

export type AdminFormActionsProps = {
  children?: ReactNode;
  formId: string;
  hasChanges: boolean;
  isSaving: boolean;
  mobileSaveTestId?: string;
};

/** One visible Save action per viewport, with space reserved for its feedback. */
export function AdminFormActions({ children, formId, hasChanges, isSaving, mobileSaveTestId }: AdminFormActionsProps) {
  return (
    <>
      <SaveActionFeedback hasChanges={hasChanges} isSaving={isSaving}>{children}</SaveActionFeedback>
      <AdminMobileStickyAction>
        <SaveChangesButton className="w-full" data-testid={mobileSaveTestId} form={formId} hasChanges={hasChanges} isSaving={isSaving} />
      </AdminMobileStickyAction>
    </>
  );
}
