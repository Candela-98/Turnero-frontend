export const customerNotices = {
  created: { title: "Cliente creado", description: "El cliente quedó registrado en tu negocio." },
  updated: { title: "Cliente actualizado", description: "Se guardaron los cambios en sus datos." },
  archived: { title: "Cliente archivado", description: "Ya no aparece en la lista habitual. Sus datos y turnos se conservan." },
  restored: { title: "Cliente restaurado", description: "Vuelve a aparecer en la lista habitual." },
  blocked: { title: "Reservas públicas bloqueadas", description: "No podrá reservar por el enlace público. Podés asignarle turnos manualmente." },
  unblocked: { title: "Reservas públicas desbloqueadas", description: "Puede volver a reservar por el enlace público." },
} as const;
export type CustomerNotice = keyof typeof customerNotices;
