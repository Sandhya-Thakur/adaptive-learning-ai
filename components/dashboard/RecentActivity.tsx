// components/dashboard/OptimizedRecentActivity.tsx
import React from 'react'
import { Calendar, Clock, Award as AwardIcon } from 'lucide-react'

interface ActivityData {
  action: string
  score: string
  time: string
  color: string
  type: 'quiz' | 'session' | 'achievement'
}

interface OptimizedRecentActivityProps {
  activities?: ActivityData[]
}

const OptimizedRecentActivity: React.FC<OptimizedRecentActivityProps> = ({ activities }) => {
  const defaultActivities: ActivityData[] = [
    { action: 'Completed Math Quiz', score: '8/10', time: '2 hours ago', color: 'text-green-600', type: 'quiz' },
    { action: 'Started Science Session', score: '6/8', time: '1 day ago', color: 'text-blue-600', type: 'session' },
    { action: 'Mastered Topic', score: 'Algebra', time: '2 days ago', color: 'text-purple-600', type: 'achievement' }
  ]

  const activitiesToShow = activities || defaultActivities

  const getActivityIcon = (type: ActivityData['type']) => {
    switch (type) {
      case 'quiz':
        return <Calendar className="h-4 w-4" />
      case 'session':
        return <Clock className="h-4 w-4" />
      case 'achievement':
        return <AwardIcon className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Calendar className="h-5 w-5 text-blue-500 mr-2" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activitiesToShow.map((activity, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer group">
            <div className="flex items-center">
              <div className={`p-2 rounded-full bg-white shadow-sm mr-3 ${activity.color.replace('text-', 'text-')} group-hover:shadow-md transition-shadow`}>
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{activity.action}</p>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </p>
              </div>
            </div>
            <span className={`font-semibold text-sm px-2 py-1 rounded-full bg-white shadow-sm ${activity.color}`}>
              {activity.score}
            </span>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium py-2 hover:bg-blue-50 rounded-lg transition-all duration-200">
        View All Activity
      </button>
    </div>
  )
}

export default OptimizedRecentActivity