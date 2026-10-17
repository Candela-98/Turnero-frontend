import { Badge } from "@/components/ui";
import type { ServiceOffering } from "@/lib/service-offerings/api";

type Props = { service: ServiceOffering; selected: boolean; disabled: boolean; onToggle: () => void };
export function StaffServiceRow({ service, selected, disabled, onToggle }: Props) {
  return <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-3 has-[:disabled]:cursor-not-allowed has-[:checked]:border-primary/40 has-[:checked]:bg-primary-fixed/30">
    <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} aria-label={service.name}
      className="mt-1 size-5 shrink-0 accent-primary focus-visible:outline-focus-ring" />
    <span className="min-w-0 flex-1 break-words">
      <span className="block text-sm font-semibold">{service.name}</span>
      {service.category ? <span className="block text-xs text-on-surface-variant">{service.category}</span> : null}
      <span className="block text-xs text-on-surface-variant">{service.durationMinutes} min</span>
      {service.status === "INACTIVE" ? <Badge tone="neutral">Inactivo</Badge> : null}
    </span>
  </label>;
}
