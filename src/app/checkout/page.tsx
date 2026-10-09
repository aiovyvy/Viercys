import { connection } from "next/server";
import Checkout from "@/components/journey-checkout";
import { searchFrom } from "@/lib/policy";
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  return (
    <Checkout
      search={searchFrom(params)}
      roomIds={(params.roomIds || "").split(",").filter(Boolean)}
    />
  );
}
