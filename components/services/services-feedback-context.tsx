"use client";

import { createContext, useContext } from "react";

export const serviceNotices = {
  created: { title: "Servicio creado", description: "Ya está disponible en tu catálogo." },
  updated: { title: "Servicio actualizado", description: "Los cambios se guardaron correctamente." },
  deactivated: { title: "Servicio desactivado", description: "Podés restaurarlo desde los servicios inactivos." },
  restored: { title: "Servicio restaurado", description: "El servicio vuelve a estar activo." },
  removed: { title: "Servicio eliminado", description: "Se quitó del catálogo. El historial de turnos se conserva." },
} as const;

export type ServiceNotice = keyof typeof serviceNotices;

export const ServicesFeedbackContext = createContext<{ notify: (kind: ServiceNotice, refreshFailed: boolean, id?: number) => void } | null>(null);

export function useServicesFeedback() {
  const feedback = useContext(ServicesFeedbackContext);
  if (!feedback) throw new Error("Services feedback requires ServicesWorkspace");
  return feedback;
}
