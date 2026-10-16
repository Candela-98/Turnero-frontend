import type { ReactNode } from "react";
import { ServicesWorkspace } from "@/components/services/services-workspace";

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return <ServicesWorkspace>{children}</ServicesWorkspace>;
}
