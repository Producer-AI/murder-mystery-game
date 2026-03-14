import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

export const gameStatusValidator = v.union(
  v.literal("lobby"),
  v.literal("round_live"),
  v.literal("ended"),
);

export const roundStatusValidator = v.union(
  v.literal("draft"),
  v.literal("live"),
  v.literal("scored"),
);

type ReaderCtx = QueryCtx | MutationCtx;

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function sanitizeAnswerList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
}

export function sortPublicLeaderboard<
  T extends {
    correctCount: number;
    joinedAt: number;
    totalPoints: number;
  },
>(players: T[]) {
  return [...players].sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints;
    }
    if (right.correctCount !== left.correctCount) {
      return right.correctCount - left.correctCount;
    }
    return left.joinedAt - right.joinedAt;
  });
}

export const sortLeaderboard = sortPublicLeaderboard;

export function generateOpaqueToken() {
  return `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function generateJoinCode(length = 6) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
    code += JOIN_CODE_CHARS[randomIndex];
  }

  return code;
}

export async function hashJoinPassword(joinCode: string, password: string) {
  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    return null;
  }

  const encoded = new TextEncoder().encode(`${joinCode}:${trimmedPassword}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export async function assertPassword(
  joinCode: string,
  passwordHash: string | null,
  candidatePassword?: string,
) {
  if (!passwordHash) {
    return;
  }

  const hashedCandidate = await hashJoinPassword(
    joinCode,
    candidatePassword ?? "",
  );
  if (hashedCandidate !== passwordHash) {
    throw new ConvexError("Incorrect game password.");
  }
}

export async function requireAdminUser(ctx: ReaderCtx) {
  return await authComponent.getAuthUser(ctx as never);
}

export async function getGameById(ctx: ReaderCtx, gameId: Id<"games">) {
  const game = await ctx.db.get(gameId);

  if (!game) {
    throw new ConvexError("Game not found.");
  }

  return game;
}

export async function getGameByJoinCode(ctx: ReaderCtx, joinCode: string) {
  return await ctx.db
    .query("games")
    .withIndex("by_join_code", (query) => query.eq("joinCode", joinCode))
    .unique();
}

export async function getQuestionById(
  ctx: ReaderCtx,
  questionId: Id<"questions">,
) {
  const question = await ctx.db.get(questionId);

  if (!question) {
    throw new ConvexError("Question not found.");
  }

  return question;
}

export async function getRoundById(ctx: ReaderCtx, roundId: Id<"rounds">) {
  const round = await ctx.db.get(roundId);

  if (!round) {
    throw new ConvexError("Round not found.");
  }

  return round;
}

export async function getRoundsForGame(ctx: ReaderCtx, gameId: Id<"games">) {
  return await ctx.db
    .query("rounds")
    .withIndex("by_game_order", (query) => query.eq("gameId", gameId))
    .collect();
}

export async function getQuestionsForGame(ctx: ReaderCtx, gameId: Id<"games">) {
  return await ctx.db
    .query("questions")
    .withIndex("by_game", (query) => query.eq("gameId", gameId))
    .collect();
}

export async function getQuestionsForRound(
  ctx: ReaderCtx,
  roundId: Id<"rounds">,
) {
  return await ctx.db
    .query("questions")
    .withIndex("by_round_order", (query) => query.eq("roundId", roundId))
    .collect();
}

export async function getPlayersForGame(ctx: ReaderCtx, gameId: Id<"games">) {
  return await ctx.db
    .query("players")
    .withIndex("by_game", (query) => query.eq("gameId", gameId))
    .collect();
}

export async function getQuestionSubmissions(
  ctx: ReaderCtx,
  questionId: Id<"questions">,
) {
  return await ctx.db
    .query("submissions")
    .withIndex("by_question", (query) => query.eq("questionId", questionId))
    .collect();
}

export async function getSubmissionForPlayer(
  ctx: ReaderCtx,
  questionId: Id<"questions">,
  playerId: Id<"players">,
) {
  return await ctx.db
    .query("submissions")
    .withIndex("by_question_player", (query) =>
      query.eq("questionId", questionId).eq("playerId", playerId),
    )
    .unique();
}

export async function getPlayerByToken(
  ctx: ReaderCtx,
  gameId: Id<"games">,
  guestToken: string,
) {
  return await ctx.db
    .query("players")
    .withIndex("by_game_token", (query) =>
      query.eq("gameId", gameId).eq("guestToken", guestToken),
    )
    .unique();
}

export async function getPlayerSubmissions(
  ctx: ReaderCtx,
  playerId: Id<"players">,
) {
  return await ctx.db
    .query("submissions")
    .withIndex("by_player", (query) => query.eq("playerId", playerId))
    .collect();
}

export async function getPlayerByName(
  ctx: ReaderCtx,
  gameId: Id<"games">,
  normalizedName: string,
) {
  return await ctx.db
    .query("players")
    .withIndex("by_game_name", (query) =>
      query.eq("gameId", gameId).eq("normalizedName", normalizedName),
    )
    .unique();
}

export async function requireGameAdmin(ctx: ReaderCtx, gameId: Id<"games">) {
  const [user, game] = await Promise.all([
    requireAdminUser(ctx),
    getGameById(ctx, gameId),
  ]);

  if (game.creatorUserId !== user._id) {
    throw new ConvexError("You do not have access to this game.");
  }

  return { game, user };
}

export async function requireRoundAdmin(ctx: ReaderCtx, roundId: Id<"rounds">) {
  const round = await getRoundById(ctx, roundId);
  const { game, user } = await requireGameAdmin(ctx, round.gameId);

  return { game, round, user };
}

export async function requireQuestionAdmin(
  ctx: ReaderCtx,
  questionId: Id<"questions">,
) {
  const question = await getQuestionById(ctx, questionId);
  const [round, { game, user }] = await Promise.all([
    getRoundById(ctx, question.roundId),
    requireGameAdmin(ctx, question.gameId),
  ]);

  return { game, question, round, user };
}

export function assertRoundEditable(round: Doc<"rounds">) {
  if (round.status !== "draft") {
    throw new ConvexError("Only draft rounds can be edited.");
  }
}

export function buildAcceptedAnswers(question: Doc<"questions">) {
  return new Set(
    [question.correctAnswer, ...question.acceptedAnswers]
      .map((value) => normalizeAnswer(value))
      .filter(Boolean),
  );
}
