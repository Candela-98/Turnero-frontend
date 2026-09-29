import { AuthProvider } from "@/components/auth";
import { QueryProvider } from "@/components/auth/query-provider";

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider>;
}
