import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { agendaDayHours, applyBusinessHours, businessHoursKeys, getAgendaBusinessWeek, toAgendaWeek } from "./queries";
import { businessWeek, type BusinessHoursListApiResponse } from "./types";
const response: BusinessHoursListApiResponse = {data: businessWeek.map((day,index)=>({id:index+1,day_of_week:day,is_closed:day==="SUNDAY",opens_at:day==="SUNDAY"?null:"09:00",closes_at:day==="SUNDAY"?null:"18:00"}))};
afterEach(()=>vi.unstubAllGlobals());
it("selects the weekday of the selected date independently of browser time",()=>{
 const week=toAgendaWeek(response);
 expect(agendaDayHours(week,"2026-10-20").dayOfWeek).toBe("TUESDAY");
 expect(agendaDayHours(week,"2026-10-25")).toMatchObject({isClosed:true,opensAt:"",closesAt:""});
 expect(()=>agendaDayHours([],"2026-10-20")).toThrow();
});
it("rejects missing days and invalid open hours instead of fabricating a schedule",()=>{
 expect(()=>toAgendaWeek({data:response.data.slice(1)})).toThrow();
 for(const opens_at of ["25:00","09:60","19:00"]) expect(()=>toAgendaWeek({data:response.data.map((day,index)=>index?day:{...day,opens_at})})).toThrow();
});
it("passes cancellation to the real BFF and propagates access errors",async()=>{
 const fetch=vi.fn().mockResolvedValue(Response.json(response));vi.stubGlobal("fetch",fetch);
 const controller=new AbortController();expect(await getAgendaBusinessWeek(controller.signal)).toHaveLength(7);
 expect(fetch.mock.calls[0][0]).toBe("/api/backend/api/v1/business-hours");expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
 fetch.mockResolvedValue(Response.json({}, {status:403}));await expect(getAgendaBusinessWeek()).rejects.toMatchObject({status:403});
});
it("cancels old reads and updates only the saved business cache",async()=>{
 const client=new QueryClient({defaultOptions:{queries:{gcTime:0}}});
 const key=businessHoursKeys.agendaWeek(1);client.setQueryData(businessHoursKeys.agendaWeek(2),"other");
 let resolve!:(value:ReturnType<typeof toAgendaWeek>)=>void;let signal!:AbortSignal;
 const pending=client.fetchQuery({queryKey:key,queryFn:context=>{signal=context.signal;return new Promise<ReturnType<typeof toAgendaWeek>>(done=>{resolve=done;});}}).catch(()=>undefined);
 await applyBusinessHours(client,1,response);expect(signal.aborted).toBe(true);resolve([]);await pending;
 expect(client.getQueryData(key)).toEqual(toAgendaWeek(response));expect(client.getQueryData(businessHoursKeys.agendaWeek(2))).toBe("other");client.clear();
});
