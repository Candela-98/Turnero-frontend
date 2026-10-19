import { Users } from "lucide-react";
import { EmptyState, Pagination } from "@/components/ui";
import type { CustomerSummary } from "@/lib/customers/api";
import { CustomerCard } from "./customer-card";
import type { ReactNode } from "react";

type Props = { customers: CustomerSummary[]; total: number; page: number; pageCount: number; filtered: boolean; onPageChange: (page: number) => void; renderActions?: (customer: CustomerSummary) => ReactNode; emptyAction?: ReactNode };
export function CustomersList({ customers, total, page, pageCount, filtered, onPageChange, renderActions, emptyAction }: Props) {
  return <section aria-label="Lista de clientes" className="space-y-3">
    <p aria-live="polite" className="text-sm text-on-surface-variant">{total} {total === 1 ? "cliente" : "clientes"}</p>
    {customers.length ? customers.map(customer => <CustomerCard key={customer.id} customer={customer} actions={renderActions?.(customer)} />) :
      <EmptyState icon={<Users />} title={filtered ? "No encontramos clientes" : "Todavía no hay clientes"}
        description={filtered ? "Probá con otra búsqueda o cambiá los filtros." : "Los clientes del negocio aparecerán acá."} action={!filtered ? emptyAction : undefined} />}
    <Pagination label="Paginación de clientes" page={page} pageCount={pageCount} onPageChange={onPageChange} />
  </section>;
}
