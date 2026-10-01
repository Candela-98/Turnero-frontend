import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <header className="mb-5 px-5 pt-5 md:mb-8 md:px-0 md:pt-0">
      <p className="text-sm font-semibold text-primary">Administración</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:mt-3 sm:text-base sm:leading-7">
        {description}
      </p>
      {children}
    </header>
  );
}
