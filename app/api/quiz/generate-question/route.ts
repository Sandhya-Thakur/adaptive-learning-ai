// app/api/ai/test/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing Ollama connection...')
    
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Ollama not running: ${response.status}`)
    }

    const data = await response.json()
    const availableModels = data.models?.map((model: any) => model.name) || []

    return NextResponse.json({
      success: true,
      message: 'Ollama is running!',
      availableModels,
      status: 'connected'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      message: 'Make sure Ollama is running: ollama serve'
    }, { status: 500 })
  }
}