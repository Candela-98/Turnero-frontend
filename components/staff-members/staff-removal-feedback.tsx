"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
type Feedback = { id: number; failed: boolean };
const Context = createContext<{ feedback: Feedback | null; notify: (feedback: Feedback) => void; clear: () => void } | null>(null);
export function StaffRemovalFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const clear = useCallback(() => setFeedback(null), []);
  return <Context.Provider value={{ feedback, notify: setFeedback, clear }}>{children}</Context.Provider>;
}
export function useStaffRemovalFeedback() {
  const value = useContext(Context);
  if (!value) throw new Error("Staff removal feedback requires its provider");
  return value;
}
