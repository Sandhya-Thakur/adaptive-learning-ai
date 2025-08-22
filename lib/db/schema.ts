//lib/db/schema.ts
// lib/db/schema.ts
import { Pool } from 'pg'

// Database connection configuration
export interface DatabaseConfig {
  connectionString: string
  ssl?: boolean
}

// User table interface
export interface User {
  id: string
  name: string
  email: string
  preferred_learning_style?: 'visual' | 'verbal' | 'example_based' | 'step_by_step'
  current_subjects: string[]
  knowledge_state: Record<string, number> // topic -> mastery level (0-1)
  learning_velocity: Record<string, number> // topic -> learning speed
  optimal_difficulty: number // 0-1 scale
  study_streak: number
  total_questions_answered: number
  created_at: Date
  last_active: Date
}

// Quiz session interface
export interface QuizSession {
  id: string
  user_id: string
  subject: string
  start_time: Date
  end_time?: Date
  session_score?: number
  difficulty_progression: number[]
  questions_asked: string[]
  created_at: Date
}

// Question interface
export interface Question {
  id: string
  session_id: string
  question_text: string
  correct_answer: string
  options?: string[] // for multiple choice
  difficulty: number // 0-1 scale
  subject: string
  topic: string
  prerequisites: string[]
  explanation: string
  hints: string[]
  created_at: Date
}

// User response interface
export interface UserResponse {
  id: string
  question_id: string
  session_id: string
  user_answer: string
  is_correct: boolean
  confidence_level: number // 1-5 scale
  time_taken_seconds: number
  hints_used: number
  created_at: Date
}

// Learning analytics interface
export interface LearningAnalytics {
  id: string
  user_id: string
  date: Date
  subject: string
  topic: string
  mastery_level: number
  learning_rate: number
  retention_score: number
  difficulty_preference: number
}

// Database schema creation SQL
export const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  preferred_learning_style VARCHAR(50),
  current_subjects TEXT[] DEFAULT '{}',
  knowledge_state JSONB DEFAULT '{}',
  learning_velocity JSONB DEFAULT '{}',
  optimal_difficulty DECIMAL(3,2) DEFAULT 0.5,
  study_streak INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Quiz sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  session_score DECIMAL(3,2),
  difficulty_progression DECIMAL(3,2)[] DEFAULT '{}',
  questions_asked UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options TEXT[],
  difficulty DECIMAL(3,2) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  prerequisites TEXT[] DEFAULT '{}',
  explanation TEXT DEFAULT '',
  hints TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- User responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  time_taken_seconds INTEGER NOT NULL,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning analytics table
CREATE TABLE IF NOT EXISTS learning_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  mastery_level DECIMAL(3,2) NOT NULL,
  learning_rate DECIMAL(3,2) NOT NULL,
  retention_score DECIMAL(3,2),
  difficulty_preference DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date, subject, topic)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON questions(subject, topic);
CREATE INDEX IF NOT EXISTS idx_user_responses_question_id ON user_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_session_id ON user_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_id ON learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_date ON learning_analytics(date);
`;

// Database connection class
export class Database {
  private pool: Pool

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    })
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }

  async initializeDatabase() {
    try {
      await this.query(createTablesSQL)
      console.log('Database tables created successfully')
    } catch (error) {
      console.error('Error creating database tables:', error)
      throw error
    }
  }

  async close() {
    await this.pool.end()
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'last_active'>) {
    const query = `
      INSERT INTO users (name, email, preferred_learning_style, current_subjects, knowledge_state, learning_velocity, optimal_difficulty)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    const values = [
      userData.name,
      userData.email,
      userData.preferred_learning_style,
      userData.current_subjects,
      JSON.stringify(userData.knowledge_state),
      JSON.stringify(userData.learning_velocity),
      userData.optimal_difficulty
    ]
    const result = await this.query(query, values)
    return result.rows[0] as User
  }

  async getUserById(id: string) {
    const query = 'SELECT * FROM users WHERE id = $1'
    const result = await this.query(query, [id])
    return result.rows[0] as User | undefined
  }

  async getUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1'
    const result = await this.query(query, [email])
    return result.rows[0] as User | undefined
  }

  // Quiz session operations
  async createQuizSession(sessionData: Omit<QuizSession, 'id' | 'created_at'>) {
    const query = `
      INSERT INTO quiz_sessions (user_id, subject, start_time, difficulty_progression)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const values = [
      sessionData.user_id,
      sessionData.subject,
      sessionData.start_time,
      sessionData.difficulty_progression
    ]
    const result = await this.query(query, values)
    return result.rows[0] as QuizSession
  }

  async getQuizSessionsByUserId(userId: string) {
    const query = 'SELECT * FROM quiz_sessions WHERE user_id = $1 ORDER BY created_at DESC'
    const result = await this.query(query, [userId])
    return result.rows as QuizSession[]
  }

  // Question operations
  async createQuestion(questionData: Omit<Question, 'id' | 'created_at'>) {
    const query = `
      INSERT INTO questions (session_id, question_text, correct_answer, options, difficulty, subject, topic, prerequisites, explanation, hints)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `
    const values = [
      questionData.session_id,
      questionData.question_text,
      questionData.correct_answer,
      questionData.options,
      questionData.difficulty,
      questionData.subject,
      questionData.topic,
      questionData.prerequisites,
      questionData.explanation,
      questionData.hints
    ]
    const result = await this.query(query, values)
    return result.rows[0] as Question
  }

  // User response operations
  async createUserResponse(responseData: Omit<UserResponse, 'id' | 'created_at'>) {
    const query = `
      INSERT INTO user_responses (question_id, session_id, user_answer, is_correct, confidence_level, time_taken_seconds, hints_used)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    const values = [
      responseData.question_id,
      responseData.session_id,
      responseData.user_answer,
      responseData.is_correct,
      responseData.confidence_level,
      responseData.time_taken_seconds,
      responseData.hints_used
    ]
    const result = await this.query(query, values)
    return result.rows[0] as UserResponse
  }

  async getUserResponsesBySessionId(sessionId: string) {
    const query = 'SELECT * FROM user_responses WHERE session_id = $1 ORDER BY created_at'
    const result = await this.query(query, [sessionId])
    return result.rows as UserResponse[]
  }
}

// Export singleton database instance (will be initialized in db config)
export let db: Database

export function initializeDatabase(config: DatabaseConfig) {
  db = new Database(config)
  return db
}