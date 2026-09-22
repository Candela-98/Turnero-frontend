export type BusinessApiResponse = {
  id: number;
  name: string;
  slug: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  status: string;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
};

export type BusinessFormValues = {
  name: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
};

export type BusinessUpdateRequest = {
  name: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
};

export function toBusinessFormValues(business: BusinessApiResponse): BusinessFormValues {
  return {
    name: business.name,
    industry: business.industry ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    address: business.address ?? "",
    timezone: business.timezone,
  };
}

export function toBusinessUpdateRequest(values: BusinessFormValues): BusinessUpdateRequest {
  return {
    name: values.name.trim(),
    industry: values.industry.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    timezone: values.timezone,
  };
}
