//types/index.ts
export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

export interface Question {
  id: string
  text: string
  options?: string[]
  correctAnswer: string
  difficulty: number
  subject: string
  topic: string
}

export interface QuizSession {
  id: string
  userId: string
  questions: Question[]
  answers: Answer[]
  startTime: Date
  endTime?: Date
}

export interface Answer {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
  confidence: number
}