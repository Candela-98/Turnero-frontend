"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerFilters } from "./api";
import { customerContextSearch, customerListContext } from "./navigation";

export function useCustomerListNavigation() {
  const params = useSearchParams();
  const filters = useMemo(() => customerListContext(params), [params]);
  const [search, setSearch] = useState(filters.q);
  const [seenQuery, setSeenQuery] = useState(filters.q);
  if (seenQuery !== filters.q) { setSeenQuery(filters.q); setSearch(filters.q); }
  const write = useCallback((next: CustomerFilters) => {
    window.history.replaceState(null, "", "/clientes" + customerContextSearch(next));
  }, []);
  useEffect(() => {
    if (search.trim() === filters.q) return;
    const timer = window.setTimeout(() => write({ ...filters, q: search.trim(), page: 0 }), 300);
    return () => window.clearTimeout(timer);
  }, [search, filters, write]);
  const setStatus = useCallback((status: CustomerFilters["status"]) => {
    write({ ...filters, q: search.trim(), status, page: 0 });
  }, [filters, search, write]);
  const setPage = useCallback((page: number) => write({ ...filters, page }), [filters, write]);
  return { filters, search, setSearch, setStatus, setPage };
}
