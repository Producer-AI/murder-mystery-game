import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";

import { api } from "../../../convex/_generated/api";

const joinedFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
});

export default async function DashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/");
  }

  const user = await fetchAuthQuery(api.auth.getAuthUser);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,157,84,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-between border border-white/10 bg-card/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8 lg:p-12">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <p className="text-[0.7rem] tracking-[0.45em] text-primary/75 uppercase">
              Dashboard
            </p>
            <div className="space-y-3">
              <h1 className="font-display text-5xl leading-none text-foreground">
                Welcome back,
                <span className="block text-primary">
                  {user.username ?? user.name}
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-foreground/68 sm:text-base">
                Authentication is live. This page is protected by Convex and
                Better Auth, and the current session is already available to
                server-side queries.
              </p>
            </div>
          </div>

          <SignOutButton />
        </header>

        <section className="grid gap-4 py-10 lg:grid-cols-3">
          <article className="border border-white/10 bg-black/15 p-5">
            <p className="text-[0.68rem] tracking-[0.35em] text-foreground/55 uppercase">
              Username
            </p>
            <p className="mt-4 text-2xl text-foreground">
              {user.username ?? "Not set"}
            </p>
          </article>

          <article className="border border-white/10 bg-black/15 p-5">
            <p className="text-[0.68rem] tracking-[0.35em] text-foreground/55 uppercase">
              Email
            </p>
            <p className="mt-4 text-2xl text-foreground">{user.email}</p>
          </article>

          <article className="border border-white/10 bg-black/15 p-5">
            <p className="text-[0.68rem] tracking-[0.35em] text-foreground/55 uppercase">
              Joined
            </p>
            <p className="mt-4 text-2xl text-foreground">
              {joinedFormatter.format(new Date(user.createdAt))}
            </p>
          </article>
        </section>

        <section className="border-t border-white/10 pt-8 text-sm leading-7 text-foreground/62">
          <p>
            The auth foundation is in place for the first release: username or
            email login, account creation, protected routing, and Convex-backed
            user lookups. Profile editing, password recovery, and invitations
            can layer on from here.
          </p>
        </section>
      </div>
    </main>
  );
}
