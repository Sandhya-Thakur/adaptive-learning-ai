// lib/ai/ollama-service.ts

interface OllamaResponse {
  model: string
  response: string
  done: boolean
}

class OllamaService {
  private baseUrl = 'http://localhost:11434'
  private model = 'llama3.1'

  async generateQuizQuestion(subject: string, difficulty: number, userLevel: string): Promise<string> {
    const prompt = this.buildQuestionPrompt(subject, difficulty, userLevel)
    return this.callOllama(prompt)
  }

 // Update your buildQuestionPrompt method in ollama-service.ts

private buildQuestionPrompt(subject: string, difficulty: number, userLevel: string): string {
  if (subject === 'math') {
    // Generate random numbers for variety
    const num1 = Math.floor(Math.random() * 9) + 2 // 2-10
    const num2 = Math.floor(Math.random() * 9) + 2 // 2-10
    const correctAnswer = num1 * num2
    
    // Add some randomization to the prompt
    const variations = [
      `Create a multiplication question using ${num1} and ${num2}.`,
      `Make a math problem: ${num1} × ${num2} = ?`,
      `Generate: What is ${num1} times ${num2}?`,
      `Create: ${num1} multiplied by ${num2} equals what?`
    ]
    
    const randomVariation = variations[Math.floor(Math.random() * variations.length)]
    
    return `${randomVariation}

REQUIREMENTS:
- Use the numbers ${num1} and ${num2}
- The correct answer is ${correctAnswer}
- Provide exactly 4 answer choices
- Include 3 wrong answers that are close but incorrect
- Label choices as A, B, C, D
- Clearly mark the correct answer

FORMAT EXAMPLE:
Question: What is ${num1} × ${num2}?
A) ${correctAnswer}
B) ${correctAnswer + Math.floor(Math.random() * 10) + 1}
C) ${correctAnswer - Math.floor(Math.random() * 5) - 1}  
D) ${correctAnswer + Math.floor(Math.random() * 15) + 5}

Correct Answer: A) ${correctAnswer}

Create the question now with these exact numbers: ${num1} × ${num2}`
  }

  if (subject === 'science') {
    const topics = [
      'chemistry symbols', 'states of matter', 'planets', 'animals', 
      'plants', 'weather', 'human body', 'food chains'
    ]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    
    return `Create a science question about ${randomTopic} for ${userLevel} level.

REQUIREMENTS:
- Topic: ${randomTopic}
- Provide exactly 4 answer choices labeled A, B, C, D
- Make sure one answer is clearly correct
- Make it educational and age-appropriate

Create a NEW science question now:`
  }

  if (subject === 'history') {
    const topics = [
      'world wars', 'ancient civilizations', 'famous leaders', 'inventions',
      'important dates', 'countries', 'historical events', 'explorers'
    ]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    
    return `Create a history question about ${randomTopic} for ${userLevel} level.

REQUIREMENTS:
- Topic: ${randomTopic}
- Provide exactly 4 answer choices labeled A, B, C, D
- Make sure one answer is clearly correct
- Make it educational and age-appropriate

Create a NEW history question now:`
  }

  if (subject === 'english') {
    const topics = [
      'synonyms', 'antonyms', 'grammar', 'spelling', 'parts of speech',
      'reading comprehension', 'vocabulary', 'punctuation'
    ]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    
    return `Create an English question about ${randomTopic} for ${userLevel} level.

REQUIREMENTS:
- Topic: ${randomTopic}
- Provide exactly 4 answer choices labeled A, B, C, D
- Make sure one answer is clearly correct
- Make it educational and age-appropriate

Create a NEW English question now:`
  }

  // Default fallback with randomization
  const randomSeed = Math.floor(Math.random() * 1000)
  return `Create a unique ${subject} question (#${randomSeed}) for ${userLevel} level.

Make it different from previous questions. Use variety in your topics and numbers.

REQUIREMENTS:
- Difficulty: ${difficulty}/10
- Exactly 4 answer choices (A, B, C, D)
- One clearly correct answer
- Educational and engaging

Create question #${randomSeed} now:`
}

  async testConnection(): Promise<{
    connected: boolean
    models?: string[]
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const models = data.models?.map((model: any) => model.name) || []

      return {
        connected: true,
        models
      }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

 // Update the options in your callOllama method

private async callOllama(prompt: string): Promise<string> {
  try {
    console.log('🤖 Calling Ollama with prompt:', prompt.substring(0, 200) + '...')

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7, // ✅ Increased from 0.3 for more variety
          top_p: 0.9,
          top_k: 40, // ✅ Added for more randomness
          repeat_penalty: 1.1, // ✅ Prevents repetition
          max_tokens: 500,
          num_predict: 500,
          seed: Math.floor(Math.random() * 1000000) // ✅ Random seed each time
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama API error response:', errorText)
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
    }

    const data: OllamaResponse = await response.json()
    
    console.log('✅ Ollama response received:', data.response.substring(0, 200) + '...')
    
    return data.response
  } catch (error) {
    console.error('❌ Ollama API error:', error)
    
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error('Ollama server not running. Please run: ollama serve')
    }
    
    throw new Error(`AI service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

  // Method to generate a quick test question
  async generateTestQuestion(): Promise<string> {
    const prompt = `Create a simple math question:

Question: What is 8 × 9?
A) 72
B) 81  
C) 64
D) 56

Correct Answer: A) 72

Format exactly like above.`

    return this.callOllama(prompt)
  }
}

export const aiService = new OllamaService()

// Test the connection when the service is imported
aiService.testConnection().then(result => {
  if (result.connected) {
    console.log('🚀 Ollama connected successfully! Available models:', result.models?.join(', '))
  } else {
    console.error('💥 Ollama connection failed:', result.error)
    console.log('💡 Make sure Ollama is running: ollama serve')
  }
}).catch(error => {
  console.error('🔥 Failed to test Ollama connection:', error)
})