import { redirect } from "next/navigation";

import { AdminGamePage } from "@/components/dashboard/admin-game-page";
import { isAuthenticated } from "@/lib/auth-server";

import type { Id } from "../../../../../convex/_generated/dataModel";

export default async function AdminGameRoute({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/");
  }

  const { gameId } = await params;

  return <AdminGamePage gameId={gameId as Id<"games">} />;
}
