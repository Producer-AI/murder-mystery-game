import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { MysteryPage } from "@/components/game/mystery-shell";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Home() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <MysteryPage className="px-4 py-8 sm:px-6 lg:px-10" tone="dark">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center">
        <AuthCard />
      </div>
    </MysteryPage>
  );
}
