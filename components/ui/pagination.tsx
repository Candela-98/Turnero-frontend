"use client";

import { Button } from "./button";

export type PaginationProps = {
  /** Zero based page index, matching the API contract. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
  disabled?: boolean;
};

export function Pagination({ page, pageCount, onPageChange, label = "Paginación", disabled = false }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3 pt-4">
      <Button disabled={disabled || page <= 0} onClick={() => onPageChange(page - 1)} variant="outline">Anterior</Button>
      <span className="text-center text-sm">Página {page + 1} de {pageCount}</span>
      <Button disabled={disabled || page + 1 >= pageCount} onClick={() => onPageChange(page + 1)} variant="outline">Siguiente</Button>
    </nav>
  );
}
