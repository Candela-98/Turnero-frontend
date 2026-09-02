import { ApiError } from "@/lib/api/client";

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Iniciá sesión para continuar. Si tu sesión venció, volvé a ingresar.";
    }

    if (error.status === 403) {
      return "Tu usuario no tiene acceso al panel administrativo de Turnero.";
    }

    return "No pudimos conectar con Turnero. Intentá nuevamente en unos segundos.";
  }

  if (error instanceof Error && error.message === "NEXT_PUBLIC_API_BASE_URL is not configured.") {
    return "Falta configurar la URL del backend de Turnero.";
  }

  return "Ocurrió un error inesperado. Intentá nuevamente.";
}
