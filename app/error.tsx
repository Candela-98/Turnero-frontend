"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button, InlineAlert } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-12 text-on-surface">
      <section className="w-full max-w-md">
        <InlineAlert tone="error" title="No pudimos cargar esta vista">
          Algo fallo al preparar la pantalla. Proba de nuevo en unos segundos.
        </InlineAlert>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-error-container text-on-error-container">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Turnero</h1>
            <p className="text-sm text-on-surface-variant">El equipo ya puede revisar el error.</p>
          </div>
        </div>
        <Button className="mt-6 w-full" onClick={reset}>
          Reintentar
        </Button>
      </section>
    </main>
  );
}
