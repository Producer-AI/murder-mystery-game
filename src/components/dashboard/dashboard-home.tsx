"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Plus, QrCode, ScrollText, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  DisplayTitle,
  MysteryPage,
  MysteryPanel,
  SectionEyebrow,
  StatTile,
  StatusPill,
} from "@/components/game/mystery-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { api } from "../../../convex/_generated/api";

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unable to complete the request.";
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "data" in error &&
          error.data &&
          typeof error.data === "object" &&
          "message" in error.data &&
          typeof error.data.message === "string"
        ? error.data.message
        : null;

  return message ?? "Unable to complete the request.";
}

const updatedFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DashboardHome({
  userDisplayName,
}: {
  userDisplayName: string;
}) {
  const router = useRouter();
  const createGame = useMutation(api.games.createGame);
  const games = useQuery(api.games.listOwnedGames, {});
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [title, setTitle] = useState("");

  const totalPlayers =
    games?.reduce((sum, game) => sum + game.playerCount, 0) ?? 0;

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const result = await createGame({
        description,
        joinPassword: joinPassword || undefined,
        title,
      });

      startTransition(() => {
        router.push(`/dashboard/games/${result.gameId}`);
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <MysteryPage className="px-4 py-6 sm:px-6 lg:px-10" tone="dark">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <MysteryPanel className="p-6 sm:p-8" tone="dark">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <SectionEyebrow>Creator Dashboard</SectionEyebrow>
              <DisplayTitle className="max-w-3xl text-[2.6rem] sm:text-6xl">
                Build the case, lock the clues, and run the room live.
              </DisplayTitle>
              <p className="max-w-2xl text-sm leading-7 text-current/70 sm:text-base">
                Auth is already in place. This dashboard now becomes the control
                room for question pacing, guest invites, and the private answer
                key that stays hidden until you reveal the finale.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <StatusPill>{userDisplayName}</StatusPill>
              <SignOutButton />
            </div>
          </div>
        </MysteryPanel>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Created Games"
            tone="dark"
            value={games === undefined ? "..." : games.length}
          />
          <StatTile label="Total Players" tone="dark" value={totalPlayers} />
          <StatTile
            label="Live Rooms"
            tone="dark"
            value={
              games?.filter((game) => game.status === "question_live").length ??
              0
            }
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <MysteryPanel className="p-6 sm:p-8" tone="cream">
            <div className="space-y-6 text-[var(--mystery-ink)]">
              <div className="space-y-3">
                <SectionEyebrow className="text-[var(--mystery-crimson)]">
                  New Game
                </SectionEyebrow>
                <h2 className="font-display text-4xl leading-none">
                  Open a fresh dossier.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-[var(--mystery-ink)]/70">
                  Set the title, leave private notes in the description, and
                  optionally gate entry with a password before you start
                  unlocking questions.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="game-title"
                  >
                    Title
                  </Label>
                  <Input
                    id="game-title"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] placeholder:text-[var(--mystery-ink)]/45 focus:border-[var(--mystery-crimson)]/70 focus:bg-[rgba(139,32,32,0.06)]"
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="The Blackwood Manor Affair"
                    required
                    value={title}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="game-description"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="game-description"
                    className="min-h-36 border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] placeholder:text-[var(--mystery-ink)]/45 focus:border-[var(--mystery-crimson)]/70 focus:bg-[rgba(139,32,32,0.06)]"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Who’s invited, what tone you want, or anything the host should remember."
                    value={description}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="game-password"
                  >
                    Join Password
                  </Label>
                  <Input
                    id="game-password"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] placeholder:text-[var(--mystery-ink)]/45 focus:border-[var(--mystery-crimson)]/70 focus:bg-[rgba(139,32,32,0.06)]"
                    onChange={(event) => setJoinPassword(event.target.value)}
                    placeholder="Optional"
                    type="password"
                    value={joinPassword}
                  />
                </div>

                {errorMessage ? (
                  <p className="border border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.08)] px-4 py-3 text-sm leading-6 text-[var(--mystery-crimson)]">
                    {errorMessage}
                  </p>
                ) : null}

                <Button
                  className="h-12 w-full rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] px-4 tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "Creating..." : "Create Game"}
                  <Plus className="size-4" />
                </Button>
              </form>
            </div>
          </MysteryPanel>

          <MysteryPanel className="p-6 sm:p-8" tone="dark">
            <div className="space-y-6">
              <div className="space-y-3">
                <SectionEyebrow>How It Runs</SectionEyebrow>
                <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                  The MVP playbook.
                </h2>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    icon: ScrollText,
                    text: "Author draft questions with a primary answer, accepted variants, and point value.",
                  },
                  {
                    icon: QrCode,
                    text: "Share a direct join link or QR code. Guests enter only a username and optional room password.",
                  },
                  {
                    icon: Users,
                    text: "Unlock one question at a time, lock it, score privately, and reveal the leaderboard only in the finale.",
                  },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex gap-4 border border-white/8 bg-white/4 p-4"
                  >
                    <Icon className="mt-1 size-4 shrink-0 text-[var(--mystery-gold)]" />
                    <p className="text-sm leading-7 text-current/72">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </MysteryPanel>
        </section>

        <MysteryPanel className="p-6 sm:p-8" tone="dark">
          <div className="flex flex-col gap-3 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <SectionEyebrow>Owned Games</SectionEyebrow>
              <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                Your live and draft rooms.
              </h2>
            </div>
            <StatusPill tone="muted">
              {games === undefined ? "Loading" : `${games.length} total`}
            </StatusPill>
          </div>

          <div className="mt-6 grid gap-4">
            {games === undefined ? (
              <p className="text-sm leading-7 text-current/66">
                Pulling your cases from Convex...
              </p>
            ) : games.length === 0 ? (
              <p className="text-sm leading-7 text-current/66">
                No games yet. Create the first one and you’ll drop straight into
                the admin control room.
              </p>
            ) : (
              games.map((game) => (
                <Link
                  key={game.id}
                  className="group block border border-white/8 bg-white/4 p-5 transition-colors hover:bg-white/7"
                  href={`/dashboard/games/${game.id}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="gold">
                          {game.status.replace("_", " ")}
                        </StatusPill>
                        {game.requiresPassword ? (
                          <StatusPill tone="muted">password</StatusPill>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display text-3xl leading-none text-[var(--mystery-gold)]">
                          {game.title}
                        </h3>
                        <p className="max-w-2xl text-sm leading-7 text-current/66">
                          {game.description || "No description yet."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--mystery-gold)]">
                      Open
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                        Join Code
                      </p>
                      <p className="mt-2 text-[var(--mystery-gold)]">
                        {game.joinCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                        Players
                      </p>
                      <p className="mt-2 text-[var(--mystery-gold)]">
                        {game.playerCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                        Questions
                      </p>
                      <p className="mt-2 text-[var(--mystery-gold)]">
                        {game.questionCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                        Updated
                      </p>
                      <p className="mt-2 text-[var(--mystery-gold)]">
                        {updatedFormatter.format(new Date(game.updatedAt))}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </MysteryPanel>
      </div>
    </MysteryPage>
  );
}
