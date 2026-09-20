import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QUIZ_STATUS } from "./schema";

/** Submit quiz and evaluate answers */
export const submitQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedAnswer: v.union(
          v.literal("A"),
          v.literal("B"),
          v.literal("C"),
          v.literal("D"),
          v.literal(""),
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "student") throw new Error("Not authorized");

    // Get or auto-create student profile (mutations CAN write)
    let student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!student) {
      const studentId = await ctx.db.insert("students", {
        userId,
        course: "General",
        semester: "1",
      });
      student = await ctx.db.get(studentId);
    }
    if (!student) throw new Error("Unable to create student profile");

    // Verify quiz exists and is published
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
      throw new Error("This quiz is not available for submission");
    }

    // Check if student already submitted this quiz
    const existingResult = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student!._id))
      .collect();
    const alreadySubmitted = existingResult.find(
      (r) => r.quizId === args.quizId
    );
    if (alreadySubmitted) {
      throw new Error("You have already submitted this quiz");
    }

    // Fetch all questions for evaluation
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Evaluate answers. Answers that do not belong to this quiz are discarded
    // so the stored result can only ever reference its own questions.
    const questionById = new Map(questions.map((q) => [q._id, q]));

    let correctCount = 0;
    const evaluatedAnswers = args.answers
      .filter((answer) => questionById.has(answer.questionId))
      .map((answer) => {
        const question = questionById.get(answer.questionId);
        const isCorrect =
          !!question && answer.selectedAnswer === question.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
        };
      });

    // Calculate score
    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * quiz.totalMarks)
        : 0;

    // Determine grade
    const percentage =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    let grade: string;
    if (percentage >= 90) grade = "A";
    else if (percentage >= 80) grade = "B";
    else if (percentage >= 70) grade = "C";
    else if (percentage >= 60) grade = "D";
    else grade = "F";

    // Store result
    const resultId = await ctx.db.insert("results", {
      studentId: student._id,
      userId: userId,
      quizId: args.quizId,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      grade,
      status: "Evaluated",
      answers: evaluatedAnswers,
    });

    return resultId;
  },
});

/** Get result by ID */
export const getResult = query({
  args: { resultId: v.id("results") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const result = await ctx.db.get(args.resultId);
    if (!result) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Students can only see their own results
    if (user.role === "student" && result.userId !== userId) {
      return null;
    }

    // Get quiz info
    const quiz = await ctx.db.get(result.quizId);

    return { ...result, quiz };
  },
});

/** Get all results for a student */
export const getStudentResults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    // If no student profile yet, they have no results
    if (!student) return [];

    const results = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    // Enrich with quiz info
    const enriched = await Promise.all(
      results.map(async (r) => {
        const quiz = await ctx.db.get(r.quizId);
        return { ...r, quiz };
      })
    );

    return enriched;
  },
});

/** Get all results (admin view) */
export const getAllResults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    const results = await ctx.db.query("results").collect();

    // Enrich with student and quiz info
    const enriched = await Promise.all(
      results.map(async (r) => {
        const student = await ctx.db.get(r.studentId);
        const quiz = await ctx.db.get(r.quizId);
        const studentUser = student ? await ctx.db.get(student.userId) : null;
        return {
          ...r,
          studentName: studentUser?.name ?? "Unknown",
          studentEmail: studentUser?.email ?? "Unknown",
          quizTitle: quiz?.title ?? "Unknown",
          totalMarks: quiz?.totalMarks ?? 0,
          course: student?.course ?? "",
          semester: student?.semester ?? "",
        };
      })
    );

    return enriched;
  },
});

/** Check if a student has already attempted a quiz */
export const hasAttemptedQuiz = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!student) return false;

    const results = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    return results.some((r) => r.quizId === args.quizId);
  },
});

/** Get result count for admin stats */
export const getResultStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { total: 0 };
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return { total: 0 };

    const results = await ctx.db.query("results").collect();
    return { total: results.length };
  },
});
