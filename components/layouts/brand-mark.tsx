import { cn } from "@/lib/utils";

export type BrandMarkProps = {
  className?: string;
  logoClassName?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  variant?: "default" | "login";
};

export function BrandMark({
  className,
  logoClassName,
  showSubtitle = true,
  subtitle = "Agenda premium",
  variant = "default",
}: BrandMarkProps) {
  if (variant === "login") {
    return (
      <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
        <div
          className={cn(
            "relative flex size-16 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/15 bg-surface-container-lowest text-2xl font-bold text-primary shadow-soft before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent",
            logoClassName,
          )}
        >
          <span className="relative">BS</span>
        </div>
        <div>
          <p className="text-2xl font-extrabold leading-8 text-on-surface">Barber Studio</p>
          {showSubtitle ? (
            <p className="mt-1 text-sm font-medium text-primary/80">{subtitle}</p>
          ) : null}
        </div>
      </div>
    );
  }

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
