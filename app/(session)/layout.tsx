import { AuthProvider } from "@/components/auth";

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

