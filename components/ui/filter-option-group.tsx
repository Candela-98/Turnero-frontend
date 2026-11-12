"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Input } from "./input";

export const FILTER_SCROLL_FADE_PX = 16;

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
  layout?: "wrap" | "scroll";
  hideLegend?: boolean;
  edgeFades?: boolean;
};

/** Single selection with native radio keyboard behavior and optional local search. */
export function FilterOptionGroup<Value extends string>({ label, value, options, onValueChange, searchThreshold, searchLabel = `Buscar ${label.toLocaleLowerCase()}`, emptySearchMessage = "No encontramos opciones.", disabled = false, children, layout = "wrap", hideLegend = false, edgeFades = false }: FilterOptionGroupProps<Value>) {
  const id = useId();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const visible = options.filter(option => option.pinned || option.label.toLocaleLowerCase().includes(query));
  const showSearch = searchThreshold !== undefined && options.filter(option => !option.pinned).length > searchThreshold;
  const rowRef=useRef<HTMLDivElement>(null);
  const [edges,setEdges]=useState({start:false,end:false});
  const optionLayout=visible.map(option=>`${option.value}:${option.label}`).join("\0");
  useLayoutEffect(()=>{
    const row=rowRef.current;
    if(!edgeFades||layout!=="scroll"||!row)return;
    const update=()=>{
      const max=Math.max(0,row.scrollWidth-row.clientWidth);
      const start=row.scrollLeft>1,end=max-row.scrollLeft>1;
      setEdges(previous=>previous.start===start&&previous.end===end?previous:{start,end});
    };
    update();row.addEventListener("scroll",update,{passive:true});
    const resize=new ResizeObserver(update);resize.observe(row);
    for(const option of row.children)resize.observe(option);
    return ()=>{row.removeEventListener("scroll",update);resize.disconnect();};
  },[edgeFades,layout,optionLayout]);
  const optionRow = (<div ref={rowRef} data-filter-options className={layout === "scroll" ? "flex gap-2 overflow-x-auto py-1" : "flex flex-wrap gap-2"}>
        {visible.map(option => <label key={option.value} className={layout === "scroll" ? "relative shrink-0" : "relative max-w-full"} title={option.label}>
          <input className="peer absolute inset-0 size-full cursor-pointer opacity-0" type="radio" name={id} value={option.value} checked={value === option.value} onChange={() => onValueChange(option.value)} />
          <span className="flex min-h-11 cursor-pointer items-center justify-center break-words rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface-variant peer-checked:border-primary/40 peer-checked:bg-primary-fixed peer-checked:text-primary peer-focus-visible:outline-focus-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50 md:min-h-9">{option.label}</span>
        </label>)}
      </div>);
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={hideLegend ? "sr-only" : "mb-3 text-sm font-semibold"}>{label}</legend>
      {showSearch ? <div className="mb-3"><label className="sr-only" htmlFor={id}>{searchLabel}</label><Input id={id} type="search" placeholder={searchLabel} value={search} onChange={event => setSearch(event.target.value)} /></div> : null}
      {children}
      {edgeFades && layout === "scroll" ? <div className="relative min-w-0">
        {optionRow}
        {edges.start ? <span aria-hidden="true" data-filter-fade="start" className="pointer-events-none absolute inset-y-1 left-0 z-10 bg-linear-to-r from-surface to-transparent" style={{width:FILTER_SCROLL_FADE_PX}} /> : null}
        {edges.end ? <span aria-hidden="true" data-filter-fade="end" className="pointer-events-none absolute inset-y-1 right-0 z-10 bg-linear-to-l from-surface to-transparent" style={{width:FILTER_SCROLL_FADE_PX}} /> : null}
      </div> : optionRow}
      {query && !visible.some(option => !option.pinned) ? <p className="mt-3 text-sm text-on-surface-variant">{emptySearchMessage}</p> : null}
    </fieldset>
  );
}
