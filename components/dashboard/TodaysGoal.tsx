// components/dashboard/TodaysGoal.tsx
import React from 'react'
import { Target, CheckCircle, Zap } from 'lucide-react'

interface OptimizedTodaysGoalProps {
  current?: number
  target?: number
  label?: string
  bonus?: string | null
}

const OptimizedTodaysGoal: React.FC<OptimizedTodaysGoalProps> = ({
  current = 3,
  target = 5,
  label = "Complete 5 quiz sessions",
  bonus = null
}) => {
  const progress = (current / target) * 100
  const isCompleted = current >= target

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Target className="h-5 w-5 text-red-500 mr-2" />
        Today's Goal
      </h3>
      
      {bonus && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            {bonus}
          </p>
        </div>
      )}
      
      <div className="text-center">
        <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full text-white font-bold text-xl mb-4 transition-all duration-300 ${
          isCompleted 
            ? 'bg-gradient-to-br from-green-400 to-green-500 ring-4 ring-green-200'
            : 'bg-gradient-to-br from-blue-400 to-blue-500'
        }`}>
          {isCompleted ? (
            <CheckCircle className="h-8 w-8" />
          ) : (
            `${current}/${target}`
          )}
        </div>
        <p className="text-sm text-gray-600 mb-3">{label}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isCompleted ? '🎉 Goal completed!' : `${target - current} more to go`}
        </p>
      </div>
    </div>
  )
}

export default OptimizedTodaysGoal
