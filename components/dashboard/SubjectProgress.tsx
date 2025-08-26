// components/dashboard/SubjectProgress.tsx
import React from 'react'
import { BarChart3, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SubjectInsights {
  questionsAnswered: number
  averageTime: number
  recentTrend: 'improving' | 'declining' | 'stable'
}

interface SubjectData {
  subject: string
  progress: number
  color: string
  nextTopic: string
  recentScore?: number
  insights?: SubjectInsights
}

interface OptimizedSubjectProgressProps {
  subjects?: SubjectData[]
}

const OptimizedSubjectProgress: React.FC<OptimizedSubjectProgressProps> = ({ subjects }) => {
  const defaultSubjects: SubjectData[] = [
    { 
      subject: 'Mathematics', 
      progress: 85, 
      color: 'bg-blue-500', 
      nextTopic: 'Quadratic Equations', 
      recentScore: 90,
      insights: { questionsAnswered: 45, averageTime: 32, recentTrend: 'improving' }
    },
    { 
      subject: 'Science', 
      progress: 72, 
      color: 'bg-green-500', 
      nextTopic: 'Chemical Reactions', 
      recentScore: 75,
      insights: { questionsAnswered: 38, averageTime: 28, recentTrend: 'stable' }
    }
  ]

  const subjectsToShow = subjects || defaultSubjects

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'declining': return <TrendingDown className="h-3 w-3 text-red-600" />
      default: return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100'
      case 'declining': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
          Subject Progress
        </h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
          View All <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      
      <div className="space-y-5">
        {subjectsToShow.map((item, index) => (
          <div key={index} className="group hover:bg-gray-50 rounded-lg p-4 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-gray-800 text-lg">{item.subject}</h3>
                {item.recentScore && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Recent: {item.recentScore}%
                  </span>
                )}
                {item.insights?.recentTrend && (
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center ${getTrendColor(item.insights.recentTrend)}`}>
                    {getTrendIcon(item.insights.recentTrend)}
                    <span className="ml-1 capitalize">{item.insights.recentTrend}</span>
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-gray-700">{item.progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className={`${item.color} h-3 rounded-full transition-all duration-500 group-hover:shadow-sm`}
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Next: <span className="font-medium">{item.nextTopic}</span></p>
                {item.insights && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.insights.questionsAnswered} questions • {item.insights.averageTime}s avg
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OptimizedSubjectProgress