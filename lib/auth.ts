// lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (user.email) {
        // Check if user exists, create if not
        const existingUser = await db.getUserByEmail(user.email)
        if (!existingUser) {
          await db.createUser({
            name: user.name || '',
            email: user.email,
            current_subjects: [],
            knowledge_state: {},
            learning_velocity: {},
            optimal_difficulty: 0.5,
            study_streak: 0,
            total_questions_answered: 0
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const user = await db.getUserByEmail(session.user.email)
        if (user) {
          session.user.id = user.id
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
})