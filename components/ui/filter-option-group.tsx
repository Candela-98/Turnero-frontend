"use client";

import { useId, useState, type ReactNode } from "react";
import { Input } from "./input";

export type FilterOption<Value extends string = string> = {
  value: Value;
  label: string;
  /** Keep reset/all options visible while searching. */
  pinned?: boolean;
};
export type FilterOptionGroupProps<Value extends string = string> = {
  label: string;
  value: Value;
  options: readonly FilterOption<Value>[];
  onValueChange: (value: Value) => void;
  searchThreshold?: number;
  searchLabel?: string;
  emptySearchMessage?: string;
  disabled?: boolean;
  children?: ReactNode;
};

/** Single selection with native radio keyboard behavior and optional local search. */
export function FilterOptionGroup<Value extends string>({ label, value, options, onValueChange, searchThreshold, searchLabel = `Buscar ${label.toLocaleLowerCase()}`, emptySearchMessage = "No encontramos opciones.", disabled = false, children }: FilterOptionGroupProps<Value>) {
  const id = useId();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const visible = options.filter(option => option.pinned || option.label.toLocaleLowerCase().includes(query));
  const showSearch = searchThreshold !== undefined && options.filter(option => !option.pinned).length > searchThreshold;
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      {showSearch ? <div className="mb-3"><label className="sr-only" htmlFor={id}>{searchLabel}</label><Input id={id} type="search" placeholder={searchLabel} value={search} onChange={event => setSearch(event.target.value)} /></div> : null}
      {children}
      <div className="flex flex-wrap gap-2">
        {visible.map(option => <label key={option.value} className="relative max-w-full">
          <input className="peer absolute inset-0 size-full cursor-pointer opacity-0" type="radio" name={id} value={option.value} checked={value === option.value} onChange={() => onValueChange(option.value)} />
          <span className="flex min-h-11 cursor-pointer items-center justify-center break-words rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface-variant peer-checked:border-primary/40 peer-checked:bg-primary-fixed peer-checked:text-primary peer-focus-visible:outline-focus-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50 md:min-h-9">{option.label}</span>
        </label>)}
      </div>
      {query && !visible.some(option => !option.pinned) ? <p className="mt-3 text-sm text-on-surface-variant">{emptySearchMessage}</p> : null}
    </fieldset>
  );
}
