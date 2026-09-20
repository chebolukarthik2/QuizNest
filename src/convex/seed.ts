import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Seed demo quiz data. Must be called by an admin.
 * Creates a Java Programming Basics quiz with 10 questions.
 */
export const seedDemoQuiz = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    // Check if already seeded
    const existing = await ctx.db.query("quizzes").collect();
    if (existing.some((q) => q.title === "Java Programming Basics")) {
      throw new Error("Demo quiz already exists");
    }

    const quizId = await ctx.db.insert("quizzes", {
      title: "Java Programming Basics",
      totalMarks: 10,
      duration: 15,
      status: "Published",
      createdBy: userId,
    });

    const questions = [
      {
        questionText: "Which of the following is not a primitive data type in Java?",
        optionA: "int",
        optionB: "boolean",
        optionC: "String",
        optionD: "char",
        correctAnswer: "C" as const,
      },
      {
        questionText: "What is the default value of an int variable in Java?",
        optionA: "null",
        optionB: "0",
        optionC: "1",
        optionD: "undefined",
        correctAnswer: "B" as const,
      },
      {
        questionText: "Which keyword is used to create a class in Java?",
        optionA: "struct",
        optionB: "class",
        optionC: "define",
        optionD: "object",
        correctAnswer: "B" as const,
      },
      {
        questionText: "Which method is the entry point of a Java application?",
        optionA: "start()",
        optionB: "init()",
        optionC: "main()",
        optionD: "run()",
        correctAnswer: "C" as const,
      },
      {
        questionText: "What does JVM stand for?",
        optionA: "Java Virtual Machine",
        optionB: "Java Variable Manager",
        optionC: "Java Version Manager",
        optionD: "Java Visual Mapper",
        correctAnswer: "A" as const,
      },
      {
        questionText: "What is used to handle memory management in Java?",
        optionA: "Pointer",
        optionB: "Garbage Collector",
        optionC: "Reference Counting",
        optionD: "Manual Deallocation",
        correctAnswer: "B" as const,
      },
      {
        questionText: "What is the correct way to declare an array in Java?",
        optionA: "int[] arr = new int[5];",
        optionB: "int arr[] = new int(5);",
        optionC: "int[] arr = new int(5);",
        optionD: "array int[5] = new int[];",
        correctAnswer: "A" as const,
      },
      {
        questionText: "Which package is imported by default in every Java program?",
        optionA: "java.io",
        optionB: "java.util",
        optionC: "java.lang",
        optionD: "java.net",
        correctAnswer: "C" as const,
      },
      {
        questionText: "What is the size of a boolean variable in Java?",
        optionA: "1 byte",
        optionB: "2 bytes",
        optionC: "4 bytes",
        optionD: "Depends on the JVM",
        correctAnswer: "D" as const,
      },
      {
        questionText: "Which of the following is a valid Java comment?",
        optionA: "// This is a comment",
        optionB: "/* This is a comment",
        optionC: "# This is a comment",
        optionD: "-- This is a comment",
        correctAnswer: "A" as const,
      },
    ];

    for (const q of questions) {
      await ctx.db.insert("questions", { quizId, ...q });
    }

    return { quizId, questionsCount: questions.length };
  },
});
