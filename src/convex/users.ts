import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";

/** Get current signed-in user */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/** Get current user with their profile (student or admin) */
export const currentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    if (user.role === "student") {
      const student = await ctx.db
        .query("students")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      return { ...user, studentProfile: student ?? null };
    }

    if (user.role === "admin") {
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      return { ...user, adminProfile: admin ?? null };
    }

    return user;
  },
});

/** Ensure current user has a student profile — creates one if missing */
export const ensureStudentProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    // Auto-create profile for users who were registered before profile creation was added
    const studentId = await ctx.db.insert("students", {
      userId,
      course: "General",
      semester: "1",
    });

    // Also ensure the user role is set to student
    const user = await ctx.db.get(userId);
    if (user && !user.role) {
      await ctx.db.patch(userId, { role: "student" });
    }

    return studentId;
  },
});

/** Create or update student profile after registration */
export const createStudentProfile = mutation({
  args: {
    course: v.string(),
    semester: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check if profile already exists
    const existing = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        course: args.course,
        semester: args.semester,
      });
      return existing._id;
    }

    // Only set the role when it is unset — never demote an existing admin.
    if (!user.role) {
      await ctx.db.patch(userId, { role: "student" });
    }

    // Create student profile
    return await ctx.db.insert("students", {
      userId,
      course: args.course,
      semester: args.semester,
    });
  },
});

/** Update current user's profile details */
export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    course: v.optional(v.string()),
    semester: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Update name on the user record
    if (args.name !== undefined) {
      await ctx.db.patch(userId, { name: args.name });
    }

    // Update student profile fields. The row is created when missing so a save
    // can never report success while persisting nothing.
    if (user.role === "student") {
      const student = await ctx.db
        .query("students")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      const course = args.course?.trim();
      const semester = args.semester?.trim();

      if (student) {
        const patch: { course?: string; semester?: string } = {};
        if (course) patch.course = course;
        if (semester) patch.semester = semester;
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(student._id, patch);
        }
      } else {
        await ctx.db.insert("students", {
          userId,
          course: course || "General",
          semester: semester || "1",
        });
      }
    }

    // Update admin profile fields (same reasoning as above)
    if (user.role === "admin") {
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      const department = args.department?.trim();

      if (admin) {
        if (department) {
          await ctx.db.patch(admin._id, { department });
        }
      } else {
        await ctx.db.insert("admins", {
          userId,
          department: department || "General",
        });
      }
    }

    return userId;
  },
});

/** Create admin profile after admin registration */
export const createAdminProfile = mutation({
  args: {
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const isAlreadyAdmin = user.role === "admin";

    // SECURITY: only an existing admin may create or update an admin profile.
    // The single exception is a brand new deployment that has no admin at all
    // anywhere, which lets the project bootstrap its first administrator.
    // Without this guard any signed-in student could promote themselves.
    if (!isAlreadyAdmin) {
      const anyAdminUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .first();
      const anyAdminProfile = await ctx.db.query("admins").first();
      if (anyAdminUser || anyAdminProfile) {
        throw new Error("Not authorized to create an administrator profile");
      }
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        department: args.department.trim() || existing.department,
      });
      return existing._id;
    }

    // Only the bootstrapping first admin needs the role granted here.
    if (!isAlreadyAdmin) {
      await ctx.db.patch(userId, { role: "admin" });
    }

    // Create admin profile
    return await ctx.db.insert("admins", {
      userId,
      department: args.department.trim() || "General",
    });
  },
});

/** Internal helper to get current user */
const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
};
