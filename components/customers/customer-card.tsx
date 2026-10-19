import { Mail, Phone } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import type { CustomerSummary } from "@/lib/customers/api";
import type { ReactNode } from "react";

export function CustomerCard({ customer, actions }: { customer: CustomerSummary; actions?: ReactNode }) {
  const initials = customer.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toLocaleUpperCase("es-AR");
  return <article className="flex flex-wrap items-start gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-soft sm:items-center sm:p-5">
    <Avatar name={customer.name} initials={initials} size="lg" />
    <div className="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 break-words text-base font-semibold sm:text-lg">{customer.name}</h2>
        <Badge tone={customer.status === "ACTIVE" ? "positive" : "neutral"}>{customer.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge>
      </div>
      <div className="mt-1 flex flex-col gap-1 text-sm text-on-surface-variant sm:flex-row sm:flex-wrap sm:gap-x-5">
        {customer.phoneNumber ? <p className="flex min-w-0 items-start gap-2"><Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span className="sr-only">Teléfono: </span><span className="min-w-0 break-all">{customer.phoneNumber}</span></p> : null}
        {customer.email ? <p className="flex min-w-0 items-start gap-2"><Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span className="sr-only">Email: </span><span className="min-w-0 break-all">{customer.email}</span></p> : null}
      </div>
    </div>
    {actions ? <div className="flex w-full justify-end sm:w-auto sm:shrink-0">{actions}</div> : null}
  </article>;
}
