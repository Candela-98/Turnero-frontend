"use client";

import type { ReactNode } from "react";

import { LoginPage } from "@/components/auth/login-page";
import { InlineAlert, Skeleton } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";

export function ProtectedAdmin({ children }: { children: ReactNode }) {
  const { error, status } = useAuth();

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-surface px-6 py-10 text-on-surface">
        <section className="mx-auto w-full max-w-5xl">
          <Skeleton className="h-12 w-56" />
          <Skeleton className="mt-8 h-16 w-full" />
          <Skeleton className="mt-6 h-[32rem] w-full" />
        </section>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <LoginPage />;
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-10 text-on-surface">
        <section className="w-full max-w-md">
          <InlineAlert tone="error">{error}</InlineAlert>
        </section>
      </main>
    );
  }

  return (
    <>
      {error ? (
        <div className="bg-surface px-5 pt-5">
          <InlineAlert className="mx-auto max-w-3xl" tone="error">
            {error}
          </InlineAlert>
        </div>
      ) : null}
      {children}
    </>
  );
}
