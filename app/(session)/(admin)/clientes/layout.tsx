import type { ReactNode } from "react";
import { CustomersWorkspace } from "@/components/customers/customers-workspace";

export default function Layout({ children }: { children: ReactNode }) {
  return <CustomersWorkspace>{children}</CustomersWorkspace>;
}
