"use client";
import { useSyncExternalStore } from "react";
const subscribe = (notify: () => void) => { const timer = window.setInterval(notify, 1000); return () => window.clearInterval(timer); };
const snapshot = () => Math.floor(Date.now() / 60000) * 60000;
const serverSnapshot = () => null;
/** Stable minute snapshot; updates Today and the now marker without refetching every tick. */
export function useAgendaClock() { return useSyncExternalStore<number | null>(subscribe, snapshot, serverSnapshot); }
