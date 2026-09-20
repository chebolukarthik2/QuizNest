import type { AuthConfig } from "convex/server";

// QuizNest's own Convex Auth provider (email/password sign-in, see
// src/convex/auth.ts). The deployment self-issues JWTs (iss =
// CONVEX_SITE_URL) validated via OIDC discovery at
// `${domain}/.well-known/openid-configuration`, served by
// auth.addHttpRoutes() in convex/http.ts.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
