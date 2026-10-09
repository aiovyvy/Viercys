import { EmailPreview } from "@/components/journey-stay";
export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return <EmailPreview reference={(await params).reference} />;
}
