import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial login — store tokens, expiry, and curator status
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = Date.now() + (account.expires_in as number) * 1000;

        // Check curator status once at login
        const email = profile?.email;
        if (email) {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/curators?email=eq.${encodeURIComponent(email)}&select=id`,
              {
                headers: {
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                },
              }
            );
            const curators = await res.json();
            token.isCurator = Array.isArray(curators) && curators.length > 0;
          } catch {
            token.isCurator = false;
          }
        } else {
          token.isCurator = false;
        }

        return token;
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expired — refresh it
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw data;

        token.accessToken = data.access_token;
        token.accessTokenExpires = Date.now() + data.expires_in * 1000;
        // Google may rotate refresh tokens
        if (data.refresh_token) {
          token.refreshToken = data.refresh_token;
        }
        delete token.error;
      } catch {
        token.error = "RefreshAccessTokenError";
      }

      return token;
    },
    async session({ session, token }) {
      (session as unknown as { accessToken: string }).accessToken =
        token.accessToken as string;
      (session as unknown as { error?: string }).error =
        token.error as string | undefined;
      (session as unknown as { isCurator: boolean }).isCurator =
        token.isCurator as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
