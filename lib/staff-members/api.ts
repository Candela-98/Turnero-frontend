import { apiFetch } from "@/lib/api/client";

export type StaffMemberDto = {
  id: number;
  business_id: number;
  user_id: number | null;
  name: string;
  role_label: string | null;
  specialty: string | null;
  avatar_url: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export type StaffMember = {
  id: number;
  userId: number | null;
  name: string;
  roleLabel: string | null;
  specialty: string | null;
  avatarUrl: string | null;
  status: StaffMemberDto["status"];
};

export type StaffFilters = {
  q: string;
  status: "ALL" | StaffMember["status"];
  page: number;
  size: number;
};

type StaffPageDto = {
  data: StaffMemberDto[];
  page: { number: number; size: number; total_elements: number; total_pages: number };
};

export function toStaffMember(dto: StaffMemberDto): StaffMember {
  return { id: dto.id, userId: dto.user_id, name: dto.name, roleLabel: dto.role_label?.trim() || null,
    specialty: dto.specialty?.trim() || null, avatarUrl: dto.avatar_url?.trim() || null, status: dto.status };
}

export function staffMemberParams(filters: StaffFilters) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: "name,asc" });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.status !== "ALL") params.set("status", filters.status);
  return params.toString();
}

export async function getStaffMembers(filters: StaffFilters, signal?: AbortSignal) {
  const result = await apiFetch<StaffPageDto>(`/api/v1/staff-members?${staffMemberParams(filters)}`, { signal });
  return { data: result.data.map(toStaffMember), page: result.page };
}

export type StaffMemberWriteRequest = { name: string; role_label: string; specialty: string; user_id?: number };
export async function getStaffMember(id: number, signal?: AbortSignal) {
  return toStaffMember(await apiFetch<StaffMemberDto>(`/api/v1/staff-members/${id}`, { signal }));
}
export async function createStaffMember(body: StaffMemberWriteRequest) {
  return toStaffMember(await apiFetch<StaffMemberDto>("/api/v1/staff-members", { method: "POST", body }));
}
export async function updateStaffMember(id: number, body: Partial<Omit<StaffMemberWriteRequest, "user_id">>) {
  return toStaffMember(await apiFetch<StaffMemberDto>(`/api/v1/staff-members/${id}`, { method: "PATCH", body }));
}

export async function getMyStaffMember(signal?: AbortSignal): Promise<StaffMember | null> {
  const result = await apiFetch<{ staff_member: StaffMemberDto | null }>("/api/v1/staff-members/me", { signal });
  return result.staff_member ? toStaffMember(result.staff_member) : null;
}
