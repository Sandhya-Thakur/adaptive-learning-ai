
// app/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardHelpers } from "@/lib/db/helpers";
import { 
  Brain,
  Target,
  Clock,
  Award
} from "lucide-react";

// Import optimized dashboard components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OptimizedStatsCard from "@/components/dashboard/StatsCard";
import OptimizedQuickStart from "@/components/dashboard/QuickStart";
import OptimizedSubjectProgress from "@/components/dashboard/SubjectProgress";
import OptimizedTodaysGoal from "@/components/dashboard/TodaysGoal";
import OptimizedRecentActivity from "@/components/dashboard/RecentActivity";
import OptimizedAchievements from "@/components/dashboard/Achievements";

export default async function Dashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Get current user from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser?.emailAddresses[0]?.emailAddress) {
    redirect("/");
  }

  const email = clerkUser.emailAddresses[0].emailAddress;
  
  try {
    // Ensure user exists in database
    let existingUser = await db.getUserByEmail(email);
    
    if (!existingUser) {
      // Create user in our database
      await db.createUser({
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Anonymous",
        email: email,
        current_subjects: [],
        knowledge_state: {},
        learning_velocity: {},
        optimal_difficulty: 0.5,
        study_streak: 0,
        total_questions_answered: 0,
      });
      console.log(`✅ User synced to database: ${email}`);
      
      // Fetch the newly created user
      existingUser = await db.getUserByEmail(email);
    }

    if (!existingUser) {
      throw new Error("Failed to create or fetch user");
    }

    // 🎯 FETCH REAL DATA using helper functions
    console.log("📊 Fetching real dashboard data...");
    
    const [
      realUserStats,
      realSubjectProgress,
      realRecentActivity,
      realAchievements
    ] = await Promise.all([
      DashboardHelpers.getUserStats(existingUser.id),
      DashboardHelpers.getSubjectProgress(existingUser.id),
      DashboardHelpers.getRecentActivity(existingUser.id, 5),
      DashboardHelpers.getUserAchievements(existingUser.id)
    ]);

    console.log("✅ Real data fetched:", {
      questions: realUserStats.totalQuestionsAnswered,
      accuracy: realUserStats.overallAccuracy,
      subjects: realSubjectProgress.length,
      activities: realRecentActivity.length
    });

    // Format study time for display
    const formatStudyTime = (minutes: number): string => {
      if (minutes === 0) return '0m';
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    };

    // Calculate today's goal progress (sessions completed today)
    const today = new Date().toDateString();
    const sessionsToday = realRecentActivity.filter(activity => 
      activity.time.includes('hour') && activity.type === 'quiz'
    ).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        {/* Header with real data */}
        <DashboardHeader 
          userName={clerkUser?.firstName || 'User'}
          currentStreak={realUserStats.currentStreak}
        />

        {/* Real Stats Cards */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Start */}
            <OptimizedQuickStart />

            {/* Real Subject Progress */}
            <OptimizedSubjectProgress subjects={realSubjectProgress} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Today's Goal with real progress */}
            <OptimizedTodaysGoal
              current={sessionsToday}
              target={5}
              label="Complete 5 quiz sessions"
            />

            {/* Real Recent Activity */}
            <OptimizedRecentActivity
              activities={realRecentActivity.map(activity => ({
                ...activity,
                type: activity.type as "quiz" | "session" | "achievement"
              }))}
            />

            {/* Real Achievements */}
            <OptimizedAchievements
              achievements={realAchievements.map(a => ({
                ...a,
                rarity:
                  a.rarity === "common" ||
                  a.rarity === "rare" ||
                  a.rarity === "epic"
                    ? a.rarity
                    : undefined
              }))}
            />
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold mb-2">🐛 Debug Info (Dev Only):</h3>
            <p>Total Sessions: {realUserStats.totalSessions}</p>
            <p>Average Session: {realUserStats.averageSessionDuration}min</p>
            <p>Subjects Tracked: {realSubjectProgress.map(s => s.subject).join(', ')}</p>
            <p>Recent Activities: {realRecentActivity.length}</p>
            <p>Earned Achievements: {realAchievements.filter(a => a.earned).length}</p>
          </div>
        )}
      </div>
    );

  } catch (error) {
    console.error("❌ Dashboard error:", error);
    
    // Fallback UI for errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <DashboardHeader 
          userName={clerkUser?.firstName || 'User'}
          currentStreak={0}
        />
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to AdaptiveLearn AI! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Ready to start your personalized learning journey? Take your first quiz to see your progress here.
          </p>
          <OptimizedQuickStart />
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <p className="text-red-800 text-sm">🐛 Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        )}
      </div>
    );
  }
}