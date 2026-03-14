import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    creatorUserId: v.string(),
    title: v.string(),
    description: v.string(),
    joinCode: v.string(),
    joinPasswordHash: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("lobby"),
      v.literal("round_live"),
      v.literal("ended"),
    ),
    currentRoundId: v.union(v.id("rounds"), v.null()),
    questionCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator_user", ["creatorUserId"])
    .index("by_join_code", ["joinCode"]),

  rounds: defineTable({
    gameId: v.id("games"),
    title: v.string(),
    order: v.number(),
    status: v.union(v.literal("draft"), v.literal("live"), v.literal("scored")),
    startedAt: v.union(v.number(), v.null()),
    endedAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_order", ["gameId", "order"]),

  questions: defineTable({
    gameId: v.id("games"),
    roundId: v.id("rounds"),
    order: v.number(),
    prompt: v.string(),
    correctAnswer: v.string(),
    acceptedAnswers: v.array(v.string()),
    pointValue: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_round", ["roundId"])
    .index("by_round_order", ["roundId", "order"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    normalizedName: v.string(),
    guestToken: v.string(),
    totalPoints: v.number(),
    correctCount: v.number(),
    joinedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_name", ["gameId", "normalizedName"])
    .index("by_game_token", ["gameId", "guestToken"]),

  submissions: defineTable({
    gameId: v.id("games"),
    questionId: v.id("questions"),
    playerId: v.id("players"),
    answer: v.string(),
    normalizedAnswer: v.string(),
    isCorrect: v.union(v.boolean(), v.null()),
    pointsAwarded: v.union(v.number(), v.null()),
    submittedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_question", ["questionId"])
    .index("by_question_player", ["questionId", "playerId"])
    .index("by_player", ["playerId"]),
});
