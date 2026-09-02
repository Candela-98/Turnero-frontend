import { cn } from "@/lib/utils";

export type BrandMarkProps = {
  className?: string;
  logoClassName?: string;
  showSubtitle?: boolean;
  subtitle?: string;
};

export function BrandMark({
  className,
  logoClassName,
  showSubtitle = true,
  subtitle = "Agenda premium",
}: BrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary shadow-soft md:size-12 md:text-base",
          logoClassName,
        )}
      >
        BS
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-5 text-primary md:text-xl md:leading-6">Barber Studio</p>
        {showSubtitle ? (
          <p className="truncate text-xs leading-4 text-on-surface-variant">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
