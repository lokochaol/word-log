import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // next-auth's Google provider has no built-in `profile()` mapper, so it
      // falls back to @auth/core's generic OIDC default: `id: profile.sub ??
      // profile.id ?? crypto.randomUUID()`. If `sub` were ever missing from
      // the ID token, that silently mints a brand-new random identity for
      // the sign-in instead of failing — which would fragment a real
      // account's data across logins with no visible error. Mapping `id`
      // to `profile.sub` explicitly, with no fallback, means a missing
      // `sub` fails loudly instead.
      profile(profile) {
        // TEMPORARY diagnostic logging for the "ownerSub changes every login"
        // report — check Vercel's Runtime Logs after a sign-in attempt.
        console.log("[auth-debug] google profile", {
          sub: profile.sub,
          email: profile.email,
          keys: Object.keys(profile),
        });
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, trigger }) {
      // TEMPORARY diagnostic logging — see the profile() log above.
      console.log("[auth-debug] jwt callback", { trigger, tokenSub: token.sub });
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.ownerSub = token.sub;
      console.log("[auth-debug] session callback", { tokenSub: token.sub, ownerSub: session.ownerSub });
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
});
