import { apiFetch } from "@/lib/api/client";
import { toServiceOffering, type ServiceOffering, type ServiceOfferingDto } from "@/lib/service-offerings/api";

export function selectedServiceIds(services: readonly ServiceOffering[]): number[] {
  return [...new Set(services.map(service => service.id))].sort((a, b) => a - b);
}
export function sameServiceSelection(a: readonly ServiceOffering[], b: readonly ServiceOffering[]) {
  const left = selectedServiceIds(a);
  const right = selectedServiceIds(b);
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
export async function getStaffServices(id: number, signal?: AbortSignal) {
  const result = await apiFetch<ServiceOfferingDto[]>(`/api/v1/staff-members/${id}/service-offerings`, { signal });
  return result.map(toServiceOffering);
}
export function replaceStaffServices(id: number, services: readonly ServiceOffering[]): Promise<void> {
  return apiFetch<void>(`/api/v1/staff-members/${id}/service-offerings`, {
    method: "PUT", body: { service_offering_ids: selectedServiceIds(services) },
  });
}
