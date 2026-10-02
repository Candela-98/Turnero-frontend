import { Pagination } from "@/components/ui";
import type { ServiceOffering } from "@/lib/service-offerings/api";
import { ServiceOfferingCard } from "./service-offering-card";

export type ServiceOfferingsListProps = {
  services: ServiceOffering[];
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function ServiceOfferingsList({ services, total, page, pageCount, onPageChange }: ServiceOfferingsListProps) {
  return <section aria-label="Lista de servicios" className="space-y-3">
    <p aria-live="polite" className="text-sm text-on-surface-variant">{total} {total === 1 ? "servicio" : "servicios"}</p>
    {services.map(service => <ServiceOfferingCard key={service.id} service={service} />)}
    <Pagination label="Paginación de servicios" page={page} pageCount={pageCount} onPageChange={onPageChange} />
  </section>;
}
