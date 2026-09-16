"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Scissors, UsersRound } from "lucide-react";

import { BrandMark } from "@/components/layouts/brand-mark";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Button, InlineAlert } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export function LoginPage() {
  const router = useRouter();
  const { error: sessionError, signInWithGoogle, status } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      setLoginError(null);

      try {
        await signInWithGoogle(idToken);
        router.replace("/");
      } catch (error) {
        setLoginError(getAuthErrorMessage(error));
      }
    },
    [router, signInWithGoogle],
  );

  const message = loginError ?? sessionError;
  const isLoading = status === "loading";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 text-on-surface sm:px-8 sm:py-12">
      <section className="flex w-full max-w-[440px] flex-col gap-8">
        <BrandMark variant="login" />

        <div className="relative rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-panel sm:p-10">
          <div className="text-center">
            <h1 className="text-xl font-bold">Ingresar al panel</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Usá tu cuenta autorizada de Google para administrar Turnero.
            </p>
          </div>

          {message ? (
            <InlineAlert className="mt-5" tone="error">
              {message}
            </InlineAlert>
          ) : null}

          <div className="mt-6">
            <GoogleLoginButton
              disabled={isLoading}
              onError={setLoginError}
              onIdToken={handleGoogleToken}
            />
          </div>

          {isLoading ? (
            <p className="mt-4 text-center text-sm text-on-surface-variant">Validando sesión...</p>
          ) : null}

          {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <Button className="mt-4 w-full" disabled variant="outline">
              Google no configurado
            </Button>
          ) : null}

          <p className="mt-8 border-t border-outline-variant/15 pt-6 text-center text-xs text-on-surface-variant/80">
            Al continuar aceptás las políticas del negocio.
          </p>
        </div>

        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-4 text-xs font-medium text-secondary/60">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-[18px]" />
            Agenda del día
          </li>
          <li className="flex items-center gap-2">
            <UsersRound aria-hidden="true" className="size-[18px]" />
            Clientes
          </li>
          <li className="flex items-center gap-2">
            <Scissors aria-hidden="true" className="size-[18px]" />
            Servicios
          </li>
        </ul>
      </section>
    </main>
  );
}
