// app/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  Brain,
  BarChart3,
  Calendar,
  Zap,
  Star
} from "lucide-react";

export default async function Dashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Get current user from Clerk
  const clerkUser = await currentUser();
  
  if (clerkUser) {
    // Check if user exists in our database, create if not
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (email) {
      try {
        const existingUser = await db.getUserByEmail(email);
        
        if (!existingUser) {
          // Create user in our database
          await db.createUser({
            name:
              `${clerkUser.firstName || ""} ${
                clerkUser.lastName || ""
              }`.trim() || "Anonymous",
            email: email,
            current_subjects: [],
            knowledge_state: {},
            learning_velocity: {},
            optimal_difficulty: 0.5,
            study_streak: 0,
            total_questions_answered: 0,
          });
          console.log(`✅ User synced to database: ${email}`);
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Learning Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {clerkUser?.firstName}! Ready to learn today?</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Streak</p>
            <p className="text-2xl font-bold text-orange-600">7 days</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Questions Answered</p>
              <p className="text-2xl font-bold text-gray-800">127</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Accuracy Rate</p>
              <p className="text-2xl font-bold text-gray-800">85%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-800">2.5h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-2xl font-bold text-gray-800">Intermediate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Start */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Zap className="h-6 w-6 text-blue-600 mr-2" />
              Quick Start
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/quiz/setup">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105">
                  <BookOpen className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Start Quiz</h3>
                  <p className="text-blue-100">Choose your subject and begin adaptive learning</p>
                </div>
              </Link>

              <Link href="/ai-test">
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                  <Brain className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">AI Test</h3>
                  <p className="text-purple-100">Test the AI question generation</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Subject Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
              Subject Progress
            </h2>
            
            <div className="space-y-4">
              {[
                { subject: 'Mathematics', progress: 85, color: 'bg-blue-500', nextTopic: 'Quadratic Equations' },
                { subject: 'Science', progress: 72, color: 'bg-green-500', nextTopic: 'Chemical Reactions' },
                { subject: 'History', progress: 68, color: 'bg-purple-500', nextTopic: 'World War II' },
                { subject: 'English', progress: 91, color: 'bg-orange-500', nextTopic: 'Shakespeare' }
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{item.subject}</h3>
                    <span className="text-sm text-gray-600">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`${item.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">Next: {item.nextTopic}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Today's Goal */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="h-5 w-5 text-red-500 mr-2" />
              Today's Goal
            </h3>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-500 text-white font-bold text-xl mb-3">
                3/5
              </div>
              <p className="text-sm text-gray-600">Complete 5 quiz sessions</p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { action: 'Completed Math Quiz', score: '8/10', time: '2 hours ago', color: 'text-green-600' },
                { action: 'Started Science Session', score: '6/8', time: '1 day ago', color: 'text-blue-600' },
                { action: 'Mastered Topic', score: 'Algebra', time: '2 days ago', color: 'text-purple-600' }
              ].map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`font-semibold text-sm ${activity.color}`}>
                    {activity.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              Achievements
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Quick Learner', desc: 'Answered 10 questions in under 5 minutes', earned: true },
                { title: 'Streak Master', desc: 'Maintained 7-day learning streak', earned: true },
                { title: 'Perfect Score', desc: 'Get 100% on any quiz', earned: false }
              ].map((achievement, index) => (
                <div key={index} className={`flex items-center p-3 rounded-lg ${
                  achievement.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}>
                  <div className={`p-2 rounded-full ${
                    achievement.earned ? 'bg-yellow-100' : 'bg-gray-200'
                  }`}>
                    <Award className={`h-4 w-4 ${
                      achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium text-sm ${
                      achievement.earned ? 'text-yellow-800' : 'text-gray-600'
                    }`}>
                      {achievement.title}
                    </p>
                    <p className={`text-xs ${
                      achievement.earned ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {achievement.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}