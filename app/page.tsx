import { AgendaPage } from "@/components/agenda";
import { ProtectedAdmin } from "@/components/auth";

export default function Home() {
  return (
    <ProtectedAdmin>
      <AgendaPage />
    </ProtectedAdmin>
  );
}
