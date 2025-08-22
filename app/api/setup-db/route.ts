// app/api/setup-db/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Initialize database (creates all tables)
    await db.initializeDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!'
    })

  } catch (error) {
    console.error('Database setup failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}