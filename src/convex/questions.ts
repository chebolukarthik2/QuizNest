import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Add a question to a quiz */
export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    questionText: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    correctAnswer: v.union(
      v.literal("A"),
      v.literal("B"),
      v.literal("C"),
      v.literal("D")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Server-side validation — the client is never the only guard.
    const questionText = args.questionText.trim();
    const optionA = args.optionA.trim();
    const optionB = args.optionB.trim();
    const optionC = args.optionC.trim();
    const optionD = args.optionD.trim();

    if (!questionText) throw new Error("Question text is required");
    if (!optionA || !optionB || !optionC || !optionD) {
      throw new Error("All four options are required");
    }

    return await ctx.db.insert("questions", {
      quizId: args.quizId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: args.correctAnswer,
    });
  },
});

/** Update an existing question */
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    questionText: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    correctAnswer: v.union(
      v.literal("A"),
      v.literal("B"),
      v.literal("C"),
      v.literal("D")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    // Server-side validation — the client is never the only guard.
    const questionText = args.questionText.trim();
    const optionA = args.optionA.trim();
    const optionB = args.optionB.trim();
    const optionC = args.optionC.trim();
    const optionD = args.optionD.trim();

    if (!questionText) throw new Error("Question text is required");
    if (!optionA || !optionB || !optionC || !optionD) {
      throw new Error("All four options are required");
    }

    await ctx.db.patch(args.questionId, {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: args.correctAnswer,
    });
  },
});

/** Delete a question */
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    await ctx.db.delete(args.questionId);
  },
});
