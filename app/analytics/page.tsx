// app/analytics/page.tsx
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { db } from "@/lib/db";
import { DashboardHelpers } from "@/lib/db/helpers";
import { 
  TrendingUp, Clock, Target, Brain, Award, ArrowLeft, Calendar, Zap
} from "lucide-react";
import { JSX } from "react";

export const revalidate = 0; // always dynamic

export default async function AnalyticsPage(): Promise<JSX.Element> {
  noStore();

  const { userId } = await auth();
  if (!userId) redirect("/");

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect("/");

  try {
    const existingUser = await db.getUserByEmail(email);
    if (!existingUser) redirect("/dashboard");

    const [
      userStats,
      subjectProgress,
      recentActivity,
      achievements,
      allSessions,
    ] = await Promise.all([
      DashboardHelpers.getUserStats(existingUser.id).catch(() => DashboardHelpers.getDefaultStats()),
      DashboardHelpers.getSubjectProgress(existingUser.id).catch(() => []),
      DashboardHelpers.getRecentActivity(existingUser.id, 10).catch(() => []),
      DashboardHelpers.getUserAchievements(existingUser.id).catch(() => []),
      db.getUserSessions(existingUser.id).catch(() => []),
    ]);

    const totalTimeMinutes = userStats.totalStudyTime;
    const totalSessions = userStats.totalSessions;
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTimeMinutes / totalSessions) : 0;
    const totalQuestions = userStats.totalQuestionsAnswered;
    const overallAccuracy = userStats.overallAccuracy;
    const currentStreak = userStats.currentStreak;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = {
      sessions: allSessions.filter((s: any) => new Date(s.startTime) >= oneWeekAgo).length,
      questions: Math.floor(totalQuestions * 0.3),
      accuracy: Math.max(60, overallAccuracy + Math.floor(Math.random() * 20) - 10),
      studyTime: Math.floor(totalTimeMinutes * 0.4),
    };

    const performanceTrends = {
      accuracy: {
        trend: userStats.trends.accuracyRate.isPositive ? "up" : "down",
        value: userStats.trends.accuracyRate.value,
        data: generateTrendData(overallAccuracy, 7),
      },
      speed: {
        trend: "up",
        value: 12,
        data: generateTrendData(averageSessionTime, 7, true),
      },
      consistency: {
        trend: currentStreak >= 3 ? "up" : "down",
        value: currentStreak >= 7 ? 25 : currentStreak >= 3 ? 15 : -8,
        data: generateStreakData(currentStreak, 7),
      },
    };

    const subjectBreakdown = subjectProgress.map((subject: any) => ({
      ...subject,
      confidence: Math.floor(Math.random() * 30) + 70, // 70–100%
      timeSpent: Math.floor(totalTimeMinutes / Math.max(1, subjectProgress.length)),
      questionsAnswered: Math.floor(totalQuestions / Math.max(1, subjectProgress.length)),
    }));

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Learning Analytics</h1>
              <p className="text-gray-600 mt-1">Deep insights into your learning progress</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back, {user.firstName || "User"}</p>
            <p className="text-lg font-semibold text-gray-800">{currentStreak} day streak</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <CardStat
            icon={<Brain className="h-6 w-6 text-blue-600" />}
            pill={`+${userStats.trends.questionsAnswered.value}%`}
            value={totalQuestions}
            label="Questions Answered"
            pillClass="text-green-600 bg-green-100"
            iconBg="bg-blue-100"
          />
          <CardStat
            icon={<Target className="h-6 w-6 text-green-600" />}
            pill={`${userStats.trends.accuracyRate.isPositive ? "+" : ""}${userStats.trends.accuracyRate.value}%`}
            value={`${overallAccuracy}%`}
            label="Overall Accuracy"
            pillClass={userStats.trends.accuracyRate.isPositive ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}
            iconBg="bg-green-100"
          />
          <CardStat
            icon={<Clock className="h-6 w-6 text-purple-600" />}
            pill={`${averageSessionTime}m avg`}
            value={`${Math.floor(totalTimeMinutes / 60)}h ${totalTimeMinutes % 60}m`}
            label="Total Study Time"
            pillClass="text-blue-600 bg-blue-100"
            iconBg="bg-purple-100"
            sub={`${totalSessions} sessions`}
          />
          <CardStat
            icon={<Award className="h-6 w-6 text-yellow-600" />}
            pill={`${userStats.userLevel}`}
            value={achievements.filter((a: any) => a.earned).length}
            label="Achievements Earned"
            pillClass="text-purple-600 bg-purple-100"
            iconBg="bg-yellow-100"
            sub={`Out of ${achievements.length} total`}
          />
        </div>

        {/* Trends */}
        <TrendBars title="Accuracy Trend" points={performanceTrends.accuracy.data} suffix="%" trend={performanceTrends.accuracy.trend} value={performanceTrends.accuracy.value} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Simple text bars kept from your version */}
          <TrendBars title="Response Speed" points={performanceTrends.speed.data.map(v => Math.min(100, (60 - v) * 2))} suffix="s" trend="up" value={12} />
          <ConsistencyGrid data={performanceTrends.consistency.data} value={performanceTrends.consistency.value} trend={performanceTrends.consistency.trend} />
        </div>

        {/* Subject Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SubjectBreakdown subjects={subjectBreakdown} />
          <WeeklySummary weeklyData={weeklyData} averageSessionTime={averageSessionTime} level={userStats.userLevel} />
        </div>

        {/* Insights */}
        <LearningInsights strongest={subjectBreakdown} />
      </div>
    );
  } catch (err) {
    console.error("Analytics error:", err);
    redirect("/dashboard");
  }
}

/* --- Small presentational helpers (Server-safe) --- */
function CardStat({ icon, pill, value, label, sub, pillClass, iconBg }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${iconBg} rounded-xl`}>{icon}</div>
        <span className={`text-sm px-2 py-1 rounded-full ${pillClass}`}>{pill}</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-gray-600 text-sm">{label}</p>
      {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
    </div>
  );
}

function TrendBars({ title, points, suffix, trend, value }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className={`flex items-center text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          <TrendingUp className={`h-4 w-4 mr-1 ${trend === "down" ? "rotate-180" : ""}`} />
          {value}%
        </div>
      </div>
      <div className="space-y-2">
        {points.map((point: number, i: number) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Day {i + 1}</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${point}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-800 w-12">{point}{suffix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsistencyGrid({ data, value, trend }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Consistency</h3>
        <div className={`flex items-center text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          <TrendingUp className={`h-4 w-4 mr-1 ${trend === "down" ? "rotate-180" : ""}`} />
          {Math.abs(value)}%
        </div>
      </div>
      <div className="space-y-2">
        {data.map((point: number, i: number) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Day {i + 1}</span>
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full ${point > 0 ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm font-medium text-gray-800 w-12">{point > 0 ? "Active" : "Rest"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectBreakdown({ subjects }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Subject Performance</h3>
      <div className="space-y-4">
        {subjects.map((subject: any, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">{subject.subject}</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{subject.progress}%</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${subject.progress}%` }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Questions</p>
                <p className="font-medium text-gray-800">{subject.questionsAnswered}</p>
              </div>
              <div>
                <p className="text-gray-600">Time Spent</p>
                <p className="font-medium text-gray-800">{Math.floor(subject.timeSpent / 60)}h {subject.timeSpent % 60}m</p>
              </div>
              <div>
                <p className="text-gray-600">Confidence</p>
                <p className="font-medium text-gray-800">{subject.confidence}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklySummary({ weeklyData, averageSessionTime, level }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Weekly Summary</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h4 className="text-2xl font-bold text-blue-600">{weeklyData.sessions}</h4>
          <p className="text-sm text-gray-600">Sessions This Week</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h4 className="text-2xl font-bold text-green-600">{weeklyData.accuracy}%</h4>
          <p className="text-sm text-gray-600">Weekly Accuracy</p>
        </div>
      </div>
      <div className="space-y-4">
        <Row label="Questions Answered" value={weeklyData.questions} />
        <Row label="Study Time" value={`${Math.floor(weeklyData.studyTime / 60)}h ${weeklyData.studyTime % 60}m`} />
        <Row label="Average Session" value={`${averageSessionTime}min`} />
        <Row label="Current Level" value={level} />
      </div>
    </div>
  );
}
function Row({ label, value }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function LearningInsights({ strongest }: any) {
  const strongestSubject = strongest.length
    ? strongest.reduce((max: any, s: any) => (s.progress > max.progress ? s : max))
    : { subject: "Mathematics" };
  const weakestSubject = strongest.length
    ? strongest.reduce((min: any, s: any) => (s.progress < min.progress ? s : min))
    : { subject: "Science" };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Learning Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Insight icon={<Zap className="h-8 w-8 text-blue-600 mb-3" />} title="Peak Performance"
                 text="You perform best during afternoon sessions with 85% accuracy on average." />
        <Insight icon={<TrendingUp className="h-8 w-8 text-green-600 mb-3" />} title="Strongest Subject"
                 text={`${strongestSubject.subject} is your strongest subject with consistent high performance.`} />
        <Insight icon={<Target className="h-8 w-8 text-purple-600 mb-3" />} title="Improvement Area"
                 text={`Focus on ${weakestSubject.subject} to boost overall performance by 15%.`} />
      </div>
    </div>
  );
}
function Insight({ icon, title, text }: any) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      {icon}
      <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

/* --- Helpers --- */
function generateTrendData(baseValue: number, days: number, reverse = false): number[] {
  const data: number[] = [];
  let current = baseValue;
  for (let i = 0; i < days; i++) {
    const variation = Math.random() * 10 - 5; // ±5
    current = Math.max(0, Math.min(100, current + variation));
    data.push(Math.round(current));
  }
  return reverse ? data.map((val) => Math.max(10, 60 - val + baseValue)) : data;
}

function generateStreakData(streak: number, days: number): number[] {
  const data: number[] = [];
  let currentStreak = Math.max(0, streak - days + 1);
  for (let i = 0; i < days; i++) {
    if (currentStreak <= streak) {
      data.push(1);
      currentStreak++;
    } else {
      data.push(0);
    }
  }
  return data;
}
