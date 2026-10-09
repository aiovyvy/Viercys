import { Lookup } from "@/components/journey-stay";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <Lookup token={(await searchParams).token} />;
}
