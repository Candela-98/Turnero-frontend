"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StaffFilters } from "./api";
import { staffContextSearch, staffListContext } from "./navigation";

export function useStaffListNavigation() {
  const params = useSearchParams();
  const filters = useMemo(() => staffListContext(params), [params]);
  const [search, setSearch] = useState(filters.q);
  const [seenQuery, setSeenQuery] = useState(filters.q);
  if (seenQuery !== filters.q) { setSeenQuery(filters.q); setSearch(filters.q); }
  const write = useCallback((next: StaffFilters) => { window.history.replaceState(null, "", `/profesionales${staffContextSearch(next)}`); }, []);
  useEffect(() => {
    if (search.trim() === filters.q) return;
    const timer = window.setTimeout(() => write({ ...filters, q: search.trim(), page: 0 }), 300);
    return () => window.clearTimeout(timer);
  }, [search, filters, write]);
  const setStatus = useCallback((status: StaffFilters["status"]) => write({ ...filters, q: search.trim(), status, page: 0 }), [filters, search, write]);
  const setPage = useCallback((page: number) => write({ ...filters, page }), [filters, write]);
  return { filters, search, setSearch, context: staffContextSearch(filters),
    setStatus, setPage };
}
