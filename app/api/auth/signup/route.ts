// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json()

    if (!name || !email) {
      return NextResponse.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists'
      }, { status: 400 })
    }

    // Create new user
    const newUser = await db.createUser({
      name,
      email,
      current_subjects: [],
      knowledge_state: {},
      learning_velocity: {},
      optimal_difficulty: 0.5,
      study_streak: 0,
      total_questions_answered: 0
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed'
    }, { status: 500 })
  }
}