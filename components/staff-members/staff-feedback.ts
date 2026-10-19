export const staffNotices = {
  created: { title: "Profesional creado", description: "Ya forma parte del equipo. Sus horarios iniciales se copiaron de los del negocio." },
  updated: { title: "Profesional actualizado", description: "Su perfil ya muestra la información que cargaste." },
  deactivated: { title: "Profesional desactivado", description: "Podés reactivarlo desde los profesionales inactivos." },
  reactivated: { title: "Profesional reactivado", description: "Puede volver a recibir reservas según sus servicios y horarios." },
  removed: { title: "Profesional eliminado", description: "Se quitó del listado. El historial de turnos se conserva." },
  hoursUpdated: { title: "Horarios actualizados", description: "Se guardaron los días y rangos horarios que seleccionaste." },
  servicesUpdated: { title: "Servicios actualizados", description: "Los servicios seleccionados quedaron asociados a este profesional." },
} as const;

export type StaffNotice = keyof typeof staffNotices;
