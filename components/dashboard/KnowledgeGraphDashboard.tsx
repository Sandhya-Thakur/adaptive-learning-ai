// components/dashboard/KnowledgeGraphDashboard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  Network, 
  Brain, 
  Target, 
  TrendingUp, 
  Lock, 
  CheckCircle,
  ArrowRight,
  BookOpen,
  Zap
} from 'lucide-react'

interface Topic {
  id: string
  topic_name: string
  topic_slug: string
  subject: string
  difficulty_level: number
  estimated_time_minutes: number
  mastery_level?: number
  questions_attempted?: number
  questions_correct?: number
  last_practiced?: string
  prerequisites?: Topic[]
}

interface LearningPathway {
  id: string
  pathway_name: string
  subject: string
  description: string
  progress_percentage: number
  current_step: number
  total_steps: number
  is_active: boolean
}

interface KnowledgeGraphDashboardProps {
  userId: string
}

const KnowledgeGraphDashboard: React.FC<KnowledgeGraphDashboardProps> = ({ userId }) => {
  const [selectedSubject, setSelectedSubject] = useState('math')
  const [subjectData, setSubjectData] = useState<{
    subject: string
    overallProgress: number
    topics: Topic[]
  } | null>(null)
  const [pathways, setPathways] = useState<LearningPathway[]>([])
  const [recommendedTopics, setRecommendedTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKnowledgeGraphData()
  }, [selectedSubject])

  const fetchKnowledgeGraphData = async () => {
    setLoading(true)
    try {
      // In a real implementation, these would be API calls
      // For now, we'll simulate the data structure
      
      // Simulate subject progress data
      const mockSubjectData = {
        subject: selectedSubject,
        overallProgress: 67,
        topics: [
          {
            id: '1',
            topic_name: 'Basic Arithmetic',
            topic_slug: 'math-basic-arithmetic',
            subject: 'math',
            difficulty_level: 0.1,
            estimated_time_minutes: 20,
            mastery_level: 0.95,
            questions_attempted: 15,
            questions_correct: 14,
            last_practiced: '2024-08-24T10:30:00Z'
          },
          {
            id: '2',
            topic_name: 'Fractions',
            topic_slug: 'math-fractions',
            subject: 'math',
            difficulty_level: 0.2,
            estimated_time_minutes: 30,
            mastery_level: 0.75,
            questions_attempted: 12,
            questions_correct: 9,
            last_practiced: '2024-08-24T11:15:00Z'
          },
          {
            id: '3',
            topic_name: 'Linear Equations',
            topic_slug: 'math-linear-equations',
            subject: 'math',
            difficulty_level: 0.5,
            estimated_time_minutes: 50,
            mastery_level: 0.45,
            questions_attempted: 8,
            questions_correct: 4,
            last_practiced: '2024-08-24T12:00:00Z'
          },
          {
            id: '4',
            topic_name: 'Quadratic Equations',
            topic_slug: 'math-quadratic-equations',
            subject: 'math',
            difficulty_level: 0.6,
            estimated_time_minutes: 60,
            mastery_level: 0,
            questions_attempted: 0,
            questions_correct: 0
          }
        ]
      }

      const mockPathways: LearningPathway[] = [
        {
          id: '1',
          pathway_name: 'Mathematics Fundamentals',
          subject: 'math',
          description: 'Complete foundation from arithmetic to algebra',
          progress_percentage: 67,
          current_step: 3,
          total_steps: 5,
          is_active: true
        }
      ]

      const mockRecommended: Topic[] = [
        {
          id: '3',
          topic_name: 'Linear Equations',
          topic_slug: 'math-linear-equations',
          subject: 'math',
          difficulty_level: 0.5,
          estimated_time_minutes: 50,
          mastery_level: 0.45,
          questions_attempted: 8,
          questions_correct: 4
        }
      ]

      setSubjectData(mockSubjectData)
      setPathways(mockPathways)
      setRecommendedTopics(mockRecommended)
      
    } catch (error) {
      console.error('Error fetching knowledge graph data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return 'bg-green-500'
    if (mastery >= 0.6) return 'bg-blue-500'
    if (mastery >= 0.4) return 'bg-yellow-500'
    if (mastery > 0) return 'bg-orange-500'
    return 'bg-gray-300'
  }

  const getMasteryStatus = (mastery: number, attempted: number) => {
    if (attempted === 0) return 'Not Started'
    if (mastery >= 0.8) return 'Mastered'
    if (mastery >= 0.6) return 'Proficient'
    if (mastery >= 0.4) return 'Learning'
    return 'Practicing'
  }

  const canAccessTopic = (topic: Topic) => {
    // In a real implementation, check prerequisites
    return topic.difficulty_level <= 0.5 || (topic.mastery_level && topic.mastery_level > 0)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Network className="h-6 w-6 text-purple-600 mr-2" />
            Knowledge Graph
          </h2>
          <div className="flex space-x-2">
            {['math', 'science', 'history', 'english'].map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  selectedSubject === subject
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
        
        {subjectData && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {subjectData.subject} Progress
                </h3>
                <p className="text-sm text-gray-600">
                  {subjectData.topics.filter(t => t.mastery_level && t.mastery_level >= 0.8).length} of {subjectData.topics.length} topics mastered
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {subjectData.overallProgress}%
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subjectData.overallProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Mastery Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="h-5 w-5 text-blue-500 mr-2" />
            Topic Mastery Map
          </h3>
          
          <div className="space-y-4">
            {subjectData?.topics.map((topic, index) => {
              const isAccessible = canAccessTopic(topic)
              const mastery = topic.mastery_level || 0
              
              return (
                <div
                  key={topic.id}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isAccessible 
                      ? 'border-gray-200 hover:border-blue-300 cursor-pointer' 
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  {/* Connection Line to Previous Topic */}
                  {index > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <ArrowRight className="h-4 w-4 text-gray-400 transform rotate-90" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        !isAccessible ? 'bg-gray-200' : 'bg-blue-100'
                      }`}>
                        {!isAccessible ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : mastery >= 0.8 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Brain className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          isAccessible ? 'text-gray-800' : 'text-gray-500'
                        }`}>
                          {topic.topic_name}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>Difficulty: {Math.round(topic.difficulty_level * 10)}/10</span>
                          <span>{topic.estimated_time_minutes} min</span>
                          {topic.questions_attempted && topic.questions_attempted > 0 && (
                            <span>{topic.questions_correct}/{topic.questions_attempted} correct</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        mastery >= 0.8 ? 'text-green-600' :
                        mastery >= 0.6 ? 'text-blue-600' :
                        mastery >= 0.4 ? 'text-yellow-600' :
                        mastery > 0 ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {getMasteryStatus(mastery, topic.questions_attempted || 0)}
                      </div>
                      {mastery > 0 && (
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`${getMasteryColor(mastery)} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${mastery * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recommended Next Topics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              Recommended Next
            </h3>
            
            <div className="space-y-3">
              {recommendedTopics.map((topic) => (
                <div key={topic.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800">{topic.topic_name}</h4>
                  <p className="text-sm text-green-600 mt-1">
                    Continue practicing - {Math.round((topic.mastery_level || 0) * 100)}% mastered
                  </p>
                  <button className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors">
                    Practice Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Pathways */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
              Learning Pathways
            </h3>
            
            <div className="space-y-3">
              {pathways.map((pathway) => (
                <div key={pathway.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800">{pathway.pathway_name}</h4>
                    <span className="text-sm text-blue-600">
                      {pathway.current_step}/{pathway.total_steps}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mb-3">{pathway.description}</p>
                  
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pathway.progress_percentage}%` }}
                    />
                  </div>
                  
                  <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                    Continue Path
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              Learning Stats
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Topics Started</span>
                <span className="font-medium">{subjectData?.topics.filter(t => (t.questions_attempted || 0) > 0).length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Topics Mastered</span>
                <span className="font-medium text-green-600">
                  {subjectData?.topics.filter(t => (t.mastery_level || 0) >= 0.8).length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Mastery</span>
                <span className="font-medium">
                  {Math.round((subjectData?.topics.reduce((sum, t) => sum + (t.mastery_level || 0), 0) || 0) / (subjectData?.topics.length || 1) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeGraphDashboard