// app/dashboard/page.tsx
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { DashboardHelpers } from "@/lib/db/helpers";
import { Brain, Target, Clock, Award } from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OptimizedStatsCard from "@/components/dashboard/StatsCard";
import OptimizedQuickStart from "@/components/dashboard/QuickStart";
import OptimizedSubjectProgress from "@/components/dashboard/SubjectProgress";
import OptimizedTodaysGoal from "@/components/dashboard/TodaysGoal";
import OptimizedRecentActivity from "@/components/dashboard/RecentActivity";
import OptimizedAchievements from "@/components/dashboard/Achievements";
import KnowledgeGraphDashboard from "@/components/dashboard/KnowledgeGraphDashboard";

export const revalidate = 0; // always fresh; or: export const dynamic = "force-dynamic";

function formatStudyTime(minutes: number): string {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default async function Dashboard() {
  noStore();

  const { userId } = await auth();
  if (!userId) redirect("/");

  // Prefer clerkClient when you already have userId
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect("/");

  try {
    // Ensure user exists (handle race via upsert if your db layer supports it)
    let existingUser = await db.getUserByEmail(email);
    if (!existingUser) {
      await db.createUser({
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
        email,
        current_subjects: [],
        knowledge_state: {},
        learning_velocity: {},
        optimal_difficulty: 0.5,
        study_streak: 0,
        total_questions_answered: 0,
      });
      existingUser = await db.getUserByEmail(email);
    }
    if (!existingUser) throw new Error("Failed to create or fetch user");

    // Fetch dashboard data
    const [realUserStats, realSubjectProgress, realRecentActivity, realAchievements] =
      await Promise.all([
        DashboardHelpers.getUserStats(existingUser.id),
        DashboardHelpers.getSubjectProgress(existingUser.id),
        DashboardHelpers.getRecentActivity(existingUser.id, 5),
        DashboardHelpers.getUserAchievements(existingUser.id),
      ]);

    // Compute today's goal using timestamps
    const sessionsToday = realRecentActivity.filter((a: any) => {
      // expect a.timestamp ISO string; adjust if your schema differs
      const when = a.timestamp ? new Date(a.timestamp) : null;
      return a.type === "quiz" && when && isToday(when);
    }).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <DashboardHeader
          userName={user.firstName || "User"}
          currentStreak={realUserStats.currentStreak}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <OptimizedStatsCard
            icon={Brain}
            label="Questions Answered"
            value={realUserStats.totalQuestionsAnswered}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={realUserStats.trends.questionsAnswered}
          />
          <OptimizedStatsCard
            icon={Target}
            label="Accuracy Rate"
            value={`${realUserStats.overallAccuracy}%`}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            trend={realUserStats.trends.accuracyRate}
          />
          <OptimizedStatsCard
            icon={Clock}
            label="Study Time"
            value={formatStudyTime(realUserStats.totalStudyTime)}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            trend={realUserStats.trends.studyTime}
          />
          <OptimizedStatsCard
            icon={Award}
            label="Level"
            value={realUserStats.userLevel}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <OptimizedQuickStart />
            <OptimizedSubjectProgress subjects={realSubjectProgress} />
          </div>

          <div className="space-y-6">
            <OptimizedTodaysGoal current={sessionsToday} target={5} label="Complete 5 quiz sessions" />
            <OptimizedRecentActivity
              activities={realRecentActivity.map((activity: any) => ({
                ...activity,
                type: (activity.type as "quiz" | "session" | "achievement") ?? "session",
              }))}
            />
          </div>
        </div>

        <div className="mt-8">
          <KnowledgeGraphDashboard userId={existingUser.id} />
        </div>

        <OptimizedAchievements
          achievements={realAchievements.map((a: any) => ({
            ...a,
            rarity: ["common", "rare", "epic"].includes(a.rarity) ? a.rarity : undefined,
          }))}
        />

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold mb-2">Debug Info (Dev Only):</h3>
            <p>Total Sessions: {realUserStats.totalSessions}</p>
            <p>Average Session: {realUserStats.averageSessionDuration}min</p>
            <p>Subjects Tracked: {realSubjectProgress.map((s: any) => s.subject).join(", ")}</p>
            <p>Recent Activities: {realRecentActivity.length}</p>
            <p>Earned Achievements: {realAchievements.filter((a: any) => a.earned).length}</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <DashboardHeader userName={user.firstName || "User"} currentStreak={0} />
        <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to AdaptiveLearn AI!</h2>
          <p className="text-gray-600 mb-6">
            Ready to start your personalized learning journey? Take your first quiz to see your progress here.
          </p>
          <OptimizedQuickStart />
        </div>
        <div className="mt-8">
          <KnowledgeGraphDashboard userId="new-user" />
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <p className="text-red-800 text-sm">
              Debug: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        )}
      </div>
    );
  }
}
