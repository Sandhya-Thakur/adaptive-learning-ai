// components/dashboard/OptimizedSubjectProgress.tsx
import React from 'react'
import { BarChart3, ArrowRight, TrendingUp } from 'lucide-react'

interface SubjectData {
  subject: string
  progress: number
  color: string
  nextTopic: string
  recentScore?: number
}

interface OptimizedSubjectProgressProps {
  subjects?: SubjectData[]
}

const OptimizedSubjectProgress: React.FC<OptimizedSubjectProgressProps> = ({ subjects }) => {
  const defaultSubjects: SubjectData[] = [
    { subject: 'Mathematics', progress: 85, color: 'bg-blue-500', nextTopic: 'Quadratic Equations', recentScore: 90 },
    { subject: 'Science', progress: 72, color: 'bg-green-500', nextTopic: 'Chemical Reactions', recentScore: 75 },
    { subject: 'History', progress: 68, color: 'bg-purple-500', nextTopic: 'World War II', recentScore: 82 },
    { subject: 'English', progress: 91, color: 'bg-orange-500', nextTopic: 'Shakespeare', recentScore: 95 }
  ]

  const subjectsToShow = subjects || defaultSubjects

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
              <div className="flex items-center">
                <h3 className="font-semibold text-gray-800 text-lg">{item.subject}</h3>
                {item.recentScore && (
                  <span className="ml-3 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {item.recentScore}%
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
              <p className="text-sm text-gray-600">Next: <span className="font-medium">{item.nextTopic}</span></p>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OptimizedSubjectProgress