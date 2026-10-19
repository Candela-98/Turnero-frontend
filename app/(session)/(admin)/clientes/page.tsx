import { Suspense } from "react";
import { CustomersLoading, CustomersPage } from "@/components/customers/customers-page";

export default function Customers() {
  return <Suspense fallback={<div className="px-5 md:px-0"><CustomersLoading /></div>}><CustomersPage /></Suspense>;
}

