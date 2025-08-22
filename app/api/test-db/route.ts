// app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await db.initializeDatabase()
    
    // Test creating a user
    const testUser = await db.createUser({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      current_subjects: ['math'],
      knowledge_state: { algebra: 0.7 },
      learning_velocity: { algebra: 0.5 },
      optimal_difficulty: 0.6,
      study_streak: 5,
      total_questions_answered: 20
    })

    // Test retrieving the user
    const retrievedUser = await db.getUserById(testUser.id)

    return NextResponse.json({
      success: true,
      message: 'Database connection and storage working!',
      testUser: retrievedUser
    })

  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Test creating multiple users
    const users = []
    for (let i = 0; i < 3; i++) {
      const user = await db.createUser({
        name: `Test User ${i}`,
        email: `testbatch${Date.now()}_${i}@example.com`,
        current_subjects: ['science', 'math'],
        knowledge_state: { physics: 0.4, algebra: 0.8 },
        learning_velocity: { physics: 0.3, algebra: 0.6 },
        optimal_difficulty: 0.5,
        study_streak: i * 2,
        total_questions_answered: i * 10
      })
      users.push(user)
    }

    return NextResponse.json({
      success: true,
      message: 'Batch user creation successful!',
      users
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}