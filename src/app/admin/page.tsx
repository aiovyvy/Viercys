import { cookies } from "next/headers";
import { session, demoEnabled } from "@/lib/db";
import { StaffDashboard, StaffLogin } from "@/components/journey-admin";
export default async function Admin() {
  const auth = session((await cookies()).get("viercys_staff")?.value);
  return auth?.kind === "admin" &&
    (demoEnabled() ||
      (process.env.VIERCYS_ADMIN_PASSWORD?.length || 0) >= 12) ? (
    <StaffDashboard />
  ) : (
    <StaffLogin />
  );
}
