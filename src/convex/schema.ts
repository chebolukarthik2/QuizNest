import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// OQMS roles: student and admin only
export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.ADMIN),
);
export type Role = Infer<typeof roleValidator>;

// Quiz status lifecycle
export const QUIZ_STATUS = {
  CREATED: "Created",
  PUBLISHED: "Published",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
  EVALUATED: "Evaluated",
} as const;

export const quizStatusValidator = v.union(
  v.literal(QUIZ_STATUS.CREATED),
  v.literal(QUIZ_STATUS.PUBLISHED),
  v.literal(QUIZ_STATUS.IN_PROGRESS),
  v.literal(QUIZ_STATUS.COMPLETED),
  v.literal(QUIZ_STATUS.EVALUATED),
);

// Correct answer options
export const answerValidator = v.union(
  v.literal("A"),
  v.literal("B"),
  v.literal("C"),
  v.literal("D"),
);

const schema = defineSchema(
  {
    // Auth tables (do not remove)
    ...authTables,

    // Users table (extends auth users)
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Student profile table
    students: defineTable({
      userId: v.id("users"),
      course: v.string(),
      semester: v.string(),
    }).index("by_userId", ["userId"]),

    // Admin profile table
    admins: defineTable({
      userId: v.id("users"),
      department: v.string(),
    }).index("by_userId", ["userId"]),

    // Quizzes table
    quizzes: defineTable({
      title: v.string(),
      totalMarks: v.number(),
      duration: v.number(), // duration in minutes
      status: quizStatusValidator,
      createdBy: v.id("users"),
    }).index("by_status", ["status"])
      .index("by_createdBy", ["createdBy"]),

    // Questions table
    questions: defineTable({
      quizId: v.id("quizzes"),
      questionText: v.string(),
      optionA: v.string(),
      optionB: v.string(),
      optionC: v.string(),
      optionD: v.string(),
      correctAnswer: answerValidator,
    }).index("by_quizId", ["quizId"]),

    // Results table
    results: defineTable({
      studentId: v.id("students"),
      userId: v.id("users"),
      quizId: v.id("quizzes"),
      score: v.number(),
      totalQuestions: v.number(),
      correctAnswers: v.number(),
      grade: v.string(),
      status: v.string(),
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
          isCorrect: v.boolean(),
        })
      ),
    }).index("by_studentId", ["studentId"])
      .index("by_quizId", ["quizId"])
      .index("by_userId", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
