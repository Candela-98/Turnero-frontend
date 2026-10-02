import type { ReactNode } from "react";
import { SearchInput, type SearchInputProps } from "./search-input";

export type ListToolbarProps = {
  label: string;
  search: SearchInputProps;
  filterAction?: ReactNode;
  appliedFilters?: ReactNode;
  appliedFiltersLabel?: string;
};

export function ListToolbar({ label, search, filterAction, appliedFilters, appliedFiltersLabel = "Filtros aplicados" }: ListToolbarProps) {
  return (
    <section aria-label={label} className="mb-6 space-y-3">
      <div className="flex items-center gap-2 md:gap-3"><SearchInput {...search} />{filterAction}</div>
      {appliedFilters ? <div aria-label={appliedFiltersLabel} className="flex flex-wrap gap-2">{appliedFilters}</div> : null}
    </section>
  );
}
