import { Save } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

export type SaveChangesButtonProps = Omit<ButtonProps, "disabled" | "type"> & {
  hasChanges: boolean;
  isSaving: boolean;
};

export function SaveChangesButton({ hasChanges, isSaving, ...props }: SaveChangesButtonProps) {
  return (
    <Button disabled={isSaving || !hasChanges} type="submit" {...props}>
      <Save aria-hidden="true" />
      {isSaving ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}
