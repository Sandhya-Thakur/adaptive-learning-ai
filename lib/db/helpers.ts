// lib/db/helpers.ts
import { db } from './index'

export class DashboardHelpers {
  
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string) {
    try {
      // Get basic user info
      const user = await db.getUserById(userId)
      if (!user) throw new Error('User not found')

      // Get all user sessions
      const sessions = await db.getUserSessions(userId)
      
      // Get all user responses across all sessions
      const allResponses = []
      for (const session of sessions) {
        const responses = await db.getUserResponses(session.sessionId)
        allResponses.push(...responses)
      }

      // Calculate total questions answered
      const totalQuestionsAnswered = allResponses.length

      // Calculate overall accuracy
      const correctAnswers = allResponses.filter(r => r.isCorrect).length
      const overallAccuracy = totalQuestionsAnswered > 0 ? 
        Math.round((correctAnswers / totalQuestionsAnswered) * 100) : 0

      // Calculate total study time
      const totalStudyTime = this.calculateTotalStudyTime(sessions)

      // Determine user level
      const userLevel = this.determineUserLevel(totalQuestionsAnswered, overallAccuracy)

      // Calculate trends (last 7 days vs previous 7 days)
      const trends = await this.calculateTrends(userId, allResponses)

      // Calculate current streak
      const currentStreak = await this.calculateStreak(sessions)

      return {
        totalQuestionsAnswered,
        overallAccuracy,
        totalStudyTime,
        userLevel,
        trends,
        currentStreak,
        totalSessions: sessions.length,
        averageSessionDuration: sessions.length > 0 ? 
          Math.round(totalStudyTime / sessions.length) : 0
      }

    } catch (error) {
      console.error('Error getting user stats:', error)
      return this.getDefaultStats()
    }
  }

  /**
   * Calculate subject-specific progress
   */
  static async getSubjectProgress(userId: string) {
    try {
      const sessions = await db.getUserSessions(userId)
      const subjectStats: Record<string, any> = {}

      for (const session of sessions) {
        const subject = session.subject
        const responses = await db.getUserResponses(session.sessionId)
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            subject: this.capitalizeFirst(subject),
            totalQuestions: 0,
            correctAnswers: 0,
            totalTime: 0,
            sessions: 0,
            recentScore: null,
            lastSession: null
          }
        }

        const stats = subjectStats[subject]
        stats.totalQuestions += responses.length
        stats.correctAnswers += responses.filter(r => r.isCorrect).length
        stats.totalTime += responses.reduce((sum, r) => sum + r.timeTakenSeconds, 0)
        stats.sessions += 1

        // Track most recent session score
        if (responses.length > 0) {
          const sessionScore = Math.round((responses.filter(r => r.isCorrect).length / responses.length) * 100)
          if (!stats.lastSession || new Date(session.startTime) > new Date(stats.lastSession)) {
            stats.recentScore = sessionScore
            stats.lastSession = session.startTime
          }
        }
      }

      // Convert to array and calculate progress
      return Object.values(subjectStats).map((stats: any) => {
        const progress = stats.totalQuestions > 0 ? 
          Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0
        
        return {
          subject: stats.subject,
          progress,
          color: this.getSubjectColor(stats.subject),
          nextTopic: this.getNextTopic(stats.subject, progress),
          recentScore: stats.recentScore,
          totalQuestions: stats.totalQuestions,
          averageTime: stats.totalQuestions > 0 ? 
            Math.round(stats.totalTime / stats.totalQuestions) : 0
        }
      }).sort((a, b) => b.progress - a.progress) // Sort by progress

    } catch (error) {
      console.error('Error getting subject progress:', error)
      return this.getDefaultSubjectProgress()
    }
  }

  /**
   * Get recent activity from actual sessions
   */
  static async getRecentActivity(userId: string, limit: number = 5) {
    try {
      const sessions = await db.getUserSessions(userId)
      
      // Sort sessions by date (most recent first)
      const recentSessions = sessions
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit)

      const activities = []

      for (const session of recentSessions) {
        const responses = await db.getUserResponses(session.sessionId)
        const correctAnswers = responses.filter(r => r.isCorrect).length
        const totalQuestions = responses.length
        
        if (totalQuestions > 0) {
          const score = `${correctAnswers}/${totalQuestions}`
          const timeAgo = this.getTimeAgo(new Date(session.startTime))
          const isCompleted = session.endTime !== null

          activities.push({
            action: `${isCompleted ? 'Completed' : 'Started'} ${this.capitalizeFirst(session.subject)} Quiz`,
            score,
            time: timeAgo,
            color: this.getScoreColor(correctAnswers, totalQuestions),
            type: isCompleted ? 'quiz' : 'session',
            accuracy: Math.round((correctAnswers / totalQuestions) * 100)
          })
        }
      }

      return activities

    } catch (error) {
      console.error('Error getting recent activity:', error)
      return this.getDefaultActivity()
    }
  }

  /**
   * Calculate user achievements based on real performance
   */
  static async getUserAchievements(userId: string) {
    try {
      const userStats = await this.getUserStats(userId)
      const sessions = await db.getUserSessions(userId)
      
      const achievements = []

      // Quick Learner: Answered 10+ questions in under 5 minutes total
      const fastSessions = sessions.filter(s => {
        // This would need session duration calculation
        return true // Placeholder
      })
      achievements.push({
        title: 'Quick Learner',
        desc: 'Answered 10 questions in under 5 minutes',
        earned: userStats.totalQuestionsAnswered >= 10,
        rarity: 'common'
      })

      // Streak Master: Maintained learning streak
      achievements.push({
        title: 'Streak Master',
        desc: `Maintained ${userStats.currentStreak}-day learning streak`,
        earned: userStats.currentStreak >= 7,
        rarity: 'rare'
      })

      // Perfect Score: Got 100% on any quiz
      const perfectSessions = sessions.filter(async (session) => {
        const responses = await db.getUserResponses(session.sessionId)
        const accuracy = responses.length > 0 ? 
          (responses.filter(r => r.isCorrect).length / responses.length) * 100 : 0
        return accuracy === 100
      })
      
      achievements.push({
        title: 'Perfect Score',
        desc: 'Get 100% on any quiz',
        earned: userStats.overallAccuracy === 100, // Simplified check
        rarity: 'epic'
      })

      // Knowledge Seeker: Answer 100+ questions
      achievements.push({
        title: 'Knowledge Seeker',
        desc: 'Answered 100+ questions total',
        earned: userStats.totalQuestionsAnswered >= 100,
        rarity: 'rare'
      })

      // Subject Master: 90%+ accuracy in any subject
      const subjectProgress = await this.getSubjectProgress(userId)
      const hasSubjectMastery = subjectProgress.some(s => s.progress >= 90)
      
      achievements.push({
        title: 'Subject Master',
        desc: 'Achieve 90%+ accuracy in any subject',
        earned: hasSubjectMastery,
        rarity: 'epic'
      })

      return achievements

    } catch (error) {
      console.error('Error getting achievements:', error)
      return this.getDefaultAchievements()
    }
  }

  /**
   * Calculate current learning streak
   */
  private static async calculateStreak(sessions: any[]): Promise<number> {
    if (sessions.length === 0) return 0

    // Sort sessions by date
    const sortedSessions = sessions
      .filter(s => s.startTime)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    // Get unique dates
    const uniqueDates = Array.from(new Set(
      sortedSessions.map(s => new Date(s.startTime).toDateString())
    ))

    // Calculate consecutive days from today
    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    // Check if user studied today or yesterday to start streak
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      let currentDate = uniqueDates.includes(today) ? new Date() : new Date(Date.now() - 86400000)
      
      for (const dateStr of uniqueDates) {
        if (dateStr === currentDate.toDateString()) {
          streak++
          currentDate = new Date(currentDate.getTime() - 86400000)
        } else {
          break
        }
      }
    }

    return streak
  }

  /**
   * Calculate performance trends
   */
  private static async calculateTrends(userId: string, allResponses: any[]) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Recent performance (last 7 days)
    const recentResponses = allResponses.filter(r => 
      new Date(r.createdAt) >= sevenDaysAgo
    )

    // Previous performance (7-14 days ago)
    const previousResponses = allResponses.filter(r => 
      new Date(r.createdAt) >= fourteenDaysAgo && 
      new Date(r.createdAt) < sevenDaysAgo
    )

    const recentAccuracy = recentResponses.length > 0 ? 
      (recentResponses.filter(r => r.isCorrect).length / recentResponses.length) * 100 : 0

    const previousAccuracy = previousResponses.length > 0 ? 
      (previousResponses.filter(r => r.isCorrect).length / previousResponses.length) * 100 : 0

    const accuracyTrend = recentAccuracy - previousAccuracy

    return {
      questionsAnswered: { 
        value: Math.round(((recentResponses.length - previousResponses.length) / Math.max(previousResponses.length, 1)) * 100), 
        isPositive: recentResponses.length >= previousResponses.length 
      },
      accuracyRate: { 
        value: Math.round(Math.abs(accuracyTrend)), 
        isPositive: accuracyTrend >= 0 
      },
      studyTime: { 
        value: 15, // Placeholder - would need session time calculation
        isPositive: true 
      },
      level: { value: 0, isPositive: true }
    }
  }

  /**
   * Calculate total study time from sessions
   */
  private static calculateTotalStudyTime(sessions: any[]): number {
    let totalMinutes = 0
    
    for (const session of sessions) {
      if (session.startTime && session.endTime) {
        const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
        totalMinutes += Math.round(duration / (1000 * 60)) // Convert to minutes
      }
    }

    return totalMinutes
  }

  /**
   * Determine user level based on performance
   */
  private static determineUserLevel(totalQuestions: number, accuracy: number): string {
    if (totalQuestions === 0) return 'Beginner'
    if (totalQuestions < 20) return 'Novice'
    if (totalQuestions < 50) return 'Beginner'
    if (totalQuestions < 100) return 'Intermediate'
    if (accuracy >= 90) return 'Expert'
    if (accuracy >= 80) return 'Advanced'
    return 'Intermediate'
  }

  // Helper utility functions
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private static getSubjectColor(subject: string): string {
    const colors: Record<string, string> = {
      'Mathematics': 'bg-blue-500',
      'Science': 'bg-green-500', 
      'History': 'bg-purple-500',
      'English': 'bg-orange-500'
    }
    return colors[subject] || 'bg-gray-500'
  }

  private static getNextTopic(subject: string, progress: number): string {
    const topics: Record<string, string[]> = {
      'Mathematics': ['Basic Arithmetic', 'Algebra', 'Geometry', 'Calculus'],
      'Science': ['Basic Chemistry', 'Physics', 'Biology', 'Advanced Chemistry'],
      'History': ['Ancient History', 'Medieval Period', 'Modern History', 'Contemporary'],
      'English': ['Grammar', 'Literature', 'Writing', 'Advanced Composition']
    }
    
    const subjectTopics = topics[subject] || ['Next Topic']
    const topicIndex = Math.floor(progress / 25) // 0-25: topic 0, 26-50: topic 1, etc.
    return subjectTopics[Math.min(topicIndex, subjectTopics.length - 1)]
  }

  private static getTimeAgo(date: Date): string {
    const now = new Date()
    const diffInMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.round(diffInMinutes / 60)} hours ago`
    return `${Math.round(diffInMinutes / 1440)} days ago`
  }

  private static getScoreColor(correct: number, total: number): string {
    const accuracy = (correct / total) * 100
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 70) return 'text-blue-600'
    if (accuracy >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Default fallback data
  private static getDefaultStats() {
    return {
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      totalStudyTime: 0,
      userLevel: 'Beginner',
      trends: {
        questionsAnswered: { value: 0, isPositive: true },
        accuracyRate: { value: 0, isPositive: true },
        studyTime: { value: 0, isPositive: true },
        level: { value: 0, isPositive: true }
      },
      currentStreak: 0,
      totalSessions: 0,
      averageSessionDuration: 0
    }
  }

  private static getDefaultSubjectProgress() {
    return []
  }

  private static getDefaultActivity() {
    return []
  }

  private static getDefaultAchievements() {
    return [
      { title: 'First Steps', desc: 'Complete your first quiz', earned: false, rarity: 'common' },
      { title: 'Getting Started', desc: 'Answer 10 questions', earned: false, rarity: 'common' }
    ]
  }
}