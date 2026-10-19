export const customerNotices = {
  created: { title: "Cliente creado", description: "El cliente quedó registrado en tu negocio." },
  updated: { title: "Cliente actualizado", description: "Se guardaron los cambios en sus datos." },
} as const;
export type CustomerNotice = keyof typeof customerNotices;
