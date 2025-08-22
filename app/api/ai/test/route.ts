// app/api/ai/test/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🤖 Testing AI question generation...')
    
    // Test generating a simple question
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:27b',
        prompt: 'Create a simple math question about addition for a beginner student. Format: Question, then 4 multiple choice options A) B) C) D), then correct answer.',
        stream: false,
      }),
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'AI question generation successful!',
      generatedQuestion: data.response,
      model: 'gemma3:27b'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate question'
    }, { status: 500 })
  }
}