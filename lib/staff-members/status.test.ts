import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { applyStaffRemoval, applyStaffStatus, changeStaffStatus, removeStaffMember, staffStatusError } from "./status";
import { staffMemberKeys } from "./queries";
import type { StaffMember } from "./api";
const member: StaffMember = { id: 5, userId: 1, serviceCount: 3, name: "Ana", roleLabel: null, specialty: null, avatarUrl: null, status: "ACTIVE" };
const filters = { q: "", status: "ALL" as const, page: 0, size: 20 };
afterEach(() => vi.unstubAllGlobals());
it("uses DELETE/204 for deactivation and PATCH only status for reactivation", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null,{status:204})).mockResolvedValueOnce(Response.json({ id:5,name:"Ana",role_label:null,specialty:null,avatar_url:null,user_id:1,status:"ACTIVE" })); vi.stubGlobal("fetch", fetch);
  const inactive = await changeStaffStatus(member);
  expect(inactive.status).toBe("INACTIVE");
  expect(fetch).toHaveBeenNthCalledWith(1,"/api/backend/api/v1/staff-members/5",expect.objectContaining({method:"DELETE"}));
  expect(await changeStaffStatus(inactive)).toMatchObject({status:"ACTIVE",serviceCount:3});
  expect(fetch).toHaveBeenLastCalledWith(expect.any(String),expect.objectContaining({method:"PATCH",body:'{"status":"ACTIVE"}'}));
});
it("keeps a successful state change confirmed when PATCH representation is invalid", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({})); vi.stubGlobal("fetch",fetch);
  expect(await changeStaffStatus({...member,status:"INACTIVE"})).toMatchObject({id:5,status:"ACTIVE"});
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("maps future-appointment conflicts without treating other errors as success", () => {
  expect(staffStatusError(new ApiError("Conflict",409,{code:"STAFF_HAS_FUTURE_APPOINTMENTS"}))).toContain("turnos futuros");
  expect(staffStatusError(new ApiError("Offline",503,{}))).toContain("Intentá nuevamente");
});
it("updates confirmed data and removes filtered rows without affecting other businesses or counters", async () => {
  const client = new QueryClient();
  const all = staffMemberKeys.list(10,filters), active = staffMemberKeys.list(10,{...filters,status:"ACTIVE"}), other = staffMemberKeys.list(20,filters);
  const data = {data:[member],page:{number:0,size:20,total_elements:1,total_pages:1}};
  for (const key of [all,active,other]) client.setQueryData(key,data);
  client.setQueryData(staffMemberKeys.userLink(10,1),member);
  await applyStaffStatus(client,10,{...member,status:"INACTIVE"});
  expect(client.getQueryData(all)).toMatchObject({data:[{status:"INACTIVE",serviceCount:3}]});
  expect(client.getQueryData(active)).toMatchObject({data:[],page:{total_elements:0,total_pages:0}});
  expect(client.getQueryData(other)).toEqual(data);
  expect(client.getQueryData(staffMemberKeys.detail(10,5))).toMatchObject({status:"INACTIVE"});
  expect(client.getQueryData(staffMemberKeys.userLink(10,1))).toMatchObject({status:"INACTIVE"});
  client.clear();
});
it("cancels old reads before applying a confirmed state", async () => {
  const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
  let signal: AbortSignal | undefined;
  const observer = new QueryObserver(client,{queryKey:staffMemberKeys.detail(10,5),queryFn:({signal:pending}) => {signal=pending; return new Promise<StaffMember>(()=>{});}});
  const stop = observer.subscribe(()=>{});
  await applyStaffStatus(client,10,{...member,status:"INACTIVE"});
  expect(signal?.aborted).toBe(true);
  expect(client.getQueryData(staffMemberKeys.detail(10,5))).toMatchObject({status:"INACTIVE"});
  stop(); client.clear();
});

it("uses a separate DELETE/204 for removal",async()=>{
  const fetch=vi.fn().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal("fetch",fetch);
  await removeStaffMember(5);
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/staff-members/5/catalog",expect.objectContaining({method:"DELETE"}));
});
it("clears removed staff and its link without touching other businesses or profiles",async()=>{
  const client=new QueryClient();
  const list=staffMemberKeys.list(10,filters),inactive=staffMemberKeys.list(10,{...filters,status:"INACTIVE"}),other=staffMemberKeys.list(20,filters);
  const data={data:[{...member,status:"INACTIVE"}],page:{number:0,size:20,total_elements:1,total_pages:1}};
  for(const key of [list,inactive,other]) client.setQueryData(key,data);
  client.setQueryData(staffMemberKeys.detail(10,5),member); client.setQueryData(staffMemberKeys.detail(10,6),{...member,id:6});
  client.setQueryData(staffMemberKeys.userLink(10,1),member);
  client.setQueryData(["staff-services",10,5],[]);client.setQueryData(["staff-working-hours",10,5],[]);
  await applyStaffRemoval(client,10,5);
  expect(client.getQueryData(list)).toMatchObject({data:[],page:{total_elements:0,total_pages:0}});
  expect(client.getQueryData(inactive)).toMatchObject({data:[]});expect(client.getQueryData(other)).toEqual(data);
  expect(client.getQueryData(staffMemberKeys.detail(10,5))).toBeUndefined();expect(client.getQueryData(staffMemberKeys.detail(10,6))).toBeDefined();
  expect(client.getQueryData(staffMemberKeys.userLink(10,1))).toBeNull();
  expect(client.getQueryData(["staff-services",10,5])).toBeUndefined();expect(client.getQueryData(["staff-working-hours",10,5])).toBeUndefined();
  client.clear();
});
