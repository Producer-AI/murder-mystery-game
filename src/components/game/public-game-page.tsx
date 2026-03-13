"use client";

import { useMutation, useQuery } from "convex/react";
import { Clock3, DoorOpen, Lock, Send, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DisplayTitle,
  MysteryPage,
  MysteryPanel,
  SectionEyebrow,
  StatusPill,
} from "@/components/game/mystery-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearGuestToken,
  loadGuestToken,
  saveGuestToken,
} from "@/lib/guest-session";

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

export function PublicGamePage({ joinCode }: { joinCode: string }) {
  const joinGame = useMutation(api.games.joinGame);
  const resumeGame = useMutation(api.games.resumeGame);
  const submitAnswer = useMutation(api.games.submitAnswer);
  const [answer, setAnswer] = useState("");
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const publicState = useQuery(api.games.getPublicGameState, {
    ...(guestToken ? { guestToken } : {}),
    joinCode,
  });

  useEffect(() => {
    const storedGuestToken = loadGuestToken(joinCode);
    setGuestToken(storedGuestToken);
    setIsHydrated(true);
  }, [joinCode]);

  useEffect(() => {
    if (!isHydrated || !guestToken) {
      return;
    }

    let cancelled = false;

    void resumeGame({ guestToken, joinCode }).then((player) => {
      if (!player && !cancelled) {
        clearGuestToken(joinCode);
        setGuestToken(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [guestToken, isHydrated, joinCode, resumeGame]);

  useEffect(() => {
    if (publicState?.player) {
      setUsername(publicState.player.name);
    }
  }, [publicState?.player]);

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError(null);
    setIsJoining(true);

    try {
      const result = await joinGame({
        joinCode,
        name: username,
        ...(password ? { password } : {}),
      });
      saveGuestToken(joinCode, result.guestToken);
      setGuestToken(result.guestToken);
      setPassword("");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmitAnswer = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!guestToken) {
      return;
    }

    setPageError(null);
    setIsSubmitting(true);

    try {
      await submitAnswer({
        answer,
        guestToken,
        joinCode,
      });
      setAnswer("");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated || publicState === undefined) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <MysteryPanel className="w-full p-8 text-center" tone="dark">
            <SectionEyebrow>Loading Room</SectionEyebrow>
            <DisplayTitle className="mt-3">
              Checking the guest ledger.
            </DisplayTitle>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  if (publicState === null) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="crimson">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <MysteryPanel className="w-full p-8 text-center" tone="crimson">
            <SectionEyebrow>Not Found</SectionEyebrow>
            <DisplayTitle className="mt-3">
              This invite no longer exists.
            </DisplayTitle>
            <p className="mt-4 text-sm leading-7 text-current/80">
              Ask the host for a fresh link or join code.
            </p>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  const shouldShowJoin = !publicState.player;
  const shouldShowQuestion =
    publicState.game.status === "question_live" &&
    publicState.activeQuestion &&
    !publicState.hasSubmittedCurrentQuestion &&
    Boolean(publicState.player);
  const shouldShowFinale =
    publicState.game.status === "finale" && publicState.publicLeaderboard;

  if (shouldShowJoin) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="cream">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <MysteryPanel className="w-full p-6 sm:p-8" tone="cream">
            <div className="space-y-6 text-[var(--mystery-ink)]">
              <div className="space-y-3">
                <SectionEyebrow className="text-[var(--mystery-crimson)]">
                  Guest Entry
                </SectionEyebrow>
                <DisplayTitle>{publicState.game.title}</DisplayTitle>
                <p className="text-sm leading-7 text-[var(--mystery-ink)]/72">
                  {publicState.game.description ||
                    "Enter the room, claim a username, and wait for the first clue to unlock."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="muted">
                  {publicState.game.joinCode}
                </StatusPill>
                {publicState.game.requiresPassword ? (
                  <StatusPill tone="red">password protected</StatusPill>
                ) : null}
              </div>

              <form className="space-y-5" onSubmit={handleJoin}>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="guest-username"
                  >
                    Username
                  </Label>
                  <Input
                    id="guest-username"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Detective name"
                    required
                    value={username}
                  />
                </div>

                {publicState.game.requiresPassword ? (
                  <div className="space-y-2">
                    <Label
                      className="text-[var(--mystery-crimson)]/70"
                      htmlFor="guest-password"
                    >
                      Password
                    </Label>
                    <Input
                      id="guest-password"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter room password"
                      type="password"
                      value={password}
                    />
                  </div>
                ) : null}

                {pageError ? (
                  <p className="border border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.08)] px-4 py-3 text-sm leading-6 text-[var(--mystery-crimson)]">
                    {pageError}
                  </p>
                ) : null}

                <Button
                  className="h-12 w-full rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                  disabled={isJoining}
                  type="submit"
                >
                  {isJoining ? "Joining..." : "Enter Game"}
                  <DoorOpen className="size-4" />
                </Button>
              </form>
            </div>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  if (shouldShowFinale && publicState.publicLeaderboard) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <MysteryPanel className="p-6 text-center sm:p-8" tone="dark">
            <SectionEyebrow>Finale</SectionEyebrow>
            <DisplayTitle className="mt-3 text-[var(--mystery-gold)]">
              The room has spoken.
            </DisplayTitle>
            <p className="mt-4 text-sm leading-7 text-current/72">
              The admin has revealed the standings. Rankings stayed private
              until now, and this is the first public look at the final order.
            </p>
          </MysteryPanel>

          <MysteryPanel className="p-6 sm:p-8" tone="dark">
            <div className="space-y-4">
              {publicState.publicLeaderboard.map((player) => {
                const isViewer = player.id === publicState.player?.id;

                return (
                  <div
                    key={player.id}
                    className="border border-white/8 bg-white/4 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                          Rank {player.rank}
                        </p>
                        <h2 className="font-display text-3xl leading-none text-[var(--mystery-gold)]">
                          {player.name}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isViewer ? (
                          <StatusPill tone="gold">You</StatusPill>
                        ) : null}
                        <StatusPill tone={player.rank === 1 ? "gold" : "muted"}>
                          {player.totalPoints} pts
                        </StatusPill>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-sm text-current/66">
                      <Trophy className="size-4 text-[var(--mystery-gold)]" />
                      {player.correctCount} correct answers
                    </div>
                  </div>
                );
              })}
            </div>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  if (shouldShowQuestion && publicState.activeQuestion) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <MysteryPanel className="w-full p-6 sm:p-8" tone="dark">
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4">
                <SectionEyebrow>Question Live</SectionEyebrow>
                <StatusPill tone="gold">
                  {publicState.activeQuestion.number}/
                  {publicState.game.questionCount}
                </StatusPill>
              </div>

              <div className="space-y-4 text-center">
                <p className="font-display text-6xl leading-none text-[var(--mystery-gold)]">
                  {String(publicState.activeQuestion.number).padStart(2, "0")}
                </p>
                <DisplayTitle className="text-4xl text-[var(--mystery-gold)] sm:text-5xl">
                  {publicState.activeQuestion.prompt}
                </DisplayTitle>
              </div>

              <form className="space-y-5" onSubmit={handleSubmitAnswer}>
                <div className="space-y-2">
                  <Label htmlFor="player-answer">Your Answer</Label>
                  <Input
                    id="player-answer"
                    className="h-14 border-[var(--mystery-gold)]/20 bg-white/4 text-base text-[var(--mystery-gold)] focus:border-[var(--mystery-gold)]/60"
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Type your answer"
                    required
                    value={answer}
                  />
                </div>

                {pageError ? (
                  <p className="border border-[var(--mystery-crimson)]/30 bg-[rgba(139,32,32,0.14)] px-4 py-3 text-sm leading-6 text-[var(--mystery-cream)]">
                    {pageError}
                  </p>
                ) : null}

                <Button
                  className="h-12 w-full rounded-none border-[var(--mystery-gold)] bg-[var(--mystery-gold)] px-4 text-[var(--mystery-ink)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-gold)_86%,white)]"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Submitting..." : "Lock Answer"}
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  const waitingCopy =
    publicState.game.status === "question_live"
      ? "Your answer is locked. The admin is waiting on the rest of the room."
      : publicState.game.status === "question_locked"
        ? "The clue is closed and scoring is in progress. You still won't see whether you were right."
        : publicState.game.currentQuestionNumber
          ? "That question has been resolved. Stay alert for the next unlock."
          : "The host has not opened the first clue yet.";

  return (
    <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <MysteryPanel className="w-full p-6 text-center sm:p-8" tone="dark">
          <div className="space-y-6">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-[var(--mystery-gold)]/20 bg-white/4">
              {publicState.game.status === "question_locked" ? (
                <Lock className="size-7 text-[var(--mystery-gold)]" />
              ) : (
                <Clock3 className="size-7 text-[var(--mystery-gold)]" />
              )}
            </div>

            <div className="space-y-3">
              <SectionEyebrow>Waiting Room</SectionEyebrow>
              <DisplayTitle className="text-[var(--mystery-gold)]">
                Stay ready, {publicState.player?.name}.
              </DisplayTitle>
              <p className="text-sm leading-7 text-current/72">{waitingCopy}</p>
            </div>

            <div className="grid gap-3 text-left sm:grid-cols-2">
              <div className="border border-white/8 bg-white/4 p-4">
                <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                  Room Status
                </p>
                <p className="mt-2 text-[var(--mystery-gold)]">
                  {publicState.game.status.replace("_", " ")}
                </p>
              </div>
              <div className="border border-white/8 bg-white/4 p-4">
                <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                  Players Joined
                </p>
                <p className="mt-2 text-[var(--mystery-gold)]">
                  {publicState.game.playerCount}
                </p>
              </div>
            </div>

            {pageError ? (
              <p className="border border-[var(--mystery-crimson)]/30 bg-[rgba(139,32,32,0.14)] px-4 py-3 text-sm leading-6 text-[var(--mystery-cream)]">
                {pageError}
              </p>
            ) : null}
          </div>
        </MysteryPanel>
      </div>
    </MysteryPage>
  );
}
