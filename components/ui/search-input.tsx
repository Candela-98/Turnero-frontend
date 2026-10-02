"use client";

import { Search } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./input";

export type SearchInputProps = Omit<InputProps, "type"> & { label: string };

export function SearchInput({ label, id, className, ...props }: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="min-w-0 flex-1">
      <label className="sr-only" htmlFor={inputId}>{label}</label>
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
        <Input {...props} id={inputId} type="search" className={cn("rounded-lg pl-10 shadow-none md:h-9", className)} />
      </div>
    </div>
  );
}
