
// components/dashboard/OptimizedAchievements.tsx
import React from 'react'
import { Star, Award, Lock } from 'lucide-react'

interface AchievementData {
  title: string
  desc: string
  earned: boolean
  icon?: string
  rarity?: 'common' | 'rare' | 'epic'
}

interface OptimizedAchievementsProps {
  achievements?: AchievementData[]
}

const OptimizedAchievements: React.FC<OptimizedAchievementsProps> = ({ achievements }) => {
  const defaultAchievements: AchievementData[] = [
    { title: 'Quick Learner', desc: 'Answered 10 questions in under 5 minutes', earned: true, rarity: 'common' },
    { title: 'Streak Master', desc: 'Maintained 7-day learning streak', earned: true, rarity: 'rare' },
    { title: 'Perfect Score', desc: 'Get 100% on any quiz', earned: false, rarity: 'epic' }
  ]

  const achievementsToShow = achievements || defaultAchievements

  const getRarityColors = (rarity: AchievementData['rarity'], earned: boolean) => {
    if (!earned) return 'bg-gray-100 border-gray-200 text-gray-400'
    
    switch (rarity) {
      case 'common':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'rare':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      case 'epic':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Star className="h-5 w-5 text-yellow-500 mr-2" />
        Achievements
      </h3>
      <div className="space-y-3">
        {achievementsToShow.map((achievement, index) => (
          <div key={index} className={`flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
            getRarityColors(achievement.rarity, achievement.earned)
          }`}>
            <div className={`p-2 rounded-full ${
              achievement.earned ? 'bg-white shadow-sm' : 'bg-gray-200'
            }`}>
              {achievement.earned ? (
                <Award className={`h-5 w-5 ${
                  achievement.rarity === 'epic' ? 'text-yellow-600' :
                  achievement.rarity === 'rare' ? 'text-purple-600' : 'text-blue-600'
                }`} />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <p className={`font-medium text-sm ${
                  achievement.earned ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {achievement.title}
                </p>
                {achievement.rarity === 'rare' && achievement.earned && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Rare</span>
                )}
                {achievement.rarity === 'epic' && achievement.earned && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Epic</span>
                )}
              </div>
              <p className={`text-xs mt-1 ${
                achievement.earned ? 'text-gray-600' : 'text-gray-500'
              }`}>
                {achievement.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OptimizedAchievements