import { QueryProvider } from "@/components/auth/query-provider";
import { PublicBookingPage } from "@/components/public-booking/public-booking-page";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <QueryProvider>
      <PublicBookingPage key={slug} slug={slug} />
    </QueryProvider>
  );
}
