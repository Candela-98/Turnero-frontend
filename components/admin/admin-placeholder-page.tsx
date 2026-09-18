import Link from "next/link";
import { CalendarDays } from "lucide-react";

type AdminPlaceholderPageProps = {
  description: string;
  title: string;
  showNewAppointment?: boolean;
};

export function AdminPlaceholderPage({
  description,
  showNewAppointment = false,
  title,
}: AdminPlaceholderPageProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center py-10 text-center">
      <div className="rounded-xl bg-surface-container-lowest p-8 shadow-panel sm:p-10">
        <p className="text-sm font-semibold text-primary">Administración</p>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-base leading-7 text-on-surface-variant">{description}</p>
        <p className="mt-6 text-sm text-on-surface-variant">Esta sección estará disponible próximamente.</p>
        {showNewAppointment ? (
          <Link
            className="mt-7 inline-flex min-h-touch items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-soft transition-colors hover:bg-on-primary-fixed-variant focus-visible:outline-focus-ring"
            href="/agenda?new=1"
          >
            <CalendarDays className="size-4" />
            Nuevo turno
          </Link>
        ) : null}
      </div>
    </section>
  );
}
