"use client";

import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock3,
  DoorOpen,
  EyeOff,
  Flag,
  Send,
  Users,
} from "lucide-react";
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
import type { Id } from "../../../convex/_generated/dataModel";

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
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submittingQuestionId, setSubmittingQuestionId] =
    useState<Id<"questions"> | null>(null);
  const [username, setUsername] = useState("");
  const publicState = useQuery(api.games.getPublicGameState, {
    ...(guestToken ? { guestToken } : {}),
    joinCode,
  });
  const activeRoundId = publicState?.activeRound?.id ?? null;

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

  useEffect(() => {
    if (activeRoundId) {
      setAnswerDrafts({});
      return;
    }

    setAnswerDrafts({});
  }, [activeRoundId]);

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

  const handleSubmitAnswer =
    (questionId: Id<"questions">) =>
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!guestToken) {
        return;
      }

      setPageError(null);
      setSubmittingQuestionId(questionId);

      try {
        await submitAnswer({
          answer: answerDrafts[questionId] ?? "",
          guestToken,
          joinCode,
          questionId,
        });
        setAnswerDrafts((current) => ({
          ...current,
          [questionId]: "",
        }));
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        setSubmittingQuestionId(null);
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

  const shouldShowClosedRoom =
    !publicState.player && publicState.game.status === "ended";
  const shouldShowJoin =
    !publicState.player && publicState.game.status !== "ended";
  const shouldShowActiveRound =
    publicState.game.status === "round_live" &&
    publicState.activeRound &&
    Boolean(publicState.player);
  const shouldShowComplete =
    publicState.game.status === "ended" && Boolean(publicState.player);

  if (shouldShowClosedRoom) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <MysteryPanel className="w-full p-6 text-center sm:p-8" tone="dark">
            <SectionEyebrow>Game Closed</SectionEyebrow>
            <DisplayTitle className="mt-3 text-[var(--mystery-gold)]">
              The case has wrapped.
            </DisplayTitle>
            <p className="mt-4 text-sm leading-7 text-current/72">
              This room is no longer accepting players or answers.
            </p>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

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
                    "Claim a username, wait for the host to start a round, and submit your answers before the round closes."}
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

  if (shouldShowActiveRound && publicState.activeRound) {
    const submittedCount = publicState.activeRound.questions.filter(
      (question) => question.hasSubmitted,
    ).length;
    const isRoundFullySubmitted =
      submittedCount === publicState.activeRound.questionCount;

    return (
      <MysteryPage className="px-4 py-6 sm:px-6" tone="dark">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <MysteryPanel className="p-6 sm:p-8" tone="dark">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="gold">
                  Round {publicState.activeRound.number}
                </StatusPill>
                <StatusPill tone="muted">
                  {publicState.activeRound.questionCount} questions
                </StatusPill>
                <StatusPill tone="muted">
                  {publicState.game.playerCount} players
                </StatusPill>
              </div>

              <div className="space-y-3">
                <SectionEyebrow>Round Live</SectionEyebrow>
                <DisplayTitle className="text-[var(--mystery-gold)]">
                  {publicState.activeRound.title}
                </DisplayTitle>
                <p className="text-sm leading-7 text-current/72">
                  {isRoundFullySubmitted
                    ? "All of your answers are locked. Wait for the host to close the round."
                    : "Answer any question below in any order before the host ends the round."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-white/8 bg-white/4 p-4">
                  <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                    You
                  </p>
                  <p className="mt-2 text-[var(--mystery-gold)]">
                    {publicState.player?.name}
                  </p>
                </div>
                <div className="border border-white/8 bg-white/4 p-4">
                  <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                    Submitted
                  </p>
                  <p className="mt-2 text-[var(--mystery-gold)]">
                    {submittedCount}/{publicState.activeRound.questionCount}
                  </p>
                </div>
                <div className="border border-white/8 bg-white/4 p-4">
                  <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                    Visibility
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-[var(--mystery-gold)]">
                    <EyeOff className="size-4" />
                    Standings hidden
                  </p>
                </div>
              </div>
            </div>
          </MysteryPanel>

          {pageError ? (
            <p className="border border-[var(--mystery-crimson)]/30 bg-[rgba(139,32,32,0.14)] px-4 py-3 text-sm leading-6 text-[var(--mystery-cream)]">
              {pageError}
            </p>
          ) : null}

          <div className="grid gap-4">
            {publicState.activeRound.questions.map((question) => (
              <MysteryPanel
                key={question.id}
                className="p-5 sm:p-6"
                tone={question.hasSubmitted ? "dark" : "cream"}
              >
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="gold">
                      Question {question.number}
                    </StatusPill>
                    <StatusPill tone="muted">
                      {question.pointValue} pts
                    </StatusPill>
                    {question.hasSubmitted ? (
                      <StatusPill tone="gold">answer received</StatusPill>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h2
                      className={
                        question.hasSubmitted
                          ? "font-display text-3xl leading-none text-[var(--mystery-gold)]"
                          : "font-display text-3xl leading-none text-[var(--mystery-ink)]"
                      }
                    >
                      {question.prompt}
                    </h2>
                    <p
                      className={
                        question.hasSubmitted
                          ? "text-sm leading-7 text-current/68"
                          : "text-sm leading-7 text-[var(--mystery-ink)]/68"
                      }
                    >
                      {question.hasSubmitted
                        ? "Your answer is locked. The host will score this round after it closes."
                        : "Submit once when you are ready. You will not be told whether it is correct."}
                    </p>
                  </div>

                  {question.hasSubmitted ? (
                    <div className="inline-flex items-center gap-2 text-sm text-current/72">
                      <CheckCircle2 className="size-4 text-[var(--mystery-gold)]" />
                      Answer received for this question.
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={handleSubmitAnswer(question.id)}
                    >
                      <div className="space-y-2">
                        <Label
                          className="text-current/70"
                          htmlFor={`answer-${question.id}`}
                        >
                          Your Answer
                        </Label>
                        <Input
                          id={`answer-${question.id}`}
                          className="h-12 border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                          onChange={(event) =>
                            setAnswerDrafts((current) => ({
                              ...current,
                              [question.id]: event.target.value,
                            }))
                          }
                          placeholder="Type your answer"
                          required
                          value={answerDrafts[question.id] ?? ""}
                        />
                      </div>

                      <Button
                        className="h-12 w-full rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                        disabled={submittingQuestionId === question.id}
                        type="submit"
                      >
                        {submittingQuestionId === question.id
                          ? "Submitting..."
                          : "Lock Answer"}
                        <Send className="size-4" />
                      </Button>
                    </form>
                  )}
                </div>
              </MysteryPanel>
            ))}
          </div>
        </div>
      </MysteryPage>
    );
  }

  if (shouldShowComplete) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <MysteryPanel className="w-full p-6 text-center sm:p-8" tone="dark">
            <div className="space-y-6">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-[var(--mystery-gold)]/20 bg-white/4">
                <Flag className="size-7 text-[var(--mystery-gold)]" />
              </div>
              <div className="space-y-3">
                <SectionEyebrow>Game Complete</SectionEyebrow>
                <DisplayTitle className="text-[var(--mystery-gold)]">
                  Thanks for playing, {publicState.player?.name}.
                </DisplayTitle>
                <p className="text-sm leading-7 text-current/72">
                  The host has closed the case. Standings stay on the admin
                  side, so there is nothing new to reveal here.
                </p>
              </div>
            </div>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  const waitingCopy = publicState.game.latestRoundNumber
    ? `Round ${publicState.game.latestRoundNumber} has closed. The host is preparing the next file.`
    : "The host has not opened the first round yet.";

  return (
    <MysteryPage className="px-4 py-8 sm:px-6" tone="dark">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <MysteryPanel className="w-full p-6 text-center sm:p-8" tone="dark">
          <div className="space-y-6">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-[var(--mystery-gold)]/20 bg-white/4">
              <Clock3 className="size-7 text-[var(--mystery-gold)]" />
            </div>

            <div className="space-y-3">
              <SectionEyebrow>Waiting Room</SectionEyebrow>
              <DisplayTitle className="text-[var(--mystery-gold)]">
                Stay ready, {publicState.player?.name}.
              </DisplayTitle>
              <p className="text-sm leading-7 text-current/72">{waitingCopy}</p>
            </div>

            <div className="grid gap-3 text-left sm:grid-cols-3">
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
                <p className="mt-2 inline-flex items-center gap-2 text-[var(--mystery-gold)]">
                  <Users className="size-4" />
                  {publicState.game.playerCount}
                </p>
              </div>
              <div className="border border-white/8 bg-white/4 p-4">
                <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                  Visibility
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-[var(--mystery-gold)]">
                  <EyeOff className="size-4" />
                  leaderboard hidden
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
