"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Flag,
  KeyRound,
  Lock,
  PencilLine,
  Play,
  QrCode,
  ScrollText,
  Shield,
  Square,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

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
import type { Id } from "../../../convex/_generated/dataModel";

type QuestionForm = {
  acceptedAnswers: string;
  correctAnswer: string;
  pointValue: string;
  prompt: string;
};

const emptyQuestionForm: QuestionForm = {
  acceptedAnswers: "",
  correctAnswer: "",
  pointValue: "1",
  prompt: "",
};

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

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

function parseAcceptedAnswers(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRoundTone(status: "draft" | "live" | "scored") {
  if (status === "live") {
    return "gold" as const;
  }

  if (status === "scored") {
    return "red" as const;
  }

  return "muted" as const;
}

export function AdminGamePage({ gameId }: { gameId: Id<"games"> }) {
  const gameState = useQuery(api.games.getAdminGame, {
    gameId,
  });
  const createQuestion = useMutation(api.games.createQuestion);
  const createRound = useMutation(api.games.createRound);
  const deleteQuestion = useMutation(api.games.deleteQuestion);
  const deleteRound = useMutation(api.games.deleteRound);
  const endGame = useMutation(api.games.endGame);
  const endRound = useMutation(api.games.endRound);
  const moveQuestion = useMutation(api.games.moveQuestion);
  const moveRound = useMutation(api.games.moveRound);
  const startRound = useMutation(api.games.startRound);
  const updateGame = useMutation(api.games.updateGame);
  const updateQuestion = useMutation(api.games.updateQuestion);
  const updateRound = useMutation(api.games.updateRound);

  const [copiedValue, setCopiedValue] = useState<"code" | "link" | null>(null);
  const [editingQuestionId, setEditingQuestionId] =
    useState<Id<"questions"> | null>(null);
  const [editingRoundId, setEditingRoundId] = useState<Id<"rounds"> | null>(
    null,
  );
  const [origin, setOrigin] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [questionForm, setQuestionForm] =
    useState<QuestionForm>(emptyQuestionForm);
  const [questionPending, setQuestionPending] = useState(false);
  const [questionRoundId, setQuestionRoundId] = useState<Id<"rounds"> | null>(
    null,
  );
  const [roundPending, setRoundPending] = useState(false);
  const [roundTitle, setRoundTitle] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsPending, setSettingsPending] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsTitle, setSettingsTitle] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!gameState || settingsReady) {
      return;
    }

    setSettingsTitle(gameState.game.title);
    setSettingsDescription(gameState.game.description);
    setSettingsReady(true);
  }, [gameState, settingsReady]);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const draftRounds = gameState.rounds.filter(
      (round) => round.status === "draft",
    );
    const draftQuestionIds = new Set(
      draftRounds.flatMap((round) =>
        round.questions.map((question) => question.id),
      ),
    );

    setQuestionRoundId((current) => {
      if (current && draftRounds.some((round) => round.id === current)) {
        return current;
      }

      return draftRounds[0]?.id ?? null;
    });

    if (
      editingRoundId &&
      !draftRounds.some((round) => round.id === editingRoundId)
    ) {
      setEditingRoundId(null);
      setRoundTitle("");
    }

    if (editingQuestionId && !draftQuestionIds.has(editingQuestionId)) {
      setEditingQuestionId(null);
      setQuestionForm(emptyQuestionForm);
    }
  }, [editingQuestionId, editingRoundId, gameState]);

  const shareUrl = origin
    ? `${origin}/games/${gameState?.game.joinCode ?? ""}`
    : "";
  const isBusy = settingsPending || roundPending || questionPending;
  const draftRounds =
    gameState?.rounds.filter((round) => round.status === "draft") ?? [];
  const selectedRound =
    draftRounds.find((round) => round.id === questionRoundId) ?? null;

  const copyToClipboard = async (value: string, copied: "code" | "link") => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(copied);
    window.setTimeout(() => setCopiedValue(null), 1800);
  };

  const resetQuestionEditor = () => {
    setEditingQuestionId(null);
    setQuestionForm(emptyQuestionForm);
  };

  const resetRoundEditor = () => {
    setEditingRoundId(null);
    setRoundTitle("");
  };

  const handleSettingsSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!gameState) {
      return;
    }

    setPageError(null);
    setSettingsPending(true);

    try {
      await updateGame({
        description: settingsDescription,
        gameId: gameState.game.id,
        ...(settingsPassword ? { joinPassword: settingsPassword } : {}),
        title: settingsTitle,
      });
      setSettingsPassword("");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSettingsPending(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!gameState) {
      return;
    }

    setPageError(null);
    setSettingsPending(true);

    try {
      await updateGame({
        description: settingsDescription,
        gameId: gameState.game.id,
        joinPassword: "",
        title: settingsTitle,
      });
      setSettingsPassword("");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSettingsPending(false);
    }
  };

  const handleRoundSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gameState) {
      return;
    }

    setPageError(null);
    setRoundPending(true);

    try {
      if (editingRoundId) {
        await updateRound({
          roundId: editingRoundId,
          title: roundTitle,
        });
      } else {
        const result = await createRound({
          gameId: gameState.game.id,
          title: roundTitle,
        });
        setQuestionRoundId(result.roundId);
      }

      resetRoundEditor();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setRoundPending(false);
    }
  };

  const handleQuestionSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!gameState) {
      return;
    }

    if (!editingQuestionId && !questionRoundId) {
      setPageError("Create a draft round before adding questions.");
      return;
    }

    setPageError(null);
    setQuestionPending(true);

    try {
      const payload = {
        acceptedAnswers: parseAcceptedAnswers(questionForm.acceptedAnswers),
        correctAnswer: questionForm.correctAnswer,
        pointValue: Number(questionForm.pointValue) || 1,
        prompt: questionForm.prompt,
      };

      if (editingQuestionId) {
        await updateQuestion({
          ...payload,
          questionId: editingQuestionId,
        });
      } else if (questionRoundId) {
        await createQuestion({
          ...payload,
          roundId: questionRoundId,
        });
      }

      resetQuestionEditor();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setQuestionPending(false);
    }
  };

  const handleRoundAction = async (
    action: () => Promise<unknown>,
    onSuccess?: () => void,
  ) => {
    setPageError(null);
    setRoundPending(true);

    try {
      await action();
      onSuccess?.();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setRoundPending(false);
    }
  };

  const handleQuestionAction = async (
    action: () => Promise<unknown>,
    onSuccess?: () => void,
  ) => {
    setPageError(null);
    setQuestionPending(true);

    try {
      await action();
      onSuccess?.();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setQuestionPending(false);
    }
  };

  if (gameState === undefined) {
    return (
      <MysteryPage className="px-4 py-8 sm:px-6 lg:px-10" tone="dark">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <MysteryPanel className="max-w-xl p-8 text-center" tone="dark">
            <SectionEyebrow>Loading</SectionEyebrow>
            <DisplayTitle className="mt-3">
              Pulling the control room online.
            </DisplayTitle>
          </MysteryPanel>
        </div>
      </MysteryPage>
    );
  }

  return (
    <MysteryPage className="px-4 py-6 sm:px-6 lg:px-10" tone="dark">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <MysteryPanel className="p-6 sm:p-8" tone="dark">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex items-center gap-2 text-sm text-current/66 transition-colors hover:text-current"
                  href="/dashboard"
                >
                  <ArrowLeft className="size-4" />
                  Back to dashboard
                </Link>
                <StatusPill
                  tone={gameState.game.status === "ended" ? "red" : "gold"}
                >
                  {gameState.game.status.replace("_", " ")}
                </StatusPill>
                {gameState.game.currentRoundNumber ? (
                  <StatusPill tone="muted">
                    Round {gameState.game.currentRoundNumber}
                  </StatusPill>
                ) : null}
              </div>
              <SectionEyebrow>Admin Room</SectionEyebrow>
              <DisplayTitle className="max-w-3xl text-[2.6rem] sm:text-6xl">
                {gameState.game.title}
              </DisplayTitle>
              <p className="max-w-2xl text-sm leading-7 text-current/70 sm:text-base">
                {gameState.game.description || "No host description yet."}
              </p>
            </div>

            {gameState.canEndGame ? (
              <Button
                className="h-12 rounded-none border-[var(--mystery-gold)] bg-[var(--mystery-gold)] px-4 text-[var(--mystery-ink)] tracking-[0.24em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-gold)_86%,white)]"
                disabled={isBusy}
                onClick={() =>
                  handleRoundAction(() =>
                    endGame({ gameId: gameState.game.id }),
                  )
                }
                type="button"
              >
                End Game
                <Trophy className="size-4" />
              </Button>
            ) : null}
          </div>
        </MysteryPanel>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Join Code"
            tone="dark"
            value={gameState.game.joinCode}
          />
          <StatTile
            label="Players"
            tone="dark"
            value={gameState.game.playerCount}
          />
          <StatTile
            label="Rounds"
            tone="dark"
            value={gameState.game.roundCount}
          />
          <StatTile
            label="Live Round"
            tone="dark"
            value={
              gameState.game.currentRoundNumber
                ? `Round ${gameState.game.currentRoundNumber}`
                : gameState.game.status === "ended"
                  ? "Closed"
                  : "Waiting"
            }
          />
        </section>

        {pageError ? (
          <p className="border border-[var(--mystery-crimson)]/30 bg-[rgba(139,32,32,0.14)] px-4 py-3 text-sm leading-6 text-[var(--mystery-cream)]">
            {pageError}
          </p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <MysteryPanel className="p-6 sm:p-8" tone="cream">
            <div className="space-y-6 text-[var(--mystery-ink)]">
              <div className="space-y-3">
                <SectionEyebrow className="text-[var(--mystery-crimson)]">
                  Game Settings
                </SectionEyebrow>
                <h2 className="font-display text-4xl leading-none">
                  Refine the invite.
                </h2>
              </div>

              <form className="space-y-5" onSubmit={handleSettingsSubmit}>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="settings-title"
                  >
                    Title
                  </Label>
                  <Input
                    id="settings-title"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    onChange={(event) => setSettingsTitle(event.target.value)}
                    value={settingsTitle}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="settings-description"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="settings-description"
                    className="min-h-28 border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    onChange={(event) =>
                      setSettingsDescription(event.target.value)
                    }
                    value={settingsDescription}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="settings-password"
                  >
                    Replace Password
                  </Label>
                  <Input
                    id="settings-password"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    onChange={(event) =>
                      setSettingsPassword(event.target.value)
                    }
                    placeholder="Leave blank to keep current password"
                    type="password"
                    value={settingsPassword}
                  />
                  <p className="text-xs leading-6 text-[var(--mystery-ink)]/55">
                    Use the button below to remove the password entirely.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                    disabled={settingsPending}
                    type="submit"
                  >
                    Save Settings
                    <Shield className="size-4" />
                  </Button>
                  <Button
                    className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)]/20 bg-transparent text-[var(--mystery-crimson)] hover:bg-[rgba(139,32,32,0.06)]"
                    disabled={
                      settingsPending || !gameState.game.requiresPassword
                    }
                    onClick={handleRemovePassword}
                    type="button"
                    variant="outline"
                  >
                    Remove Password
                    <KeyRound className="size-4" />
                  </Button>
                </div>
              </form>
            </div>
          </MysteryPanel>

          <MysteryPanel className="p-6 sm:p-8" tone="dark">
            <div className="space-y-6">
              <div className="space-y-3">
                <SectionEyebrow>Invite</SectionEyebrow>
                <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                  Share the room.
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="space-y-4">
                  <div className="border border-white/8 bg-white/4 p-4">
                    <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                      Direct Link
                    </p>
                    <p className="mt-3 break-all text-sm leading-7 text-current/72">
                      {shareUrl || "Waiting for browser origin..."}
                    </p>
                    <Button
                      className="mt-4 h-11 rounded-none border-white/10 bg-white/5 px-4 hover:bg-white/10"
                      disabled={!shareUrl}
                      onClick={() => copyToClipboard(shareUrl, "link")}
                      type="button"
                      variant="outline"
                    >
                      {copiedValue === "link" ? "Copied" : "Copy link"}
                      <Copy className="size-4" />
                    </Button>
                  </div>

                  <div className="border border-white/8 bg-white/4 p-4">
                    <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                      Join Code
                    </p>
                    <p className="mt-3 text-3xl text-[var(--mystery-gold)]">
                      {gameState.game.joinCode}
                    </p>
                    <Button
                      className="mt-4 h-11 rounded-none border-white/10 bg-white/5 px-4 hover:bg-white/10"
                      onClick={() =>
                        copyToClipboard(gameState.game.joinCode, "code")
                      }
                      type="button"
                      variant="outline"
                    >
                      {copiedValue === "code" ? "Copied" : "Copy code"}
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center border border-white/8 bg-white/4 p-4">
                  {shareUrl ? (
                    <QRCodeSVG
                      bgColor="#faf6f1"
                      fgColor="#1a0a0a"
                      includeMargin
                      size={168}
                      value={shareUrl}
                    />
                  ) : (
                    <div className="flex size-40 items-center justify-center border border-dashed border-white/10 text-current/45">
                      <QrCode className="size-7" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </MysteryPanel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <MysteryPanel className="p-6 sm:p-8" tone="cream">
            <div className="space-y-6 text-[var(--mystery-ink)]">
              <div className="space-y-3">
                <SectionEyebrow className="text-[var(--mystery-crimson)]">
                  Round Builder
                </SectionEyebrow>
                <h2 className="font-display text-4xl leading-none">
                  {editingRoundId
                    ? "Edit the round."
                    : "Create the next round."}
                </h2>
                <p className="text-sm leading-7 text-[var(--mystery-ink)]/68">
                  A round can only start once it has at least one question. When
                  you end it, every submitted answer scores immediately and
                  missed questions stay at zero.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleRoundSubmit}>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="round-title"
                  >
                    Round Title
                  </Label>
                  <Input
                    id="round-title"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    onChange={(event) => setRoundTitle(event.target.value)}
                    placeholder="Round 1: Crime Scene"
                    value={roundTitle}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                    disabled={roundPending}
                    type="submit"
                  >
                    {editingRoundId ? "Save Round" : "Add Round"}
                    <Flag className="size-4" />
                  </Button>
                  {editingRoundId ? (
                    <Button
                      className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)]/20 bg-transparent text-[var(--mystery-crimson)] hover:bg-[rgba(139,32,32,0.06)]"
                      disabled={roundPending}
                      onClick={resetRoundEditor}
                      type="button"
                      variant="outline"
                    >
                      Cancel Edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>
          </MysteryPanel>

          <MysteryPanel className="p-6 sm:p-8" tone="cream">
            <div className="space-y-6 text-[var(--mystery-ink)]">
              <div className="space-y-3">
                <SectionEyebrow className="text-[var(--mystery-crimson)]">
                  Question Builder
                </SectionEyebrow>
                <h2 className="font-display text-4xl leading-none">
                  {editingQuestionId
                    ? "Edit the clue."
                    : selectedRound
                      ? `Write into ${selectedRound.title}.`
                      : "Create a draft round first."}
                </h2>
              </div>

              <form className="space-y-5" onSubmit={handleQuestionSubmit}>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="question-round"
                  >
                    Draft Round
                  </Label>
                  <select
                    className="flex h-11 w-full rounded-none border border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] px-3 text-sm text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70 focus:outline-none"
                    disabled={
                      draftRounds.length === 0 || Boolean(editingQuestionId)
                    }
                    id="question-round"
                    onChange={(event) =>
                      setQuestionRoundId(event.target.value as Id<"rounds">)
                    }
                    value={questionRoundId ?? ""}
                  >
                    {draftRounds.length === 0 ? (
                      <option value="">No draft rounds yet</option>
                    ) : (
                      draftRounds.map((round) => (
                        <option key={round.id} value={round.id}>
                          Round {round.order + 1}: {round.title}
                        </option>
                      ))
                    )}
                  </select>
                  {editingQuestionId ? (
                    <p className="text-xs leading-6 text-[var(--mystery-ink)]/55">
                      Move questions by deleting and re-adding them. Editing
                      keeps the current round assignment.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="question-prompt"
                  >
                    Prompt
                  </Label>
                  <Textarea
                    id="question-prompt"
                    className="min-h-28 border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    disabled={draftRounds.length === 0 && !editingQuestionId}
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        prompt: event.target.value,
                      }))
                    }
                    placeholder="What did the victim leave behind in the observatory?"
                    value={questionForm.prompt}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-[1fr_11rem]">
                  <div className="space-y-2">
                    <Label
                      className="text-[var(--mystery-crimson)]/70"
                      htmlFor="question-answer"
                    >
                      Primary Answer
                    </Label>
                    <Input
                      id="question-answer"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      disabled={draftRounds.length === 0 && !editingQuestionId}
                      onChange={(event) =>
                        setQuestionForm((current) => ({
                          ...current,
                          correctAnswer: event.target.value,
                        }))
                      }
                      placeholder="Silver key"
                      value={questionForm.correctAnswer}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      className="text-[var(--mystery-crimson)]/70"
                      htmlFor="question-points"
                    >
                      Points
                    </Label>
                    <Input
                      id="question-points"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      disabled={draftRounds.length === 0 && !editingQuestionId}
                      min="1"
                      onChange={(event) =>
                        setQuestionForm((current) => ({
                          ...current,
                          pointValue: event.target.value,
                        }))
                      }
                      step="1"
                      type="number"
                      value={questionForm.pointValue}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/70"
                    htmlFor="question-accepted"
                  >
                    Accepted Variants
                  </Label>
                  <Input
                    id="question-accepted"
                    className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                    disabled={draftRounds.length === 0 && !editingQuestionId}
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        acceptedAnswers: event.target.value,
                      }))
                    }
                    placeholder="silver key, the silver key, key"
                    value={questionForm.acceptedAnswers}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                    disabled={
                      questionPending || (!selectedRound && !editingQuestionId)
                    }
                    type="submit"
                  >
                    {editingQuestionId ? "Save Question" : "Add Question"}
                    <ScrollText className="size-4" />
                  </Button>
                  {editingQuestionId ? (
                    <Button
                      className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)]/20 bg-transparent text-[var(--mystery-crimson)] hover:bg-[rgba(139,32,32,0.06)]"
                      disabled={questionPending}
                      onClick={resetQuestionEditor}
                      type="button"
                      variant="outline"
                    >
                      Cancel Edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>
          </MysteryPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
          <MysteryPanel className="p-6 sm:p-8" tone="dark">
            <div className="space-y-6">
              <div className="space-y-3">
                <SectionEyebrow>Rounds</SectionEyebrow>
                <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                  Run the case in chapters.
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-current/66">
                  Players can answer every question inside the active round at
                  once. Ending the round closes submissions and scores the whole
                  set immediately.
                </p>
              </div>

              <div className="grid gap-4">
                {gameState.rounds.length === 0 ? (
                  <p className="text-sm leading-7 text-current/66">
                    No rounds yet. Draft the first round above, add at least one
                    question, then start it when the room is ready.
                  </p>
                ) : (
                  gameState.rounds.map((round) => (
                    <article
                      key={round.id}
                      className="border border-white/8 bg-white/4 p-5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone="gold">
                            Round {round.order + 1}
                          </StatusPill>
                          <StatusPill tone={getRoundTone(round.status)}>
                            {round.status}
                          </StatusPill>
                          <StatusPill tone="muted">
                            {round.questionCount} questions
                          </StatusPill>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-display text-3xl leading-none text-[var(--mystery-gold)]">
                            {round.title}
                          </h3>
                          <p className="text-sm leading-7 text-current/66">
                            {round.status === "live" && round.startedAt
                              ? `Live since ${timestampFormatter.format(new Date(round.startedAt))}.`
                              : round.status === "scored" && round.endedAt
                                ? `Scored ${timestampFormatter.format(new Date(round.endedAt))}.`
                                : "Still in draft. Questions remain editable until the round starts."}
                          </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {round.status === "draft" ? (
                            <>
                              <Button
                                className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                disabled={roundPending}
                                onClick={() =>
                                  handleRoundAction(() =>
                                    moveRound({
                                      direction: "up",
                                      roundId: round.id,
                                    }),
                                  )
                                }
                                type="button"
                                variant="outline"
                              >
                                <ArrowUp className="size-4" />
                                Up
                              </Button>
                              <Button
                                className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                disabled={roundPending}
                                onClick={() =>
                                  handleRoundAction(() =>
                                    moveRound({
                                      direction: "down",
                                      roundId: round.id,
                                    }),
                                  )
                                }
                                type="button"
                                variant="outline"
                              >
                                <ArrowDown className="size-4" />
                                Down
                              </Button>
                              <Button
                                className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                disabled={roundPending}
                                onClick={() => {
                                  resetQuestionEditor();
                                  setEditingRoundId(round.id);
                                  setRoundTitle(round.title);
                                }}
                                type="button"
                                variant="outline"
                              >
                                <PencilLine className="size-4" />
                                Edit Round
                              </Button>
                              <Button
                                className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                disabled={roundPending}
                                onClick={() => {
                                  resetQuestionEditor();
                                  setQuestionRoundId(round.id);
                                }}
                                type="button"
                                variant="outline"
                              >
                                <ScrollText className="size-4" />
                                Add Questions
                              </Button>
                              <Button
                                className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                disabled={roundPending}
                                onClick={() =>
                                  handleRoundAction(
                                    () =>
                                      deleteRound({
                                        roundId: round.id,
                                      }),
                                    () => {
                                      if (questionRoundId === round.id) {
                                        setQuestionRoundId(null);
                                      }
                                    },
                                  )
                                }
                                type="button"
                                variant="outline"
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                              <Button
                                className="h-11 rounded-none border-[var(--mystery-gold)] bg-[var(--mystery-gold)] px-3 text-[var(--mystery-ink)] hover:bg-[color:color-mix(in_srgb,var(--mystery-gold)_86%,white)]"
                                disabled={roundPending}
                                onClick={() =>
                                  handleRoundAction(() =>
                                    startRound({
                                      roundId: round.id,
                                    }),
                                  )
                                }
                                type="button"
                              >
                                <Play className="size-4" />
                                Start Round
                              </Button>
                            </>
                          ) : round.status === "live" ? (
                            <Button
                              className="h-11 rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] px-3 hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
                              disabled={roundPending}
                              onClick={() =>
                                handleRoundAction(() =>
                                  endRound({
                                    roundId: round.id,
                                  }),
                                )
                              }
                              type="button"
                            >
                              <Square className="size-4" />
                              End Round
                            </Button>
                          ) : (
                            <div className="text-sm leading-7 text-current/58">
                              This round is scored and read-only.
                            </div>
                          )}
                        </div>

                        <div className="grid gap-3">
                          {round.questions.length === 0 ? (
                            <div className="border border-white/8 bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-current/60">
                              No questions yet.
                            </div>
                          ) : (
                            round.questions.map((question) => (
                              <div
                                key={question.id}
                                className="border border-white/8 bg-[rgba(255,255,255,0.03)] p-4"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <StatusPill tone="gold">
                                        Q{question.order + 1}
                                      </StatusPill>
                                      <StatusPill tone="muted">
                                        {question.pointValue} pts
                                      </StatusPill>
                                      <StatusPill tone="muted">
                                        {question.submissionCount} submissions
                                      </StatusPill>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-display text-2xl leading-none text-[var(--mystery-gold)]">
                                        {question.prompt}
                                      </h4>
                                      <p className="text-sm leading-7 text-current/66">
                                        Answer key: {question.correctAnswer}
                                        {question.acceptedAnswers.length > 0
                                          ? ` | Variants: ${question.acceptedAnswers.join(", ")}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>

                                  {round.status === "draft" ? (
                                    <div className="grid gap-2 sm:grid-cols-2 lg:w-[15rem]">
                                      <Button
                                        className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                        disabled={questionPending}
                                        onClick={() =>
                                          handleQuestionAction(() =>
                                            moveQuestion({
                                              direction: "up",
                                              questionId: question.id,
                                            }),
                                          )
                                        }
                                        type="button"
                                        variant="outline"
                                      >
                                        <ArrowUp className="size-4" />
                                        Up
                                      </Button>
                                      <Button
                                        className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                        disabled={questionPending}
                                        onClick={() =>
                                          handleQuestionAction(() =>
                                            moveQuestion({
                                              direction: "down",
                                              questionId: question.id,
                                            }),
                                          )
                                        }
                                        type="button"
                                        variant="outline"
                                      >
                                        <ArrowDown className="size-4" />
                                        Down
                                      </Button>
                                      <Button
                                        className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                        disabled={questionPending}
                                        onClick={() => {
                                          setEditingQuestionId(question.id);
                                          setQuestionRoundId(round.id);
                                          setQuestionForm({
                                            acceptedAnswers:
                                              question.acceptedAnswers.join(
                                                ", ",
                                              ),
                                            correctAnswer:
                                              question.correctAnswer,
                                            pointValue: String(
                                              question.pointValue,
                                            ),
                                            prompt: question.prompt,
                                          });
                                        }}
                                        type="button"
                                        variant="outline"
                                      >
                                        <PencilLine className="size-4" />
                                        Edit
                                      </Button>
                                      <Button
                                        className="h-11 rounded-none border-white/10 bg-white/5 px-3 hover:bg-white/10"
                                        disabled={questionPending}
                                        onClick={() =>
                                          handleQuestionAction(
                                            () =>
                                              deleteQuestion({
                                                questionId: question.id,
                                              }),
                                            () => {
                                              if (
                                                editingQuestionId ===
                                                question.id
                                              ) {
                                                resetQuestionEditor();
                                              }
                                            },
                                          )
                                        }
                                        type="button"
                                        variant="outline"
                                      >
                                        <Trash2 className="size-4" />
                                        Delete
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </MysteryPanel>

          <div className="space-y-6">
            <MysteryPanel className="p-6 sm:p-8" tone="dark">
              <div className="space-y-6">
                <div className="space-y-3">
                  <SectionEyebrow>Private Standings</SectionEyebrow>
                  <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                    Host-only leaderboard.
                  </h2>
                  <p className="text-sm leading-7 text-current/66">
                    Rankings update whenever a round is scored. Players never
                    see these standings on their phones.
                  </p>
                </div>

                {gameState.players.length === 0 ? (
                  <p className="text-sm leading-7 text-current/66">
                    No players have joined yet.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {gameState.players.map((player) => (
                      <div
                        key={player.id}
                        className="border border-white/8 bg-white/4 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-[0.68rem] tracking-[0.3em] uppercase text-current/45">
                              Rank {player.rank}
                            </p>
                            <h3 className="font-display text-3xl leading-none text-[var(--mystery-gold)]">
                              {player.name}
                            </h3>
                          </div>
                          <StatusPill
                            tone={player.rank === 1 ? "gold" : "muted"}
                          >
                            {player.totalPoints} pts
                          </StatusPill>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-current/66">
                          <span className="inline-flex items-center gap-2">
                            <Trophy className="size-4 text-[var(--mystery-gold)]" />
                            {player.correctCount} correct
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Users className="size-4 text-[var(--mystery-gold)]" />
                            joined{" "}
                            {timestampFormatter.format(
                              new Date(player.joinedAt),
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MysteryPanel>

            <MysteryPanel className="p-6 sm:p-8" tone="dark">
              <div className="space-y-4">
                <SectionEyebrow>Live Notes</SectionEyebrow>
                <div className="grid gap-3">
                  {[
                    {
                      icon: Lock,
                      text: "Each player gets one locked answer per question. They never see correctness after submitting.",
                    },
                    {
                      icon: Play,
                      text: "Starting a round reveals every question in that round at once for live guest clients.",
                    },
                    {
                      icon: Square,
                      text: "Ending a round closes unanswered questions automatically and scores the full round immediately.",
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex gap-4 border border-white/8 bg-white/4 p-4"
                    >
                      <Icon className="mt-1 size-4 shrink-0 text-[var(--mystery-gold)]" />
                      <p className="text-sm leading-7 text-current/72">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </MysteryPanel>
          </div>
        </section>
      </div>
    </MysteryPage>
  );
}
