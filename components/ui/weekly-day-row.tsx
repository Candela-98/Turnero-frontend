"use client";

import { Input } from "./input";
import { Switch } from "./switch";

function TimeField({
  ariaLabel,
  error,
  hint,
  id,
  label,
  onChange,
  value,
}: {
  ariaLabel: string;
  error?: string;
  hint?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-on-surface-variant" htmlFor={id}>{label}</label>
      <Input
        aria-label={ariaLabel}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required
        type="time"
        value={value}
      />
      {error ? <p className="mt-2 text-sm text-error" id={errorId} role="alert">{error}</p> : null}
      {hint ? <p className="mt-2 text-sm text-on-surface-variant" id={hintId} aria-live="polite">{hint}</p> : null}
    </div>
  );
}

type Props = {
  dayLabel: string; idPrefix: string; active: boolean; start: string; end: string;
  errors?: { start?: string; end?: string };
  hints?: { start?: string; end?: string; day?: string };
  onActiveChange: (active: boolean) => void; onStartChange: (value: string) => void; onEndChange: (value: string) => void;
  labels: { active: string; inactive: string; start: string; end: string; switch: string; startAccessible: string; endAccessible: string };
  startSuffix?: string; endSuffix?: string;
};
export function WeeklyDayRow({ dayLabel, idPrefix, active, start, end, errors, hints, onActiveChange, onStartChange, onEndChange, labels, startSuffix = "starts-at", endSuffix = "ends-at" }: Props) {
  const status = active ? labels.active : labels.inactive;
  return <fieldset aria-describedby={hints?.day ? `${idPrefix}-hint` : undefined} className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
    <legend className="sr-only">{dayLabel}</legend>
    <div className="flex min-h-touch items-center justify-between gap-4">
      <div><p className="font-semibold">{dayLabel}</p><p className="mt-1 text-sm text-on-surface-variant">{status}</p></div>
      <div className="flex items-center gap-3"><span className="text-sm font-medium text-on-surface-variant">{status}</span>
        <Switch aria-label={`${dayLabel}: ${labels.switch}`} checked={active} onCheckedChange={onActiveChange} />
      </div>
    </div>
    {active ? <div className="mt-4 grid gap-4 border-t border-outline-variant pt-4 sm:grid-cols-2">
      <TimeField id={`${idPrefix}-${startSuffix}`} label={labels.start} ariaLabel={`${dayLabel}: ${labels.startAccessible}`} value={start} error={errors?.start} hint={hints?.start} onChange={onStartChange} />
      <TimeField id={`${idPrefix}-${endSuffix}`} label={labels.end} ariaLabel={`${dayLabel}: ${labels.endAccessible}`} value={end} error={errors?.end} hint={hints?.end} onChange={onEndChange} />
    </div> : null}
    {active && hints?.day ? <p id={`${idPrefix}-hint`} className="mt-3 text-sm text-on-surface-variant" aria-live="polite">{hints.day}</p> : null}
  </fieldset>;
}
