import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Only email/password sign-in is exposed. The templated Anonymous provider is
 * deliberately NOT registered: nothing in the product uses guest sign-in, and
 * leaving it enabled would let anyone mint an account with no credentials.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: (params.email as string) ?? "",
          name: (params.name as string) ?? "",
          // SECURITY: the role is NEVER taken from the client. Every new
          // account starts as a student. Admin access is granted only through
          // users.createAdminProfile, which is bootstrap-guarded on the server.
          role: "student" as const,
        };
      },
    }),
  ],
});
