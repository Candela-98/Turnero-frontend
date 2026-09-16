import { ProtectedAdmin } from "@/components/auth";
import { AdminAppShell } from "@/components/layouts";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedAdmin>
      <AdminAppShell>{children}</AdminAppShell>
    </ProtectedAdmin>
  );
}

