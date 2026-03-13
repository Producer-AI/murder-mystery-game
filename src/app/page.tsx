import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Home() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,157,84,0.22),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-10">
        <AuthCard />
      </div>
    </main>
  );
}
