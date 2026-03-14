import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  assertPassword,
  assertRoundEditable,
  buildAcceptedAnswers,
  generateJoinCode,
  generateOpaqueToken,
  getGameByJoinCode,
  getPlayerByName,
  getPlayerByToken,
  getPlayerSubmissions,
  getPlayersForGame,
  getQuestionById,
  getQuestionSubmissions,
  getQuestionsForRound,
  getRoundById,
  getRoundsForGame,
  getSubmissionForPlayer,
  hashJoinPassword,
  normalizeAnswer,
  normalizeName,
  requireAdminUser,
  requireGameAdmin,
  requireQuestionAdmin,
  requireRoundAdmin,
  sanitizeAnswerList,
  sortLeaderboard,
} from "./gameHelpers";

type RoundWithQuestions = {
  questions: Doc<"questions">[];
  round: Doc<"rounds">;
};

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

function assertGameNotEnded(game: Doc<"games">) {
  if (game.status === "ended") {
    throw new ConvexError("This game has already ended.");
  }
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

async function getRoundsWithQuestions(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
): Promise<RoundWithQuestions[]> {
  const rounds = await getRoundsForGame(ctx, gameId);
  const questionLists = await Promise.all(
    rounds.map((round) => getQuestionsForRound(ctx, round._id)),
  );

  return rounds.map((round, index) => ({
    questions: questionLists[index],
    round,
  }));
}

function getLatestStartedRound(rounds: Doc<"rounds">[]) {
  for (let index = rounds.length - 1; index >= 0; index -= 1) {
    if (rounds[index].status !== "draft") {
      return rounds[index];
    }
  }

  return null;
}

async function buildAdminGameState(ctx: QueryCtx, game: Doc<"games">) {
  const currentRoundPromise = game.currentRoundId
    ? getRoundById(ctx, game.currentRoundId)
    : Promise.resolve(null);

  const [players, roundsWithQuestions, currentRound] = await Promise.all([
    getPlayersForGame(ctx, game._id),
    getRoundsWithQuestions(ctx, game._id),
    currentRoundPromise,
  ]);

  const rounds = await Promise.all(
    roundsWithQuestions.map(async ({ questions, round }) => {
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
            submissionCount: submissions.length,
          };
        }),
      );

      return {
        endedAt: round.endedAt,
        id: round._id,
        order: round.order,
        questionCount: questions.length,
        questions: questionSummaries,
        startedAt: round.startedAt,
        status: round.status,
        title: round.title,
      };
    }),
  );

  const rankedPlayers = sortLeaderboard(players).map((player, index) => ({
    ...serializePlayer(player),
    rank: index + 1,
  }));

  return {
    canEndGame:
      game.status !== "ended" &&
      game.status !== "round_live" &&
      rounds.some((round) => round.status === "scored"),
    game: {
      createdAt: game.createdAt,
      currentRoundId: game.currentRoundId,
      currentRoundNumber: currentRound ? currentRound.order + 1 : null,
      currentRoundTitle: currentRound?.title ?? null,
      description: game.description,
      id: game._id,
      joinCode: game.joinCode,
      playerCount: players.length,
      questionCount: game.questionCount,
      requiresPassword: Boolean(game.joinPasswordHash),
      roundCount: rounds.length,
      status: game.status,
      title: game.title,
      updatedAt: game.updatedAt,
    },
    players: rankedPlayers,
    rounds,
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
        const currentRoundPromise = game.currentRoundId
          ? getRoundById(ctx, game.currentRoundId)
          : Promise.resolve(null);
        const [players, rounds, currentRound] = await Promise.all([
          getPlayersForGame(ctx, game._id),
          getRoundsForGame(ctx, game._id),
          currentRoundPromise,
        ]);

        return {
          currentRoundNumber: currentRound ? currentRound.order + 1 : null,
          currentRoundTitle: currentRound?.title ?? null,
          description: game.description,
          id: game._id,
          joinCode: game.joinCode,
          playerCount: players.length,
          questionCount: game.questionCount,
          requiresPassword: Boolean(game.joinPasswordHash),
          roundCount: rounds.length,
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

    const currentRoundPromise = game.currentRoundId
      ? getRoundById(ctx, game.currentRoundId)
      : Promise.resolve(null);
    const [players, rounds, player, activeRound] = await Promise.all([
      getPlayersForGame(ctx, game._id),
      getRoundsForGame(ctx, game._id),
      args.guestToken
        ? getPlayerByToken(ctx, game._id, args.guestToken)
        : Promise.resolve(null),
      currentRoundPromise,
    ]);

    const activeQuestions = activeRound
      ? await getQuestionsForRound(ctx, activeRound._id)
      : [];
    const activeQuestionIds = new Set(
      activeQuestions.map((question) => question._id),
    );
    const playerSubmissions = player
      ? await getPlayerSubmissions(ctx, player._id)
      : [];
    const submittedQuestionIds = new Set(
      playerSubmissions
        .filter((submission) => activeQuestionIds.has(submission.questionId))
        .map((submission) => submission.questionId),
    );
    const latestStartedRound = getLatestStartedRound(rounds);

    return {
      activeRound: activeRound
        ? {
            id: activeRound._id,
            number: activeRound.order + 1,
            questionCount: activeQuestions.length,
            questions: activeQuestions.map((question) => ({
              hasSubmitted: submittedQuestionIds.has(question._id),
              id: question._id,
              number: question.order + 1,
              pointValue: question.pointValue,
              prompt: question.prompt,
            })),
            title: activeRound.title,
          }
        : null,
      game: {
        description: game.description,
        id: game._id,
        joinCode: game.joinCode,
        latestRoundNumber: latestStartedRound
          ? latestStartedRound.order + 1
          : null,
        playerCount: players.length,
        questionCount: game.questionCount,
        requiresPassword: Boolean(game.joinPasswordHash),
        status: game.status,
        title: game.title,
      },
      player: player ? serializePlayer(player) : null,
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
      currentRoundId: null,
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

export const createRound = mutation({
  args: {
    gameId: v.id("games"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { game } = await requireGameAdmin(ctx, args.gameId);
    assertGameNotEnded(game);

    const title = requireNonEmptyField("Round title", args.title);
    const rounds = await getRoundsForGame(ctx, game._id);
    const now = Date.now();

    const roundId = await ctx.db.insert("rounds", {
      createdAt: now,
      endedAt: null,
      gameId: game._id,
      order: rounds.length,
      startedAt: null,
      status: "draft",
      title,
      updatedAt: now,
    });

    await ctx.db.patch(game._id, {
      updatedAt: now,
    });

    return { roundId };
  },
});

export const updateRound = mutation({
  args: {
    roundId: v.id("rounds"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { game, round } = await requireRoundAdmin(ctx, args.roundId);
    assertGameNotEnded(game);
    assertRoundEditable(round);
    const now = Date.now();

    await Promise.all([
      ctx.db.patch(round._id, {
        title: requireNonEmptyField("Round title", args.title),
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const deleteRound = mutation({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const { game, round } = await requireRoundAdmin(ctx, args.roundId);
    assertGameNotEnded(game);
    assertRoundEditable(round);

    const [questions, rounds] = await Promise.all([
      getQuestionsForRound(ctx, round._id),
      getRoundsForGame(ctx, game._id),
    ]);
    const remainingRounds = rounds.filter(
      (candidate) => candidate._id !== round._id,
    );
    const now = Date.now();

    await Promise.all([
      ...questions.map((question) => ctx.db.delete(question._id)),
      ctx.db.delete(round._id),
      ...remainingRounds
        .filter((candidate) => candidate.order > round.order)
        .map((candidate) =>
          ctx.db.patch(candidate._id, {
            order: candidate.order - 1,
            updatedAt: now,
          }),
        ),
      ctx.db.patch(game._id, {
        questionCount: Math.max(0, game.questionCount - questions.length),
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const moveRound = mutation({
  args: {
    direction: v.union(v.literal("up"), v.literal("down")),
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const { game, round } = await requireRoundAdmin(ctx, args.roundId);
    assertGameNotEnded(game);
    assertRoundEditable(round);

    const rounds = await getRoundsForGame(ctx, game._id);
    const draftRounds = rounds.filter(
      (candidate) => candidate.status === "draft",
    );
    const currentIndex = draftRounds.findIndex(
      (candidate) => candidate._id === round._id,
    );
    const targetIndex =
      args.direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= draftRounds.length
    ) {
      return { success: true };
    }

    const targetRound = draftRounds[targetIndex];
    const now = Date.now();

    await Promise.all([
      ctx.db.patch(round._id, {
        order: targetRound.order,
        updatedAt: now,
      }),
      ctx.db.patch(targetRound._id, {
        order: round.order,
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const createQuestion = mutation({
  args: {
    acceptedAnswers: v.array(v.string()),
    correctAnswer: v.string(),
    pointValue: v.number(),
    prompt: v.string(),
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const { game, round } = await requireRoundAdmin(ctx, args.roundId);
    assertGameNotEnded(game);
    assertRoundEditable(round);

    const prompt = requireNonEmptyField("Prompt", args.prompt);
    const correctAnswer = requireNonEmptyField(
      "Correct answer",
      args.correctAnswer,
    );
    const acceptedAnswers = sanitizeAnswerList(args.acceptedAnswers).filter(
      (value) => normalizeAnswer(value) !== normalizeAnswer(correctAnswer),
    );
    const pointValue = Math.max(1, Math.floor(args.pointValue));
    const existingQuestions = await getQuestionsForRound(ctx, round._id);
    const now = Date.now();

    const questionId = await ctx.db.insert("questions", {
      acceptedAnswers,
      correctAnswer,
      createdAt: now,
      gameId: game._id,
      order: existingQuestions.length,
      pointValue,
      prompt,
      roundId: round._id,
      updatedAt: now,
    });

    await ctx.db.patch(game._id, {
      questionCount: game.questionCount + 1,
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
    const { game, round, question } = await requireQuestionAdmin(
      ctx,
      args.questionId,
    );
    assertGameNotEnded(game);
    assertRoundEditable(round);
    const now = Date.now();

    const prompt = requireNonEmptyField("Prompt", args.prompt);
    const correctAnswer = requireNonEmptyField(
      "Correct answer",
      args.correctAnswer,
    );
    const acceptedAnswers = sanitizeAnswerList(args.acceptedAnswers).filter(
      (value) => normalizeAnswer(value) !== normalizeAnswer(correctAnswer),
    );

    await Promise.all([
      ctx.db.patch(question._id, {
        acceptedAnswers,
        correctAnswer,
        pointValue: Math.max(1, Math.floor(args.pointValue)),
        prompt,
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const deleteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question, round } = await requireQuestionAdmin(
      ctx,
      args.questionId,
    );
    assertGameNotEnded(game);
    assertRoundEditable(round);

    const questions = await getQuestionsForRound(ctx, round._id);
    const remainingQuestions = questions.filter(
      (candidate) => candidate._id !== question._id,
    );
    const now = Date.now();

    await Promise.all([
      ctx.db.delete(question._id),
      ...remainingQuestions
        .filter((candidate) => candidate.order > question.order)
        .map((candidate) =>
          ctx.db.patch(candidate._id, {
            order: candidate.order - 1,
            updatedAt: now,
          }),
        ),
      ctx.db.patch(game._id, {
        questionCount: Math.max(0, game.questionCount - 1),
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const moveQuestion = mutation({
  args: {
    direction: v.union(v.literal("up"), v.literal("down")),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const { game, question, round } = await requireQuestionAdmin(
      ctx,
      args.questionId,
    );
    assertGameNotEnded(game);
    assertRoundEditable(round);

    const questions = await getQuestionsForRound(ctx, round._id);
    const currentIndex = questions.findIndex(
      (candidate) => candidate._id === question._id,
    );
    const targetIndex =
      args.direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= questions.length
    ) {
      return { success: true };
    }

    const targetQuestion = questions[targetIndex];
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

export const startRound = mutation({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const { game, round } = await requireRoundAdmin(ctx, args.roundId);
    assertGameNotEnded(game);

    if (game.status === "round_live") {
      if (game.currentRoundId === round._id) {
        throw new ConvexError("This round is already live.");
      }

      throw new ConvexError("Another round is already live.");
    }

    if (round.status !== "draft") {
      throw new ConvexError("Only draft rounds can be started.");
    }

    const questions = await getQuestionsForRound(ctx, round._id);
    if (questions.length === 0) {
      throw new ConvexError(
        "Add at least one question before starting a round.",
      );
    }

    const now = Date.now();

    await Promise.all([
      ctx.db.patch(round._id, {
        startedAt: now,
        status: "live",
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        currentRoundId: round._id,
        status: "round_live",
        updatedAt: now,
      }),
    ]);

    return { success: true };
  },
});

export const endRound = mutation({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const { game, round } = await requireRoundAdmin(ctx, args.roundId);

    if (game.status !== "round_live" || game.currentRoundId !== round._id) {
      throw new ConvexError("This round is not currently live.");
    }

    if (round.status !== "live") {
      throw new ConvexError("Only live rounds can be ended.");
    }

    const [players, questions] = await Promise.all([
      getPlayersForGame(ctx, game._id),
      getQuestionsForRound(ctx, round._id),
    ]);
    const playerById = new Map(players.map((player) => [player._id, player]));
    const playerScoreDeltas = new Map<
      Id<"players">,
      { correctCount: number; totalPoints: number }
    >();

    for (const question of questions) {
      const acceptedAnswers = buildAcceptedAnswers(question);
      const submissions = await getQuestionSubmissions(ctx, question._id);

      for (const submission of submissions) {
        const isCorrect = acceptedAnswers.has(submission.normalizedAnswer);
        const pointsAwarded = isCorrect ? question.pointValue : 0;

        await ctx.db.patch(submission._id, {
          isCorrect,
          pointsAwarded,
        });

        if (!isCorrect) {
          continue;
        }

        const currentTotals = playerScoreDeltas.get(submission.playerId) ?? {
          correctCount: 0,
          totalPoints: 0,
        };

        playerScoreDeltas.set(submission.playerId, {
          correctCount: currentTotals.correctCount + 1,
          totalPoints: currentTotals.totalPoints + question.pointValue,
        });
      }
    }

    await Promise.all(
      Array.from(playerScoreDeltas.entries()).map(([playerId, totals]) => {
        const player = playerById.get(playerId);
        if (!player) {
          return Promise.resolve();
        }

        return ctx.db.patch(playerId, {
          correctCount: player.correctCount + totals.correctCount,
          totalPoints: player.totalPoints + totals.totalPoints,
        });
      }),
    );

    const now = Date.now();

    await Promise.all([
      ctx.db.patch(round._id, {
        endedAt: now,
        status: "scored",
        updatedAt: now,
      }),
      ctx.db.patch(game._id, {
        currentRoundId: null,
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

    if (game.status === "ended") {
      throw new ConvexError("This game has already ended.");
    }

    if (game.status === "round_live") {
      throw new ConvexError("Finish the active round before ending the game.");
    }

    const rounds = await getRoundsForGame(ctx, game._id);
    if (!rounds.some((round) => round.status === "scored")) {
      throw new ConvexError("Score at least one round before ending the game.");
    }

    await ctx.db.patch(game._id, {
      currentRoundId: null,
      status: "ended",
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

    if (game.status === "ended") {
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
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const game = await getGameByJoinCode(
      ctx,
      args.joinCode.trim().toUpperCase(),
    );
    if (!game) {
      throw new ConvexError("Game not found.");
    }

    if (game.status !== "round_live" || !game.currentRoundId) {
      throw new ConvexError("There is no live round right now.");
    }

    const player = await getPlayerByToken(ctx, game._id, args.guestToken);
    if (!player) {
      throw new ConvexError("Join the game before submitting an answer.");
    }

    const [question, round] = await Promise.all([
      getQuestionById(ctx, args.questionId),
      getRoundById(ctx, game.currentRoundId),
    ]);

    if (question.gameId !== game._id || question.roundId !== round._id) {
      throw new ConvexError(
        "This question is not accepting answers right now.",
      );
    }

    if (round.status !== "live") {
      throw new ConvexError("This round is no longer accepting answers.");
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
