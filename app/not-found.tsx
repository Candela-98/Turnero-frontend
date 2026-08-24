import Link from "next/link";

import { buttonVariants, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-12 text-on-surface">
      <EmptyState
        action={
          <Link className={buttonVariants()} href="/">
            Volver a la agenda
          </Link>
        }
        description="La pagina que estas buscando no existe o cambio de lugar."
        title="No encontramos esta pagina"
      />
    </main>
  );
}
