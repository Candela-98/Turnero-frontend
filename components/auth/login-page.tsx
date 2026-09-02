"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-10 text-on-surface">
      <section className="w-full max-w-sm">
        <BrandMark className="justify-center" />

        <div className="mt-8 rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-panel">
          <div>
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

          <div className="mt-6 flex justify-center">
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
        </div>
      </section>
    </main>
  );
}
