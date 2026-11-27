"use client";

import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { CalendarDays, Clock3, UserRound, UsersRound } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { CustomerAccount } from "@/components/auth/customer-account";
import { BookingPublicShell } from "@/components/layouts/booking-public-shell";
import { Button, EmptyState, InlineAlert, Input, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { businessDate, readableDate, shiftDay, validDate } from "@/lib/appointments/dates";
import {
  bookingSlotTime,
  bookingWriteFailure,
  createBooking,
  getBookingAvailability,
  getBookingProfile,
  getBookingServices,
  isBookingUnavailable,
  type BookingContact,
} from "@/lib/public-booking/api";

const priceFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const choiceClass = "flex min-h-touch cursor-pointer items-center gap-3 rounded-xl border border-outline bg-surface-container-lowest px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary-fixed/30 has-[:focus-visible]:outline-focus-ring";
const radioClass = "size-4 shrink-0 accent-primary";
const emptyContact: BookingContact = { name: "", email: "", phone: "" };
const contactFields = [
  { key: "name", label: "Nombre", type: "text", autoComplete: "name", maxLength: 120, pattern: ".*\\S.*" },
  { key: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 150 },
  { key: "phone", label: "Teléfono", type: "tel", autoComplete: "tel", maxLength: 50, pattern: ".*[0-9].*" },
] as const;
const writeMessages = {
  ambiguous: {
    title: "El negocio debe revisar tu ficha",
    description: "Contactá al negocio para verificar tus datos antes de volver a solicitar el turno.",
  },
  blocked: {
    title: "No podés reservar online con estos datos",
    description: "Contactá al negocio para coordinar el turno.",
  },
  unknown: {
    title: "No pudimos verificar el resultado de la solicitud",
    description: "Si el problema persiste, consultá con el negocio antes de volver a solicitar el turno.",
  },
};

function BookingLoading({ label }: { label: string }) {
  return (
    <div className="space-y-3" role="status">
      <p className="text-sm text-on-surface-variant">{label}</p>
      <Skeleton aria-hidden="true" className="h-12 w-full" />
    </div>
  );
}

function BookingReadError({ title, retry }: { title: string; retry: () => void }) {
  return (
    <InlineAlert title={title} tone="error">
      <Button className="mt-2" variant="outline" onClick={retry}>Reintentar</Button>
    </InlineAlert>
  );
}

function BookingUnavailable() {
  return (
    <EmptyState
      icon={<CalendarDays aria-hidden="true" />}
      title="Las reservas online no están disponibles"
      description="Consultá con el negocio para coordinar un turno."
    />
  );
}

function BookingSlots({ slots, date, selectedStart, onSelect }: {
  slots: UseQueryResult<Awaited<ReturnType<typeof getBookingAvailability>>>;
  date: string;
  selectedStart: string | undefined;
  onSelect: (startsAt: string) => void;
}) {
  if (isBookingUnavailable(slots.error)) return <BookingUnavailable />;
  if (slots.isPending || slots.isFetching) return <BookingLoading label="Cargando horarios…" />;
  if (slots.isError) {
    return <BookingReadError title="No pudimos cargar los horarios" retry={() => void slots.refetch()} />;
  }
  if (!slots.data?.length) {
    return <EmptyState title="No hay horarios disponibles" description="Probá con otra fecha o profesional." />;
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold">Horarios disponibles</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.data.map((slot) => (
          <label key={slot.startsAt} className={`${choiceClass} justify-center text-sm font-medium`}>
            <input
              checked={selectedStart === slot.startsAt}
              className="sr-only"
              name="booking-slot"
              onChange={() => onSelect(slot.startsAt)}
              type="radio"
              value={slot.startsAt}
            />
            {bookingSlotTime(slot.startsAt)}
          </label>
        ))}
      </div>
      {selectedStart && (
        <InlineAlert className="mt-4" title="Horario elegido">
          {readableDate(date)} · {bookingSlotTime(selectedStart)}
        </InlineAlert>
      )}
    </fieldset>
  );
}

type BookingService = Awaited<ReturnType<typeof getBookingServices>>[number];
type BookingResult = Awaited<ReturnType<typeof createBooking>>;

function BookingConfirmation({ booking, services }: { booking: BookingResult; services: BookingService[] }) {
  const service = services.find((item) => item.id === booking.serviceId);
  const professional = service?.staff.find((member) => member.id === booking.staffId);
  const confirmed = booking.status === "CONFIRMED";

  return (
    <section className="space-y-4" aria-labelledby="booking-result">
      <InlineAlert tone={confirmed ? "positive" : "pending"}>
        <h2 id="booking-result" className="text-xl font-bold" tabIndex={-1} ref={(heading) => { heading?.focus(); }}>
          {confirmed ? "Turno confirmado" : "Turno pendiente de confirmación"}
        </h2>
        {!confirmed && <p>El negocio todavía tiene que confirmar tu turno.</p>}
      </InlineAlert>
      <dl className="space-y-3 rounded-xl border border-outline bg-surface-container-lowest p-4">
        <div><dt className="text-sm text-on-surface-variant">Servicio</dt><dd>{service?.name ?? `Servicio #${booking.serviceId}`}</dd></div>
        <div><dt className="text-sm text-on-surface-variant">Profesional</dt><dd>{professional?.name ?? `Profesional asignado #${booking.staffId}`}</dd></div>
        <div>
          <dt className="text-sm text-on-surface-variant">Día y horario</dt>
          <dd>{readableDate(booking.startsAt.slice(0, 10))} · {bookingSlotTime(booking.startsAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

function BookingSelection({
  slug, services, timezone, windowDays,
}: {
  slug: string;
  services: BookingService[];
  timezone: string;
  windowDays: number;
}) {
  const [serviceId, setServiceId] = useState<number>();
  const [staffId, setStaffId] = useState<number | "any">("any");
  const [chosenDate, setChosenDate] = useState("");
  const [slotChoice, setSlotChoice] = useState<{ key: string; startsAt: string }>();
  const [contact, setContact] = useState(emptyContact);
  const [issue, setIssue] = useState<ReturnType<typeof bookingWriteFailure>>();
  const [booking, setBooking] = useState<BookingResult>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const schedule = useRef<HTMLElement>(null);
  const service = services.find((item) => item.id === serviceId);
  const staff = service?.staff.some((member) => member.id === staffId) ? staffId : "any";
  const today = businessDate(timezone);
  const lastDate = shiftDay(today, windowDays - 1);
  const date = chosenDate >= today && chosenDate <= lastDate ? chosenDate : today;
  const selection = service && { date, serviceId: service.id, staffId: staff };
  const slotKey = JSON.stringify(selection);
  const slots = useQuery({
    queryKey: ["public-booking", slug, "availability", selection],
    queryFn: selection ? ({ signal }) => getBookingAvailability(slug, selection, signal) : skipToken,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const selectedSlot = slotChoice?.key === slotKey && slots.isSuccess
    ? slots.data.find((slot) => slot.startsAt === slotChoice.startsAt)
    : undefined;
  const showContact = selectedSlot || issue || Object.values(contact).some(Boolean);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || !selectedSlot || slots.isFetching || submitting.current || booking) return;

    submitting.current = true;
    setIsSubmitting(true);
    setIssue(undefined);
    try {
      setBooking(await createBooking(slug, { ...selection, startsAt: selectedSlot.startsAt, contact }));
      setContact(emptyContact);
    } catch (error) {
      const failure = bookingWriteFailure(error);
      setIssue(failure);
      if (failure === "slot") {
        setSlotChoice(undefined);
        void slots.refetch();
        schedule.current?.focus();
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (booking) return <BookingConfirmation booking={booking} services={services} />;
  if (issue === "unavailable") return <BookingUnavailable />;
  const contactMessage = issue && issue !== "slot" ? writeMessages[issue] : undefined;

  return (
    <fieldset className="min-w-0 space-y-6" disabled={isSubmitting}>
      <fieldset className="min-w-0">
        <legend className="mb-3 text-lg font-bold tracking-tight">Elegí el servicio</legend>
        <div className="grid gap-2">
          {services.map((item) => (
            <label key={item.id} className={`${choiceClass} min-h-16`}>
              <input
                checked={serviceId === item.id}
                className={radioClass}
                name="booking-service"
                onChange={() => { setServiceId(item.id); setStaffId("any"); setSlotChoice(undefined); }}
                type="radio"
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold">{item.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-sm text-on-surface-variant">
                  <Clock3 aria-hidden="true" className="size-3.5" /> {item.durationMinutes} min
                </span>
              </span>
              <span className="shrink-0 font-semibold text-primary">{priceFormatter.format(item.priceCents / 100)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {service && (
        <>
          <fieldset className="min-w-0">
            <legend className="mb-3 text-lg font-bold tracking-tight">Elegí el profesional</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`${choiceClass} min-w-0`}>
                <input checked={staff === "any"} className="sr-only" name="booking-staff" onChange={() => { setStaffId("any"); setSlotChoice(undefined); }} type="radio" />
                <UsersRound aria-hidden="true" className="size-5 shrink-0 text-primary" />
                <span className="text-sm font-semibold">Cualquiera disponible</span>
              </label>
              {service.staff.map((member) => (
                <label key={member.id} className={`${choiceClass} min-w-0`}>
                  <input checked={staff === member.id} className="sr-only" name="booking-staff" onChange={() => { setStaffId(member.id); setSlotChoice(undefined); }} type="radio" />
                  <UserRound aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0 break-words text-sm font-semibold">
                    <span>{member.name}</span>
                    {member.roleLabel && <span className="block font-normal text-on-surface-variant">{member.roleLabel}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <section aria-labelledby="booking-schedule-heading" className="scroll-mt-24 space-y-3" ref={schedule} tabIndex={-1}>
            <h2 id="booking-schedule-heading" className="text-lg font-bold tracking-tight">Día y horario</h2>
            {issue === "slot" && (
              <InlineAlert title="Ese horario ya está ocupado" tone="error">
                Elegí otro horario para seguir. Tus datos siguen cargados.
              </InlineAlert>
            )}
            <label className="block text-sm font-semibold">
              Fecha
              <input
                className="mt-1 block min-h-touch w-full min-w-0 rounded-md border border-outline bg-surface-container-lowest px-3 text-on-surface focus-visible:outline-focus-ring"
                max={lastDate}
                min={today}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (validDate(value) && value >= today && value <= lastDate) {
                    setChosenDate(value);
                    setSlotChoice(undefined);
                  }
                }}
                type="date"
                value={date}
              />
            </label>
            <BookingSlots
              slots={slots}
              date={date}
              selectedStart={selectedSlot?.startsAt}
              onSelect={(startsAt) => {
                setSlotChoice({ key: slotKey, startsAt });
                if (issue === "slot") setIssue(undefined);
              }}
            />
          </section>
        </>
      )}
      {showContact && (
        <form aria-labelledby="booking-contact-heading" aria-busy={isSubmitting} className="space-y-4" onSubmit={submit}>
          <h2 id="booking-contact-heading" className="text-lg font-bold tracking-tight">Datos de contacto</h2>
          {contactFields.map(({ key, label, ...attributes }) => (
            <label className="block space-y-1 text-sm font-semibold" key={key}>
              <span>{label}</span>
              <Input {...attributes} name={key} required value={contact[key]} onChange={(event) => {
                setContact({ ...contact, [key]: event.currentTarget.value });
              }} />
            </label>
          ))}
          {contactMessage && <InlineAlert title={contactMessage.title} tone="error">{contactMessage.description}</InlineAlert>}
          <Button className="w-full" disabled={!selectedSlot || slots.isFetching || isSubmitting} type="submit">
            {isSubmitting ? "Solicitando turno…" : "Solicitar turno"}
          </Button>
        </form>
      )}
    </fieldset>
  );
}

function BookingCatalog({ slug, timezone, windowDays }: { slug: string; timezone: string; windowDays: number }) {
  const services = useQuery({
    queryKey: ["public-booking", slug, "services"],
    queryFn: ({ signal }) => getBookingServices(slug, signal),
    refetchOnWindowFocus: false,
  });

  if (services.isPending) return <BookingLoading label="Cargando servicios…" />;
  if (isBookingUnavailable(services.error)) return <BookingUnavailable />;
  if (services.isError) return <BookingReadError title="No pudimos cargar los servicios" retry={() => void services.refetch()} />;
  if (!services.data.length) return <EmptyState title="No hay servicios para reservar online" />;

  return <BookingSelection slug={slug} services={services.data} timezone={timezone} windowDays={windowDays} />;
}

export function PublicBookingPage({ slug }: { slug: string }) {
  const profile = useQuery({
    queryKey: ["public-booking", slug, "profile"],
    queryFn: ({ signal }) => getBookingProfile(slug, signal),
    refetchOnWindowFocus: false,
  });

  return (
    <BookingPublicShell businessName={profile.data?.business.name} className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Reservar un turno</h1>
      </header>
      <CustomerAccount key={slug} slug={slug} />
      {profile.isPending ? (
        <BookingLoading label="Cargando negocio…" />
      ) : isBookingUnavailable(profile.error) || profile.data?.enabled === false ? (
        <BookingUnavailable />
      ) : profile.error instanceof ApiError && profile.error.status === 404 ? (
        <EmptyState title="No encontramos este negocio" description="Revisá el enlace de reserva." />
      ) : profile.isError ? (
        <BookingReadError title="No pudimos cargar el negocio" retry={() => void profile.refetch()} />
      ) : profile.data.windowDays <= 0 ? (
        <BookingUnavailable />
      ) : (
        <BookingCatalog slug={slug} timezone={profile.data.business.timezone} windowDays={profile.data.windowDays} />
      )}
    </BookingPublicShell>
  );
}
