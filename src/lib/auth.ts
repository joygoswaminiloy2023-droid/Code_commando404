import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user: any = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;
        if (user.isBlocked) {
          throw new Error("Your account has been blocked. Contact your admin.");
        }
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          avatarColor: user.avatarColor,
          avatarUrl: user.avatarUrl
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.title = (user as any).title;
        token.avatarColor = (user as any).avatarColor;
        token.avatarUrl = (user as any).avatarUrl;
      }
      // Allow the client to push a fresh avatar/title into the JWT after a
      // profile update without forcing a full re-login.
      if (trigger === "update" && session) {
        if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
        if (session.title !== undefined) token.title = session.title;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).title = token.title;
        (session.user as any).avatarColor = token.avatarColor;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
