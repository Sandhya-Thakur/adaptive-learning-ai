interface OllamaResponse {
  model: string
  response: string
  done: boolean
}

class OllamaService {
  private baseUrl = 'http://localhost:11434'
  private model = 'llama3.1'  // ✅ Updated from gemma3:27b

  async generateQuizQuestion(subject: string, difficulty: number, userLevel: string): Promise<string> {
    const prompt = `Create a ${subject} question for a ${userLevel} level student. 
    Difficulty level: ${difficulty}/10
    Format: Question, 4 multiple choice options (A,B,C,D), correct answer
    Make it educational and engaging.`

    return this.callOllama(prompt)
  }

  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,  // ✅ Now uses llama3.1
          prompt: prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: OllamaResponse = await response.json()
      return data.response
    } catch (error) {
      console.error('Ollama API error:', error)
      throw new Error('AI service unavailable')
    }
  }
}

export const aiService = new OllamaService()