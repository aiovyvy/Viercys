import { connection } from "next/server";
import Results from "@/components/journey-results";
import { searchFrom, validateSearch } from "@/lib/policy";
export default async function Availability({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const search = searchFrom(params);
  const error =
    params.property && params.property !== "santorini"
      ? "Only Santorini has bookable demo inventory."
      : validateSearch(search);
  return (
    <Results
      search={search}
      initialError={error}
      initialCategory={
        typeof params.category === "string" ? params.category : ""
      }
    />
  );
}
