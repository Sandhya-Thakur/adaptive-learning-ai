// lib/db/index.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

class DatabaseService {
  async query(text: string, params?: any[]) {
    const client = await pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }

  // User Methods
  async createUser(userData: {
    name: string
    email: string
    current_subjects: string[]
    knowledge_state: Record<string, any>
    learning_velocity: Record<string, any>
    optimal_difficulty: number
    study_streak: number
    total_questions_answered: number
  }) {
    const query = `
      INSERT INTO users (
        name, email, current_subjects, knowledge_state, 
        learning_velocity, optimal_difficulty, study_streak, 
        total_questions_answered
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    
    const values = [
      userData.name,
      userData.email,
      userData.current_subjects,
      JSON.stringify(userData.knowledge_state),
      JSON.stringify(userData.learning_velocity),
      userData.optimal_difficulty,
      userData.study_streak,
      userData.total_questions_answered
    ]
    
    const result = await this.query(query, values)
    return result.rows[0]
  }

  async getUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1'
    const result = await this.query(query, [email])
    return result.rows[0] || null
  }

  async getUserById(userId: string) {
    const query = 'SELECT * FROM users WHERE id = $1'
    const result = await this.query(query, [userId])
    return result.rows[0] || null
  }

  // Quiz Session Methods
  async createQuizSession(sessionData: {
    sessionId: string
    userId: string
    subject: string
    totalQuestions: number
    currentDifficulty: number
  }) {
    const query = `
      INSERT INTO quiz_sessions (
        id, user_id, subject, start_time, difficulty_progression
      ) VALUES ($1, $2, $3, NOW(), $4)
    `
    
    await this.query(query, [
      sessionData.sessionId,
      sessionData.userId,
      sessionData.subject,
      [sessionData.currentDifficulty / 10] // Convert to 0-1 scale
    ])
  }

  async getQuizSession(sessionId: string) {
    const query = `
      SELECT 
        id as "sessionId",
        user_id as "userId", 
        subject,
        start_time as "startTime",
        end_time as "endTime",
        difficulty_progression as "difficultyProgression"
      FROM quiz_sessions 
      WHERE id = $1
    `
    
    const result = await this.query(query, [sessionId])
    
    if (result.rows.length === 0) return null
    
    const session = result.rows[0]
    
    // Get question count for this session
    const statsQuery = `
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE q.session_id = $1
    `
    
    const statsResult = await this.query(statsQuery, [sessionId])
    const stats = statsResult.rows[0]
    
    return {
      ...session,
      questionsAnswered: parseInt(stats.total_questions) || 0,
      correctAnswers: parseInt(stats.correct_answers) || 0,
      currentDifficulty: session.difficultyProgression ? 
        session.difficultyProgression[session.difficultyProgression.length - 1] * 10 : 5,
      status: session.endTime ? 'completed' : 'active'
    }
  }

  async updateQuizSession(sessionId: string, updates: any) {
    const setParts: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.currentDifficulty !== undefined) {
      setParts.push(`difficulty_progression = array_append(difficulty_progression, $${paramIndex})`)
      values.push(updates.currentDifficulty / 10) // Convert to 0-1 scale
      paramIndex++
    }

    if (updates.endTime) {
      setParts.push(`end_time = $${paramIndex}`)
      values.push(updates.endTime)
      paramIndex++
    }

    if (updates.finalAccuracy !== undefined) {
      setParts.push(`session_score = $${paramIndex}`)
      values.push(updates.finalAccuracy / 100)
      paramIndex++
    }

    if (setParts.length === 0) return

    values.push(sessionId)
    const sql = `UPDATE quiz_sessions SET ${setParts.join(', ')} WHERE id = $${paramIndex}`
    
    await this.query(sql, values)
  }

  // Question Methods
  async saveQuizQuestion(question: {
    questionId: string
    sessionId: string
    questionText: string
    options: string[]
    correctAnswer: string
    difficulty: number
    subject: string
  }) {
    const query = `
      INSERT INTO questions (
        id, session_id, question_text, correct_answer, 
        options, difficulty, subject, topic, explanation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    
    await this.query(query, [
      question.questionId,
      question.sessionId,
      question.questionText,
      question.correctAnswer,
      question.options,
      question.difficulty / 10, // Convert to 0-1 scale
      question.subject,
      'general',
      'AI-generated question'
    ])

    // Update questions_asked in quiz_sessions
    const updateSessionQuery = `
      UPDATE quiz_sessions 
      SET questions_asked = COALESCE(questions_asked, '{}') || $1::uuid
      WHERE id = $2
    `
    await this.query(updateSessionQuery, [question.questionId, question.sessionId])
  }

  // Answer Methods
  async saveQuizAnswer(answer: {
    sessionId: string
    questionId: string
    userAnswer: string
    isCorrect: boolean
    timeSpent: number
  }) {
    // First get the session to find questions
    const sessionQuery = `
      SELECT q.id FROM questions q WHERE q.session_id = $1 AND q.id = $2
    `
    const sessionResult = await this.query(sessionQuery, [answer.sessionId, answer.questionId])
    
    if (sessionResult.rows.length === 0) {
      throw new Error('Question not found for this session')
    }

    const query = `
      INSERT INTO user_responses (
        question_id, session_id, user_answer, is_correct,
        confidence_level, time_taken_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `
    
    await this.query(query, [
      answer.questionId,
      answer.sessionId, // Note: This will be the quiz_session ID, but we need to link properly
      answer.userAnswer,
      answer.isCorrect,
      3, // Default confidence
      Math.round(answer.timeSpent)
    ])
  }

  async updateUserStats(userId: string, updates: {
    totalQuestionsAnswered?: number
    averageAccuracy?: number
  }) {
    const setParts: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.totalQuestionsAnswered) {
      setParts.push(`total_questions_answered = total_questions_answered + $${paramIndex}`)
      values.push(updates.totalQuestionsAnswered)
      paramIndex++
    }

    if (updates.averageAccuracy !== undefined) {
      const newOptimalDifficulty = Math.min(1, Math.max(0, updates.averageAccuracy / 100))
      setParts.push(`optimal_difficulty = $${paramIndex}`)
      values.push(newOptimalDifficulty)
      paramIndex++
    }

    setParts.push(`last_active = NOW()`)

    values.push(userId)
    const sql = `UPDATE users SET ${setParts.join(', ')} WHERE id = $${paramIndex}`
    
    await this.query(sql, values)
  }
}

export const db = new DatabaseService()

// Test connection
db.query('SELECT NOW()').then(() => {
  console.log('✅ Database connected successfully')
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message)
})