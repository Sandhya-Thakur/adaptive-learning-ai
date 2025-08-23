// Create: app/api/debug-ai/route.ts

import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ollama-service'

export async function GET() {
  try {
    console.log('🧪 Testing AI generation...')
    
    // Test math question generation
    const mathResponse = await aiService.generateQuizQuestion('math', 5, 'intermediate')
    
    return NextResponse.json({
      success: true,
      rawResponse: mathResponse,
      responseLength: mathResponse.length,
      hasQuestion: mathResponse.toLowerCase().includes('question'),
      hasOptions: mathResponse.includes('A)') && mathResponse.includes('B)'),
      hasAnswer: mathResponse.toLowerCase().includes('answer')
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'AI test failed',
      suggestion: 'Check if Ollama is running: ollama serve'
    })
  }
}

// Visit: localhost:3000/api/debug-ai to see what AI generates