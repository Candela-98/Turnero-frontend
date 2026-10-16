"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, FloatingAlert, InlineAlert } from "@/components/ui";
import { refreshServiceCatalog } from "@/lib/service-offerings/queries";
import { serviceNotices, ServicesFeedbackContext, type ServiceNotice } from "./services-feedback-context";

/** Shared feedback for service catalog mutations. */
export function ServicesWorkspace({ children }: { children: ReactNode }) {
  const sequence = useRef(0);
  const client = useQueryClient();
  const { business } = useAuth();
  const [notice, setNotice] = useState<{ kind: ServiceNotice; sequence: number } | null>(null);
  const [refreshFailure, setRefreshFailure] = useState<{ id?: number } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const notify = useCallback((kind: ServiceNotice, failed: boolean, id?: number) => {
    setNotice({ kind, sequence: ++sequence.current });
    setRefreshFailure(failed ? { id } : null);
  }, []);
  const dismiss = useCallback(() => setNotice(null), []);

  async function retryRefresh() {
    if (!business || retrying) return;
    setRetrying(true);
    try { await refreshServiceCatalog(client, business.id, refreshFailure?.id); setRefreshFailure(null); }
    catch { /* The confirmed write remains visible; this action retries reads only. */ }
    finally { setRetrying(false); }
  }

  return <ServicesFeedbackContext value={{ notify }}>
    {notice ? <FloatingAlert key={notice.sequence} title={serviceNotices[notice.kind].title} tone="positive" dismissLabel="Cerrar confirmación" onDismiss={dismiss}>{serviceNotices[notice.kind].description}</FloatingAlert> : null}
    {refreshFailure ? <div className="mb-4 px-5 md:px-0"><InlineAlert tone="error">El cambio se guardó, pero no pudimos actualizar los datos. <Button variant="ghost" disabled={retrying} onClick={() => void retryRefresh()}>{retrying ? "Actualizando…" : "Reintentar actualización"}</Button></InlineAlert></div> : null}
    {children}
  </ServicesFeedbackContext>;
}
