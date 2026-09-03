"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    callback: (response: GoogleCredentialResponse) => void;
    client_id: string;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      size: "large";
      text: "continue_with";
      theme: "outline";
      width: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return {
      cleanup: () => {},
      promise: Promise.resolve(),
    };
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${GOOGLE_SCRIPT_SRC}"]`,
  );
  const script = existingScript ?? document.createElement("script");

  let cleanup = () => {};

  const promise = new Promise<void>((resolve, reject) => {
    function handleLoad() {
      resolve();
    }

    function handleError() {
      reject(new Error("Google Identity Services failed to load."));
    }

    cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (existingScript) {
      return;
    }

    script.async = true;
    script.defer = true;
    script.src = GOOGLE_SCRIPT_SRC;

    document.head.appendChild(script);
  });

  return { cleanup, promise };
}

export function GoogleLoginButton({
  disabled = false,
  onError,
  onIdToken,
}: {
  disabled?: boolean;
  onError: (message: string) => void;
  onIdToken: (idToken: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) {
      onError("Falta configurar el Client ID de Google.");
      return;
    }

    let isMounted = true;
    const scriptLoad = loadGoogleIdentityScript();

    scriptLoad.promise
      .then(() => {
        if (!isMounted || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          callback: (response) => {
            if (response.credential) {
              onIdToken(response.credential);
              return;
            }

            onError("No pudimos obtener la identidad de Google. Intentá nuevamente.");
          },
          client_id: googleClientId,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          size: "large",
          text: "continue_with",
          theme: "outline",
          width: 320,
        });
        setIsReady(true);
      })
      .catch(() => {
        onError("No pudimos cargar el inicio de sesión con Google.");
      });

    return () => {
      isMounted = false;
      scriptLoad.cleanup();
    };
  }, [googleClientId, onError, onIdToken]);

  return (
    <div aria-busy={!isReady || disabled} className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <div ref={buttonRef} />
    </div>
  );
}
