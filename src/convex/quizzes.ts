import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QUIZ_STATUS } from "./schema";

/** Get all published quizzes (for students) */
export const getPublishedQuizzes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_status", (q) => q.eq("status", QUIZ_STATUS.PUBLISHED))
      .collect();
  },
});

/** Get all quizzes (for admin) */
export const getAllQuizzes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    return await ctx.db.query("quizzes").collect();
  },
});

/** Get a single quiz by ID (drafts are visible to admins only) */
export const getQuiz = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;
    if (quiz.status === QUIZ_STATUS.PUBLISHED) return quiz;

    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return null;

    return quiz;
  },
});

/** Get questions for a quiz (without correct answers for students) */
export const getQuizQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    const isAdmin = user?.role === "admin";

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return [];
    // Non-admins may only load the questions of a published quiz
    if (!isAdmin && quiz.status !== QUIZ_STATUS.PUBLISHED) return [];

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    // SECURITY: the answer key is only ever returned to an admin. Any other
    // caller (student, or any account without an admin role) gets a stripped
    // copy — this fails closed rather than open.
    if (isAdmin) return questions;

    return questions.map((q) => ({
      _id: q._id,
      quizId: q.quizId,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    }));
  },
});

/** Get questions for admin management (with correct answers) */
export const getQuizQuestionsForAdmin = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    return await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();
  },
});

/** Get questions with correct answers for result review (student must own the result) */
export const getQuizQuestionsForResultReview = query({
  args: { resultId: v.id("results") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify the result belongs to this student
    const result = await ctx.db.get(args.resultId);
    if (!result) return [];
    if (result.userId !== userId) return [];

    return await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", result.quizId))
      .collect();
  },
});

/** Create a new quiz */
export const createQuiz = mutation({
  args: {
    title: v.string(),
    totalMarks: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    // Server-side validation — the client is never the only guard.
    const title = args.title.trim();
    if (!title) throw new Error("Quiz title is required");
    if (!Number.isFinite(args.totalMarks) || args.totalMarks <= 0) {
      throw new Error("Total marks must be a positive number");
    }
    if (!Number.isFinite(args.duration) || args.duration <= 0) {
      throw new Error("Duration must be a positive number");
    }

    return await ctx.db.insert("quizzes", {
      title,
      totalMarks: args.totalMarks,
      duration: args.duration,
      status: QUIZ_STATUS.CREATED,
      createdBy: userId,
    });
  },
});

/** Update quiz details */
export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.string(),
    totalMarks: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.status !== QUIZ_STATUS.CREATED) {
      throw new Error("Only created quizzes can be edited");
    }

    const title = args.title.trim();
    if (!title) throw new Error("Quiz title is required");
    if (!Number.isFinite(args.totalMarks) || args.totalMarks <= 0) {
      throw new Error("Total marks must be a positive number");
    }
    if (!Number.isFinite(args.duration) || args.duration <= 0) {
      throw new Error("Duration must be a positive number");
    }

    await ctx.db.patch(args.quizId, {
      title,
      totalMarks: args.totalMarks,
      duration: args.duration,
    });
  },
});

/** Delete a quiz and its questions */
export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    // Refuse to delete a quiz that students have results for — otherwise those
    // results would be orphaned and show up as "Unknown" in the ledger.
    const existingResult = await ctx.db
      .query("results")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .first();
    if (existingResult) {
      throw new Error(
        "This quiz has student results and cannot be deleted.",
      );
    }

    // Delete all questions for this quiz
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();
    for (const q of questions) {
      await ctx.db.delete(q._id);
    }

    // Delete quiz
    await ctx.db.delete(args.quizId);
  },
});

/** Publish a quiz (only if it has at least one question) */
export const publishQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.status !== QUIZ_STATUS.CREATED) {
      throw new Error("Only created quizzes can be published");
    }

    // Check at least one question exists
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .first();

    if (!questions) {
      throw new Error(
        "This quiz cannot be published because it has no questions.",
      );
    }

    await ctx.db.patch(args.quizId, {
      status: QUIZ_STATUS.PUBLISHED,
    });
  },
});

/** Get quiz count for stats (admin dashboard only) */
export const getQuizStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { total: 0, published: 0, created: 0 };
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      return { total: 0, published: 0, created: 0 };
    }

    const all = await ctx.db.query("quizzes").collect();
    const published = all.filter((q) => q.status === QUIZ_STATUS.PUBLISHED);
    const created = all.filter((q) => q.status === QUIZ_STATUS.CREATED);
    return {
      total: all.length,
      published: published.length,
      created: created.length,
    };
  },
});
