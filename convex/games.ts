import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  assertCanRevealQuestion,
  assertPassword,
  assertQuestionEditable,
  buildAcceptedAnswers,
  generateJoinCode,
  generateOpaqueToken,
  getGameByJoinCode,
  getPlayerByName,
  getPlayerByToken,
  getPlayersForGame,
  getQuestionById,
  getQuestionSubmissions,
  getQuestionsForGame,
  getSubmissionForPlayer,
  hashJoinPassword,
  normalizeAnswer,
  normalizeName,
  requireAdminUser,
  requireGameAdmin,
  requireQuestionAdmin,
  sanitizeAnswerList,
  sortPublicLeaderboard,
} from "./gameHelpers";

async function ensureUniqueJoinCode(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = generateJoinCode();
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_join_code", (query) => query.eq("joinCode", joinCode))
      .unique();

    if (!existingGame) {
      return joinCode;
    }
  }

  throw new ConvexError("Unable to generate a unique join code.");
}

function requireNonEmptyField(label: string, value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new ConvexError(`${label} is required.`);
  }

  return trimmed;
}

function serializePlayer(player: Doc<"players">) {
  return {
    correctCount: player.correctCount,
    id: player._id,
    joinedAt: player.joinedAt,
    name: player.name,
    totalPoints: player.totalPoints,
  };
}

async function buildAdminGameState(ctx: QueryCtx, game: Doc<"games">) {
  const [players, questions, currentQuestion] = await Promise.all([
    getPlayersForGame(ctx, game._id),
    getQuestionsForGame(ctx, game._id),
    game.currentQuestionId ? ctx.db.get(game.currentQuestionId) : null,
  ]);

  const questionSummaries = await Promise.all(
    questions.map(async (question) => {
      const submissions = await getQuestionSubmissions(ctx, question._id);
      return {
        acceptedAnswers: question.acceptedAnswers,
        correctAnswer: question.correctAnswer,
        id: question._id,
        order: question.order,
        pointValue: question.pointValue,
        prompt: question.prompt,
        status: question.status,
        submissionCount: submissions.length,
      };
    }),
  );

  const rankedPlayers = sortPublicLeaderboard(players).map((player, index) => ({
    ...serializePlayer(player),
    rank: index + 1,
  }));

  return {
    canEndGame:
      game.status === "lobby" &&
      questions.some((question) => question.status === "scored"),
    game: {
      createdAt: game.createdAt,
      currentQuestionId: game.currentQuestionId,
      currentQuestionNumber: currentQuestion ? currentQuestion.order + 1 : null,
      description: game.description,
      id: game._id,
      joinCode: game.joinCode,
      playerCount: players.length,
      questionCount: game.questionCount,
      requiresPassword: Boolean(game.joinPasswordHash),
      status: game.status,
      title: game.title,
      updatedAt: game.updatedAt,
    },
    players: rankedPlayers,
    questions: questionSummaries,
  };
}

export const listOwnedGames = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdminUser(ctx);
    const games = await ctx.db
      .query("games")
      .withIndex("by_creator_user", (query) =>
        query.eq("creatorUserId", user._id),
      )
      .collect();

    const summaries = await Promise.all(
      games.map(async (game) => {
        const [players, currentQuestion] = await Promise.all([
          getPlayersForGame(ctx, game._id),
          game.currentQuestionId ? ctx.db.get(game.currentQuestionId) : null,
        ]);

        return {
          currentQuestionNumber: currentQuestion
            ? currentQuestion.order + 1
            : null,
          description: game.description,
          id: game._id,
          joinCode: game.joinCode,
          playerCount: players.length,
          questionCount: game.questionCount,
          requiresPassword: Boolean(game.joinPasswordHash),
          status: game.status,
          title: game.title,
          updatedAt: game.updatedAt,
        };
      }),
    );

    return summaries.sort((left, right) => right.updatedAt - left.updatedAt);
  },
});

export const getAdminGame = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const { game } = await requireGameAdmin(ctx, args.gameId);
    return await buildAdminGameState(ctx, game);
  },
});

export const getPublicGameState = query({
  args: {
    guestToken: v.optional(v.string()),
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await getGameByJoinCode(
      ctx,
      args.joinCode.trim().toUpperCase(),
    );
    if (!game) {
      return null;
    }

    const [players, questions, currentQuestion, player] = await Promise.all([
      getPlayersForGame(ctx, game._id),
      getQuestionsForGame(ctx, game._id),
      game.currentQuestionId ? ctx.db.get(game.currentQuestionId) : null,
      args.guestToken
        ? getPlayerByToken(ctx, game._id, args.guestToken)
        : Promise.resolve(null),
    ]);
    const latestRevealedQuestion = [...questions]
      .filter((question) => question.status !== "draft")
      .sort((left, right) => right.order - left.order)[0];

    const activeSubmission =
      player && currentQuestion
        ? await getSubmissionForPlayer(ctx, currentQuestion._id, player._id)
        : null;

    const publicLeaderboard =
      game.status === "finale"
        ? sortPublicLeaderboard(players).map((rankedPlayer, index) => ({
            ...serializePlayer(rankedPlayer),
            rank: index + 1,
          }))
        : null;

    return {
      activeQuestion:
        game.status === "question_live" && currentQuestion
          ? {
              id: currentQuestion._id,
              number: currentQuestion.order + 1,
              prompt: currentQuestion.prompt,
            }
          : null,
      game: {
        currentQuestionNumber: currentQuestion
          ? currentQuestion.order + 1
          : latestRevealedQuestion
            ? latestRevealedQuestion.order + 1
            : null,
        description: game.description,
        id: game._id,
        joinCode: game.joinCode,
        playerCount: players.length,
        questionCount: game.questionCount,
        requiresPassword: Boolean(game.joinPasswordHash),
        status: game.status,
        title: game.title,
      },
      hasSubmittedCurrentQuestion: Boolean(activeSubmission),
      player: player ? serializePlayer(player) : null,
      publicLeaderboard,
    };
  },
});

export const createGame = mutation({
  args: {
    description: v.string(),
    joinPassword: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdminUser(ctx);
    const title = requireNonEmptyField("Title", args.title);
    const description = args.description.trim();
    const joinCode = await ensureUniqueJoinCode(ctx);
    const now = Date.now();
    const joinPasswordHash = await hashJoinPassword(
      joinCode,
      args.joinPassword ?? "",
    );

    const gameId = await ctx.db.insert("games", {
      createdAt: now,
      creatorUserId: user._id,
      currentQuestionId: null,
      description,
      joinCode,
      joinPasswordHash,
      questionCount: 0,
      status: "lobby",
      title,
      updatedAt: now,
    });

    return { gameId, joinCode };
  },
});

export const updateGame = mutation({
  args: {
    description: v.string(),
    gameId: v.id("games"),
    joinPassword: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { game } = await requireGameAdmin(ctx, args.gameId);
    const title = requireNonEmptyField("Title", args.title);
    const description = args.description.trim();
    const joinPasswordHash =
      args.joinPassword === undefined
        ? game.joinPasswordHash
        : await hashJoinPassword(game.joinCode, args.joinPassword);

    await ctx.db.patch(game._id, {
      description,
      joinPasswordHash,
      title,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const createQuestion = mutation({
  args: {
    acceptedAnswers: v.array(v.string()),
    correctAnswer: v.string(),
    gameId: v.id("games"),
    pointValue: v.number(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { game } = await requireGameAdmin(ctx, args.gameId);
    if (game.status === "finale") {
      throw new ConvexError("You cannot add questions after the game ends.");
    }

    const prompt = requireNonEmptyField("Prompt", args.prompt);
    const correctAnswer = requireNonEmptyField(
      "Correct answer",
      args.correctAnswer,
    );
    const acceptedAnswers = sanitizeAnswerList(args.acceptedAnswers).filter(
      (value) => normalizeAnswer(value) !== normalizeAnswer(correctAnswer),
    );
    const pointValue = Math.max(1, Math.floor(args.pointValue));
    const existingQuestions = await getQuestionsForGame(ctx, game._id);
    const now = Date.now();

    const questionId = await ctx.db.insert("questions", {
      acceptedAnswers,
      correctAnswer,
      createdAt: now,
      gameId: game._id,
      order: existingQuestions.length,
      pointValue,
      prompt,
      status: "draft",
      updatedAt: now,
    });

    await ctx.db.patch(game._id, {
      questionCount: existingQuestions.length + 1,
      updatedAt: now,
    });

    return { questionId };
  },
});

export const updateQuestion = mutation({
  args: {
    acceptedAnswers: v.array(v.string()),
    correctAnswer: v.string(),
    pointValue: v.number(),
    prompt: v.string(),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { question } = await requireQuestionAdmin(ctx, args.questionId);
    assertQuestionEditable(question);

    const prompt = requireNonEmptyField("Prompt", args.prompt);
    const correctAnswer = requireNonEmptyField(
      "Correct answer",
      args.correctAnswer,
    );
    const acceptedAnswers = sanitizeAnswerList(args.acceptedAnswers).filter(
      (value) => normalizeAnswer(value) !== normalizeAnswer(correctAnswer),
    );

    await ctx.db.patch(question._id, {
      acceptedAnswers,
      correctAnswer,
      pointValue: Math.max(1, Math.floor(args.pointValue)),
      prompt,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question } = await requireQuestionAdmin(ctx, args.questionId);
    assertQuestionEditable(question);

    const questions = await getQuestionsForGame(ctx, game._id);
    const remainingQuestions = questions.filter(
      (candidate) => candidate._id !== question._id,
    );

    await ctx.db.delete(question._id);

    await Promise.all(
      remainingQuestions
        .filter((candidate) => candidate.order > question.order)
        .map((candidate) =>
          ctx.db.patch(candidate._id, {
            order: candidate.order - 1,
            updatedAt: Date.now(),
          }),
        ),
    );

    await ctx.db.patch(game._id, {
      questionCount: remainingQuestions.length,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const moveQuestion = mutation({
  args: {
    direction: v.union(v.literal("up"), v.literal("down")),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question } = await requireQuestionAdmin(ctx, args.questionId);
    assertQuestionEditable(question);

    const questions = await getQuestionsForGame(ctx, game._id);
    const draftQuestions = questions.filter(
      (candidate) => candidate.status === "draft",
    );
    const currentIndex = draftQuestions.findIndex(
      (candidate) => candidate._id === question._id,
    );
    const targetIndex =
      args.direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= draftQuestions.length
    ) {
      return { success: true };
    }

    const targetQuestion = draftQuestions[targetIndex];
    const now = Date.now();

    await Promise.all([
      ctx.db.patch(question._id, {
        order: targetQuestion.order,
        updatedAt: now,
      }),
      ctx.db.patch(targetQuestion._id, {
        order: question.order,
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const unlockQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question } = await requireQuestionAdmin(ctx, args.questionId);
    assertCanRevealQuestion(game);
    assertQuestionEditable(question);

    const now = Date.now();

    await Promise.all([
      ctx.db.patch(question._id, {
        status: "live",
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        currentQuestionId: question._id,
        status: "question_live",
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const lockQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question } = await requireQuestionAdmin(ctx, args.questionId);

    if (
      game.status !== "question_live" ||
      game.currentQuestionId !== question._id
    ) {
      throw new ConvexError("This question is not currently live.");
    }

    if (question.status !== "live") {
      throw new ConvexError("Only live questions can be locked.");
    }

    const now = Date.now();

    await Promise.all([
      ctx.db.patch(question._id, {
        status: "locked",
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        status: "question_locked",
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const scoreQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question } = await requireQuestionAdmin(ctx, args.questionId);

    if (
      game.status !== "question_locked" ||
      game.currentQuestionId !== question._id
    ) {
      throw new ConvexError("Lock this question before scoring it.");
    }

    if (question.status !== "locked") {
      throw new ConvexError("Only locked questions can be scored.");
    }

    const [players, submissions] = await Promise.all([
      getPlayersForGame(ctx, game._id),
      getQuestionSubmissions(ctx, question._id),
    ]);
    const playerMap = new Map(players.map((player) => [player._id, player]));
    const acceptedAnswers = buildAcceptedAnswers(question);

    for (const submission of submissions) {
      const player = playerMap.get(submission.playerId);
      if (!player) {
        continue;
      }

      const isCorrect = acceptedAnswers.has(submission.normalizedAnswer);
      const pointsAwarded = isCorrect ? question.pointValue : 0;

      await ctx.db.patch(submission._id, {
        isCorrect,
        pointsAwarded,
      });

      if (isCorrect) {
        const nextPlayer = {
          ...player,
          correctCount: player.correctCount + 1,
          totalPoints: player.totalPoints + question.pointValue,
        };

        playerMap.set(player._id, nextPlayer);

        await ctx.db.patch(player._id, {
          correctCount: nextPlayer.correctCount,
          totalPoints: nextPlayer.totalPoints,
        });
      }
    }

    const now = Date.now();

    await Promise.all([
      ctx.db.patch(question._id, {
        status: "scored",
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        currentQuestionId: null,
        status: "lobby",
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const endGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const { game } = await requireGameAdmin(ctx, args.gameId);

    if (game.status === "question_live" || game.status === "question_locked") {
      throw new ConvexError(
        "Finish the active question before ending the game.",
      );
    }

    const questions = await getQuestionsForGame(ctx, game._id);
    if (!questions.some((question) => question.status === "scored")) {
      throw new ConvexError(
        "Score at least one question before ending the game.",
      );
    }

    await ctx.db.patch(game._id, {
      currentQuestionId: null,
      status: "finale",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const joinGame = mutation({
  args: {
    joinCode: v.string(),
    name: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const joinCode = args.joinCode.trim().toUpperCase();
    const game = await getGameByJoinCode(ctx, joinCode);
    if (!game) {
      throw new ConvexError("Game not found.");
    }

    if (game.status === "finale") {
      throw new ConvexError("This game has already finished.");
    }

    const normalizedName = normalizeName(args.name);
    if (!normalizedName) {
      throw new ConvexError("Username is required.");
    }

    await assertPassword(joinCode, game.joinPasswordHash, args.password);

    const existingPlayer = await getPlayerByName(
      ctx,
      game._id,
      normalizedName.toLowerCase(),
    );
    if (existingPlayer) {
      throw new ConvexError("That username is already taken for this game.");
    }

    const now = Date.now();
    const guestToken = generateOpaqueToken();
    const playerId = await ctx.db.insert("players", {
      correctCount: 0,
      gameId: game._id,
      guestToken,
      joinedAt: now,
      name: normalizedName,
      normalizedName: normalizedName.toLowerCase(),
      totalPoints: 0,
    });

    await ctx.db.patch(game._id, {
      updatedAt: now,
    });

    return {
      guestToken,
      player: {
        correctCount: 0,
        id: playerId,
        joinedAt: now,
        name: normalizedName,
        totalPoints: 0,
      },
    };
  },
});

export const resumeGame = mutation({
  args: {
    guestToken: v.string(),
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await getGameByJoinCode(
      ctx,
      args.joinCode.trim().toUpperCase(),
    );
    if (!game) {
      return null;
    }

    const player = await getPlayerByToken(ctx, game._id, args.guestToken);
    return player ? serializePlayer(player) : null;
  },
});

export const submitAnswer = mutation({
  args: {
    answer: v.string(),
    guestToken: v.string(),
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await getGameByJoinCode(
      ctx,
      args.joinCode.trim().toUpperCase(),
    );
    if (!game) {
      throw new ConvexError("Game not found.");
    }

    if (game.status !== "question_live" || !game.currentQuestionId) {
      throw new ConvexError("There is no live question right now.");
    }

    const player = await getPlayerByToken(ctx, game._id, args.guestToken);
    if (!player) {
      throw new ConvexError("Join the game before submitting an answer.");
    }

    const question = await getQuestionById(ctx, game.currentQuestionId);
    if (question.status !== "live") {
      throw new ConvexError("This question is no longer accepting answers.");
    }

    const existingSubmission = await getSubmissionForPlayer(
      ctx,
      question._id,
      player._id,
    );
    if (existingSubmission) {
      throw new ConvexError("You have already submitted an answer.");
    }

    const answer = args.answer.trim();
    const normalizedAnswer = normalizeAnswer(answer);
    if (!normalizedAnswer) {
      throw new ConvexError("Answer cannot be empty.");
    }

    const submissionId = await ctx.db.insert("submissions", {
      answer,
      gameId: game._id,
      isCorrect: null,
      normalizedAnswer,
      playerId: player._id,
      pointsAwarded: null,
      questionId: question._id,
      submittedAt: Date.now(),
    });

    return { submissionId };
  },
});
