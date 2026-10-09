import { connection } from "next/server";
import Home from "./experience";
export default async function Page() {
  await connection();
  return <Home />;
}
