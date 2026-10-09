import { Receipt } from "@/components/journey-stay";
export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return <Receipt reference={(await params).reference} />;
}
