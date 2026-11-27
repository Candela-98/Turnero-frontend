import { apiFetch, type ApiRequestOptions } from "@/lib/api/client";

export type CustomerSession = {
  business: { id: number; name: string; slug: string };
  customer: { id: number; name: string; email: string | null; phone: string | null; status: string; bookingBlocked: boolean };
};
export type CustomerSessionDto = {
  business: CustomerSession["business"];
  customer: Omit<CustomerSession["customer"], "phone" | "bookingBlocked"> & { phone_number: string | null; public_booking_blocked: boolean };
};

export function customerEndpoint(slug: string, resource: string) {
  if (!resource || resource.startsWith("/") || resource.includes("..") || resource.includes("#")) throw new Error("Invalid customer resource");
  return `/api/v1/customer/businesses/${encodeURIComponent(slug)}/${resource}`;
}

export async function customerSessionRequest(slug: string, resource: "google" | "me", options: ApiRequestOptions) {
  const dto = await apiFetch<CustomerSessionDto>(customerEndpoint(slug, `auth/${resource}`), { ...options, cache: "no-store" });
  return adaptCustomerSession(slug, dto);
}

export function adaptCustomerSession(slug: string, dto: CustomerSessionDto): CustomerSession {
  if (dto?.business?.slug !== slug || !Number.isSafeInteger(dto?.business?.id) || !Number.isSafeInteger(dto?.customer?.id)) {
    throw new Error("Invalid customer session response");
  }
  return {
    business: { id: dto.business.id, name: dto.business.name, slug: dto.business.slug },
    customer: { id: dto.customer.id, name: dto.customer.name, email: dto.customer.email, phone: dto.customer.phone_number,
      status: dto.customer.status, bookingBlocked: dto.customer.public_booking_blocked },
  } satisfies CustomerSession;
}
