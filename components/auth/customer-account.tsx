"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Button, InlineAlert } from "@/components/ui";
import { CustomerSessionStore } from "@/lib/auth/customer-session";

export function CustomerAccount({ slug }: { slug: string }) {
  const [store] = useState(() => new CustomerSessionStore(slug));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [googleAttempt, setGoogleAttempt] = useState(0);
  const [googleError, setGoogleError] = useState<string | null>(null);
  useEffect(() => { void store.restore(); return () => store.dispose(); }, [store]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void store.refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [store]);
  const signIn = useCallback((token: string) => { setGoogleError(null); void store.signIn(token); }, [store]);
  const pending = ["checking", "signing-in", "signing-out"].includes(state.status);
  return (
    <section aria-labelledby="customer-account-title" aria-busy={pending} className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <h2 id="customer-account-title" className="text-lg font-semibold">Tu cuenta en este negocio</h2>
      {state.status === "checking" && <p role="status">Comprobando tu sesión…</p>}
      {state.status === "signing-in" && <p role="status">Ingresando con Google…</p>}
      {state.status === "signing-out" && <p role="status">Cerrando sesión…</p>}
      {(state.error || googleError) && <InlineAlert tone="error">{state.error ?? googleError}</InlineAlert>}
      {state.status === "authenticated" && state.session && <>
        <p>Ingresaste como <strong>{state.session.customer.name}</strong>.</p>
        {state.session.customer.email && <p className="break-all text-sm text-on-surface-variant">{state.session.customer.email}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={state.refreshing} onClick={() => void store.refresh()}>{state.refreshing ? "Actualizando…" : "Actualizar cuenta"}</Button>
          <Button variant="outline" onClick={() => void store.signOut()}>Cerrar sesión</Button>
        </div>
      </>}
      {state.status === "error" && <Button variant="outline" onClick={() => void (state.retry === "logout" ? store.signOut() : store.restore())}>
        {state.retry === "logout" ? "Reintentar cierre de sesión" : "Reintentar comprobación"}
      </Button>}
      {(["anonymous", "signing-in"].includes(state.status) || (state.status === "error" && state.retry !== "logout")) && <>
        <p className="text-sm text-on-surface-variant">Ingresá con Google para identificar tu cuenta en este negocio.</p>
        <GoogleLoginButton key={googleAttempt} disabled={pending} onError={setGoogleError} onIdToken={signIn} />
      </>}
      {googleError && !pending && <Button variant="outline" onClick={() => { setGoogleError(null); setGoogleAttempt(value => value + 1); }}>Reintentar Google</Button>}
      <p className="text-sm text-on-surface-variant">La reserva de abajo continúa como invitado.</p>
    </section>
  );
}
