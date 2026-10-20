"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, FloatingAlert, InlineAlert } from "@/components/ui";
import { refreshCustomers } from "@/lib/customers/queries";
import { customerNotices, type CustomerNotice } from "./customer-feedback";

type Feedback = { notify: (kind: CustomerNotice, refreshFailed: boolean, id: number) => void };
const Context = createContext<Feedback | null>(null);

export function CustomersWorkspace({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  return <WorkspaceFeedback key={business?.id} businessId={business?.id}>{children}</WorkspaceFeedback>;
}

function WorkspaceFeedback({ children, businessId }: { children: ReactNode; businessId?: number }) {
  const client = useQueryClient();
  const sequence = useRef(0);
  const [notice, setNotice] = useState<{ kind: CustomerNotice; sequence: number } | null>(null);
  const [refreshFailure, setRefreshFailure] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const notify = useCallback((kind: CustomerNotice, failed: boolean, id: number) => {
    setNotice({ kind, sequence: ++sequence.current });
    setRefreshFailure(failed ? id : null);
  }, []);
  const dismiss = useCallback(() => setNotice(null), []);
  async function retryRefresh() {
    if (!businessId || refreshFailure === null || retrying) return;
    setRetrying(true);
    try { await refreshCustomers(client, businessId, refreshFailure); setRefreshFailure(null); }
    catch { /* Retry reads only: the write already succeeded. */ }
    finally { setRetrying(false); }
  }
  return <Context value={{ notify }}>
    {notice ? <FloatingAlert key={notice.sequence} title={customerNotices[notice.kind].title} tone="positive" dismissLabel="Cerrar confirmación" onDismiss={dismiss}>{customerNotices[notice.kind].description}</FloatingAlert> : null}
    {refreshFailure !== null ? <div className="mx-auto mb-4 w-full max-w-4xl px-5 md:px-0"><InlineAlert tone="error" title="El cambio se guardó, pero no pudimos actualizar los datos">
      Reintentá la actualización para consultar la información más reciente. <Button variant="ghost" disabled={retrying} onClick={() => void retryRefresh()}>{retrying ? "Actualizando…" : "Reintentar actualización"}</Button>
    </InlineAlert></div> : null}
    {children}
  </Context>;
}

export function useCustomerFeedback() {
  const value = useContext(Context);
  if (!value) throw new Error("Customer feedback requires CustomersWorkspace");
  return value;
}
