import { Journey } from "@/components/journey-itinerary";
export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return <Journey reference={(await params).reference} />;
}
