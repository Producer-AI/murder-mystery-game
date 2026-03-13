import { redirect } from "next/navigation";

import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";

import { api } from "../../../convex/_generated/api";

export default async function DashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/");
  }

  const user = await fetchAuthQuery(api.auth.getAuthUser);

  return <DashboardHome userDisplayName={user.username ?? user.name} />;
}
