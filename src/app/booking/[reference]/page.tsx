import { Stay } from "@/components/journey-stay";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  return (
    <Stay
      reference={(await params).reference}
      success={(await searchParams).success === "1"}
    />
  );
}
