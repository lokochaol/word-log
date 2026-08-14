import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // Explicit so `account.providerAccountId` below is unambiguously
      // Google's `sub` — see the `jwt` callback for why that matters more
      // than this `id`.
      profile(profile) {
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
    async jwt({ token, account }) {
      // @auth/core intentionally randomizes `user.id` (and therefore the
      // default `token.sub`) on every sign-in when there's no database
      // adapter — see getUserAndAccount in
      // @auth/core/lib/actions/callback/oauth/callback.js: "The user's id
      // is intentionally not set based on the profile id, as the user
      // should remain independent of the provider". That's correct for
      // adapter-backed setups where a real DB user id gets resolved
      // instead, but for a JWT-only setup like this one it means every
      // login mints a fresh random identity, fragmenting one Google
      // account's data across sessions.
      //
      // `account.providerAccountId` — Google's actual, stable `sub` — is
      // still passed through correctly regardless. It's only present on
      // the initial sign-in (`account` is undefined on later requests
      // that just decode the existing JWT), so this only overrides
      // `token.sub` at sign-in time and otherwise leaves the
      // already-correct value from the token alone.
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.ownerSub = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
});
