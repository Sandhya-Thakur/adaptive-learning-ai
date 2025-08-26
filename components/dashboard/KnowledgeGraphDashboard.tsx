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
  Zap,
  AlertCircle
} from 'lucide-react'

interface Topic {
  id: string
  topic_name: string
  topic_slug: string
  subject: string
  difficulty_level: number
  estimated_time_minutes?: number
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

interface KnowledgeData {
  subject: string
  overallProgress: number
  totalTopics: number
  masteredTopics: number
  topics: Topic[]
  overallConfidenceCalibration?: number
}

interface KnowledgeGraphDashboardProps {
  userId: string
  knowledgeData?: KnowledgeData | null
}

const KnowledgeGraphDashboard: React.FC<KnowledgeGraphDashboardProps> = ({ 
  userId, 
  knowledgeData 
}) => {
  const [selectedSubject, setSelectedSubject] = useState('math')
  const [subjectData, setSubjectData] = useState<KnowledgeData | null>(null)
  const [pathways, setPathways] = useState<LearningPathway[]>([])
  const [recommendedTopics, setRecommendedTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchKnowledgeGraphData()
  }, [selectedSubject, userId, knowledgeData])

  const fetchKnowledgeGraphData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (userId === 'new-user' || !knowledgeData) {
        const demoData = generateDemoData(selectedSubject)
        setSubjectData(demoData.subjectData)
        setPathways(demoData.pathways)
        setRecommendedTopics(demoData.recommended)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/knowledge-graph/subject-progress?userId=${userId}&subject=${selectedSubject}`)
        
        if (response.ok) {
          const data = await response.json()
          setSubjectData(data.subjectData)
          setPathways(data.pathways || [])
          setRecommendedTopics(data.recommendedTopics || [])
        } else {
          throw new Error('API response not ok')
        }
      } catch {
        const fallbackData = generateMockData(selectedSubject, knowledgeData)
        setSubjectData(fallbackData.subjectData)
        setPathways(fallbackData.pathways)
        setRecommendedTopics(fallbackData.recommended)
      }
      
    } catch (fetchError) {
      console.error('Error fetching knowledge graph data:', fetchError)
      setError('Failed to load knowledge graph data')
      
      const fallbackData = generateMockData(selectedSubject, knowledgeData)
      setSubjectData(fallbackData.subjectData)
      setPathways(fallbackData.pathways)
      setRecommendedTopics(fallbackData.recommended)
    } finally {
      setLoading(false)
    }
  }

  const generateDemoData = (subject: string) => {
    const topics: Topic[] = [
      {
        id: '1',
        topic_name: 'Getting Started',
        topic_slug: `${subject}-basics`,
        subject,
        difficulty_level: 1,
        estimated_time_minutes: 15,
        mastery_level: 0,
        questions_attempted: 0,
        questions_correct: 0
      },
      {
        id: '2', 
        topic_name: 'Intermediate Concepts',
        topic_slug: `${subject}-intermediate`,
        subject,
        difficulty_level: 5,
        estimated_time_minutes: 30,
        mastery_level: 0,
        questions_attempted: 0,
        questions_correct: 0
      }
    ]

    return {
      subjectData: {
        subject,
        overallProgress: 0,
        totalTopics: topics.length,
        masteredTopics: 0,
        topics
      },
      pathways: [
        {
          id: '1',
          pathway_name: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Fundamentals`,
          subject,
          description: 'Start your learning journey here',
          progress_percentage: 0,
          current_step: 1,
          total_steps: 5,
          is_active: false
        }
      ],
      recommended: topics.slice(0, 1)
    }
  }

  const generateMockData = (subject: string, knowledgeData?: KnowledgeData | null) => {
    const baseProgress = knowledgeData?.overallProgress || Math.floor(Math.random() * 60) + 20
    
    const topics: Topic[] = [
      {
        id: '1',
        topic_name: subject === 'math' ? 'Basic Arithmetic' : 
                   subject === 'science' ? 'Atoms & Elements' :
                   subject === 'history' ? 'Ancient Civilizations' : 'Parts of Speech',
        topic_slug: `${subject}-basic`,
        subject,
        difficulty_level: 1,
        estimated_time_minutes: 20,
        mastery_level: Math.min(0.95, (baseProgress + 20) / 100),
        questions_attempted: 15,
        questions_correct: 14,
        last_practiced: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        topic_name: subject === 'math' ? 'Fractions' : 
                   subject === 'science' ? 'Chemical Reactions' :
                   subject === 'history' ? 'Classical Antiquity' : 'Sentence Structure',
        topic_slug: `${subject}-intermediate`,
        subject,
        difficulty_level: 3,
        estimated_time_minutes: 30,
        mastery_level: Math.max(0.1, (baseProgress - 10) / 100),
        questions_attempted: 12,
        questions_correct: Math.floor(12 * ((baseProgress - 10) / 100)),
        last_practiced: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    return {
      subjectData: {
        subject,
        overallProgress: baseProgress,
        totalTopics: topics.length,
        masteredTopics: topics.filter(t => (t.mastery_level || 0) >= 0.8).length,
        topics
      },
      pathways: [
        {
          id: '1',
          pathway_name: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Fundamentals`,
          subject,
          description: 'Complete foundation from basics to advanced',
          progress_percentage: baseProgress,
          current_step: 2,
          total_steps: 5,
          is_active: true
        }
      ],
      recommended: topics.filter(t => t.mastery_level && t.mastery_level > 0 && t.mastery_level < 0.8).slice(0, 2)
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

  const canAccessTopic = (topic: Topic, index: number) => {
    if (userId === 'new-user') return index === 0
    return topic.difficulty_level <= 5 || (topic.mastery_level && topic.mastery_level > 0)
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

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600">{error}</p>
          </div>
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
                  {subjectData.masteredTopics} of {subjectData.totalTopics} topics mastered
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
              const isAccessible = canAccessTopic(topic, index)
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
                          <span>Difficulty: {topic.difficulty_level}/10</span>
                          <span>{topic.estimated_time_minutes || 30} min</span>
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
              {recommendedTopics.length > 0 ? recommendedTopics.map((topic) => (
                <div key={topic.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800">{topic.topic_name}</h4>
                  <p className="text-sm text-green-600 mt-1">
                    Continue practicing - {Math.round((topic.mastery_level || 0) * 100)}% mastered
                  </p>
                  <button className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors">
                    Practice Now
                  </button>
                </div>
              )) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {userId === 'new-user' ? 'Start a quiz to get recommendations!' : 'Complete more topics to unlock recommendations'}
                  </p>
                </div>
              )}
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
                    {pathway.is_active ? 'Continue Path' : 'Start Path'}
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