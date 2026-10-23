import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { applyBookingSettings, bookingSettingsKeys, getAgendaInterval } from "./queries";
import { toSlotIntervalMinutes, type BookingSettingsApiResponse } from "./types";
const settings = (slot: number): BookingSettingsApiResponse => ({ slot_interval_minutes: slot, public_booking_enabled: true,
 requires_customer_login: false, booking_window_days: 30, min_notice_hours: 0, cancellation_notice_hours: 0,
 manual_confirmation_enabled: true, whatsapp_reminders_enabled: false, created_at: "", updated_at: "" });
afterEach(() => vi.unstubAllGlobals());
it.each([15,30,45,60])("loads the configured %i interval through the BFF with cancellation", async slot => {
 const fetch=vi.fn().mockResolvedValue(Response.json(settings(slot))); vi.stubGlobal("fetch",fetch);
 const controller=new AbortController(); expect(await getAgendaInterval(controller.signal)).toBe(slot);
 expect(fetch.mock.calls[0][0]).toBe("/api/backend/api/v1/booking-settings"); expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
});
it.each([undefined,null,0,-15,10,90,"30",NaN])("rejects invalid interval %s without a silent fallback", value => {
 expect(()=>toSlotIntervalMinutes(value)).toThrow("Intervalo de agenda no válido");
});
it("propagates settings errors instead of rendering a default interval", async () => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({}, {status:403})));
 await expect(getAgendaInterval()).rejects.toMatchObject({status:403});
});
it("publishes saved settings only to the matching business", async () => {
 const client=new QueryClient({defaultOptions:{queries:{gcTime:0}}});
 client.setQueryData(bookingSettingsKeys.agendaInterval(1),30); client.setQueryData(bookingSettingsKeys.agendaInterval(2),60);
 await applyBookingSettings(client,1,settings(15));
 expect(client.getQueryData(bookingSettingsKeys.agendaInterval(1))).toBe(15);
 expect(client.getQueryData(bookingSettingsKeys.agendaInterval(2))).toBe(60); client.clear();
});
it("cancels an older settings read before publishing the confirmed interval", async () => {
 const client=new QueryClient({defaultOptions:{queries:{gcTime:0}}});const key=bookingSettingsKeys.agendaInterval(1);
 let resolve!: (value:number)=>void;let signal!:AbortSignal;
 const pending=client.fetchQuery({queryKey:key,queryFn:context=>{signal=context.signal;return new Promise<number>(done=>{resolve=done;});}}).catch(()=>undefined);
 await applyBookingSettings(client,1,settings(45)); expect(signal.aborted).toBe(true);
 resolve(30); await pending;
 expect(client.getQueryData(key)).toBe(45); client.clear();
});
