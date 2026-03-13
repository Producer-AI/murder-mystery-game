"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  KeyRound,
  Lock,
  QrCode,
  ScrollText,
  Shield,
  Trash2,
  Trophy,
  Unlock,
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

export function AdminGamePage({ gameId }: { gameId: Id<"games"> }) {
  const gameState = useQuery(api.games.getAdminGame, {
    gameId,
  });
  const createQuestion = useMutation(api.games.createQuestion);
  const deleteQuestion = useMutation(api.games.deleteQuestion);
  const endGame = useMutation(api.games.endGame);
  const lockQuestion = useMutation(api.games.lockQuestion);
  const moveQuestion = useMutation(api.games.moveQuestion);
  const scoreQuestion = useMutation(api.games.scoreQuestion);
  const unlockQuestion = useMutation(api.games.unlockQuestion);
  const updateGame = useMutation(api.games.updateGame);
  const updateQuestion = useMutation(api.games.updateQuestion);

  const [copiedValue, setCopiedValue] = useState<"code" | "link" | null>(null);
  const [editingQuestionId, setEditingQuestionId] =
    useState<Id<"questions"> | null>(null);
  const [origin, setOrigin] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [questionForm, setQuestionForm] =
    useState<QuestionForm>(emptyQuestionForm);
  const [questionPending, setQuestionPending] = useState(false);
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

  const shareUrl = origin
    ? `${origin}/games/${gameState?.game.joinCode ?? ""}`
    : "";

  const copyToClipboard = async (value: string, copied: "code" | "link") => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(copied);
    window.setTimeout(() => setCopiedValue(null), 1800);
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

  const handleQuestionSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!gameState) {
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
      } else {
        await createQuestion({
          ...payload,
          gameId: gameState.game.id,
        });
      }

      setEditingQuestionId(null);
      setQuestionForm(emptyQuestionForm);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setQuestionPending(false);
    }
  };

  const handleQuestionAction = async (
    action: () => Promise<unknown>,
    resetEdit = false,
  ) => {
    setPageError(null);
    setQuestionPending(true);

    try {
      await action();
      if (resetEdit) {
        setEditingQuestionId(null);
        setQuestionForm(emptyQuestionForm);
      }
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
                  tone={gameState.game.status === "finale" ? "red" : "gold"}
                >
                  {gameState.game.status.replace("_", " ")}
                </StatusPill>
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
                disabled={questionPending}
                onClick={() =>
                  handleQuestionAction(() =>
                    endGame({ gameId: gameState.game.id }),
                  )
                }
              >
                End Game
                <Trophy className="size-4" />
              </Button>
            ) : null}
          </div>
        </MysteryPanel>

        <section className="grid gap-4 sm:grid-cols-3">
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
            label="Current Question"
            tone="dark"
            value={
              gameState.game.currentQuestionNumber
                ? `#${gameState.game.currentQuestionNumber}`
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

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <MysteryPanel className="p-6 sm:p-8" tone="cream">
              <div className="space-y-6 text-[var(--mystery-ink)]">
                <div className="space-y-3">
                  <SectionEyebrow className="text-[var(--mystery-crimson)]">
                    Question Builder
                  </SectionEyebrow>
                  <h2 className="font-display text-4xl leading-none">
                    {editingQuestionId
                      ? "Edit the clue."
                      : "Write the next clue."}
                  </h2>
                </div>

                <form className="space-y-5" onSubmit={handleQuestionSubmit}>
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
                      disabled={questionPending}
                      type="submit"
                    >
                      {editingQuestionId ? "Save Question" : "Add Question"}
                      <ScrollText className="size-4" />
                    </Button>
                    {editingQuestionId ? (
                      <Button
                        className="h-12 flex-1 rounded-none border-[var(--mystery-crimson)]/20 bg-transparent text-[var(--mystery-crimson)] hover:bg-[rgba(139,32,32,0.06)]"
                        disabled={questionPending}
                        onClick={() => {
                          setEditingQuestionId(null);
                          setQuestionForm(emptyQuestionForm);
                        }}
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

            <MysteryPanel className="p-6 sm:p-8" tone="dark">
              <div className="space-y-6">
                <div className="space-y-3">
                  <SectionEyebrow>Question Queue</SectionEyebrow>
                  <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                    Live control sequence.
                  </h2>
                </div>

                <div className="grid gap-4">
                  {gameState.questions.length === 0 ? (
                    <p className="text-sm leading-7 text-current/66">
                      No questions yet. Draft them above, then unlock them one
                      at a time as guests wait in the room.
                    </p>
                  ) : (
                    gameState.questions.map((question) => (
                      <div
                        key={question.id}
                        className="border border-white/8 bg-white/4 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone="gold">
                                Question {question.order + 1}
                              </StatusPill>
                              <StatusPill
                                tone={
                                  question.status === "locked" ? "red" : "muted"
                                }
                              >
                                {question.status}
                              </StatusPill>
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-display text-3xl leading-none text-[var(--mystery-gold)]">
                                {question.prompt}
                              </h3>
                              <p className="text-sm leading-7 text-current/66">
                                Answer key: {question.correctAnswer}
                                {question.acceptedAnswers.length > 0
                                  ? ` | Variants: ${question.acceptedAnswers.join(", ")}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 lg:w-[15rem]">
                            {question.status === "draft" ? (
                              <>
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
                                    setQuestionForm({
                                      acceptedAnswers:
                                        question.acceptedAnswers.join(", "),
                                      correctAnswer: question.correctAnswer,
                                      pointValue: String(question.pointValue),
                                      prompt: question.prompt,
                                    });
                                  }}
                                  type="button"
                                  variant="outline"
                                >
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
                                      editingQuestionId === question.id,
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
                                  disabled={questionPending}
                                  onClick={() =>
                                    handleQuestionAction(() =>
                                      unlockQuestion({
                                        questionId: question.id,
                                      }),
                                    )
                                  }
                                  type="button"
                                >
                                  <Unlock className="size-4" />
                                  Unlock
                                </Button>
                              </>
                            ) : question.status === "live" ? (
                              <Button
                                className="h-11 rounded-none border-[var(--mystery-gold)] bg-[var(--mystery-gold)] px-3 text-[var(--mystery-ink)] hover:bg-[color:color-mix(in_srgb,var(--mystery-gold)_86%,white)]"
                                disabled={questionPending}
                                onClick={() =>
                                  handleQuestionAction(() =>
                                    lockQuestion({ questionId: question.id }),
                                  )
                                }
                                type="button"
                              >
                                <Lock className="size-4" />
                                Lock
                              </Button>
                            ) : question.status === "locked" ? (
                              <Button
                                className="h-11 rounded-none border-[var(--mystery-gold)] bg-[var(--mystery-gold)] px-3 text-[var(--mystery-ink)] hover:bg-[color:color-mix(in_srgb,var(--mystery-gold)_86%,white)]"
                                disabled={questionPending}
                                onClick={() =>
                                  handleQuestionAction(() =>
                                    scoreQuestion({ questionId: question.id }),
                                  )
                                }
                                type="button"
                              >
                                <Check className="size-4" />
                                Score
                              </Button>
                            ) : (
                              <StatusPill
                                tone="gold"
                                className="justify-center"
                              >
                                Scored
                              </StatusPill>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                              Points
                            </p>
                            <p className="mt-2 text-[var(--mystery-gold)]">
                              {question.pointValue}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                              Submissions
                            </p>
                            <p className="mt-2 text-[var(--mystery-gold)]">
                              {question.submissionCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.68rem] tracking-[0.28em] uppercase text-current/45">
                              Variants
                            </p>
                            <p className="mt-2 text-[var(--mystery-gold)]">
                              {question.acceptedAnswers.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </MysteryPanel>
          </div>

          <MysteryPanel className="p-6 sm:p-8" tone="dark">
            <div className="space-y-6">
              <div className="space-y-3">
                <SectionEyebrow>Private Standings</SectionEyebrow>
                <h2 className="font-display text-4xl leading-none text-[var(--mystery-gold)]">
                  Host-only leaderboard.
                </h2>
              </div>

              <div className="grid gap-3">
                {gameState.players.length === 0 ? (
                  <div className="border border-white/8 bg-white/4 p-5">
                    <p className="text-sm leading-7 text-current/66">
                      No guests have joined yet. Once they check in, you’ll see
                      their private ranking here.
                    </p>
                  </div>
                ) : (
                  gameState.players.map((player) => (
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
                        <StatusPill tone="gold">
                          {player.totalPoints} pts
                        </StatusPill>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-3 text-current/66">
                          <Users className="size-4 text-[var(--mystery-gold)]" />
                          Joined{" "}
                          {new Date(player.joinedAt).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-3 text-current/66">
                          <Trophy className="size-4 text-[var(--mystery-gold)]" />
                          {player.correctCount} correct answers
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </MysteryPanel>
        </section>
      </div>
    </MysteryPage>
  );
}
