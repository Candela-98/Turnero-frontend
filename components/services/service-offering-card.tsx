import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ServiceOffering } from "@/lib/service-offerings/api";

const priceFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

export type ServiceOfferingCardProps = { service: ServiceOffering };

export function ServiceOfferingCard({ service }: ServiceOfferingCardProps) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><h2 className="min-w-0 text-base font-semibold sm:text-lg">{service.name}</h2><Badge tone={service.status === "ACTIVE" ? "positive" : "neutral"}>{service.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge></div>
        {service.category ? <p className="mt-1 text-sm text-on-surface-variant">{service.category}</p> : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-outline-variant pt-3 sm:mt-0 sm:min-w-52 sm:justify-end sm:border-0 sm:pt-0">
        <span className="flex items-center gap-1.5 text-sm text-on-surface-variant"><Clock3 aria-hidden="true" className="size-4" />{service.durationMinutes} min</span>
        <span className="font-semibold">{priceFormatter.format(service.priceCents / 100)}</span>
      </div>
    </article>
  );
}
