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

  // FIXED: Now properly scales difficulty for each subject
  private buildQuestionPrompt(subject: string, difficulty: number, userLevel: string): string {
    const difficultyLevel = Math.max(1, Math.min(10, Math.round(difficulty)));
    console.log(`🎯 Generating ${subject} question at difficulty ${difficultyLevel}/10`);
    
    if (subject === 'math') {
      return this.buildMathPrompt(difficultyLevel);
    }
    
    if (subject === 'science') {
      return this.buildSciencePrompt(difficultyLevel, userLevel);
    }
    
    if (subject === 'history') {
      return this.buildHistoryPrompt(difficultyLevel, userLevel);
    }
    
    if (subject === 'english') {
      return this.buildEnglishPrompt(difficultyLevel, userLevel);
    }

    // Fallback with proper difficulty scaling
    return this.buildGenericPrompt(subject, difficultyLevel, userLevel);
  }

  private buildMathPrompt(difficulty: number): string {
    let mathContent = '';
    
    if (difficulty <= 2) {
      // Easy: Single digit multiplication
      const num1 = Math.floor(Math.random() * 7) + 2; // 2-8
      const num2 = Math.floor(Math.random() * 7) + 2; // 2-8
      const answer = num1 * num2;
      
      mathContent = `
Question: What is ${num1} × ${num2}?
Topic: Basic multiplication
Difficulty: Easy (${difficulty}/10)
Answer: ${answer}`;
      
    } else if (difficulty <= 4) {
      // Medium-Easy: Two digit multiplication or division
      const num1 = Math.floor(Math.random() * 90) + 10; // 10-99
      const num2 = Math.floor(Math.random() * 9) + 2;   // 2-10
      const operation = Math.random() > 0.5 ? '×' : '÷';
      
      if (operation === '×') {
        const answer = num1 * num2;
        mathContent = `
Question: What is ${num1} × ${num2}?
Topic: Two-digit multiplication
Difficulty: Medium-Easy (${difficulty}/10)
Answer: ${answer}`;
      } else {
        // Make sure division works out evenly
        const answer = num2;
        const dividend = num1 * num2;
        mathContent = `
Question: What is ${dividend} ÷ ${num1}?
Topic: Division
Difficulty: Medium-Easy (${difficulty}/10)
Answer: ${answer}`;
      }
      
    } else if (difficulty <= 6) {
      // Medium: Fractions, decimals, or percentages
      const topics = ['fractions', 'decimals', 'percentages'];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      if (topic === 'fractions') {
        const num1 = Math.floor(Math.random() * 8) + 1;
        const den1 = Math.floor(Math.random() * 8) + 2;
        mathContent = `
Question: Convert the fraction ${num1}/${den1} to a decimal (round to 2 places)
Topic: Fraction to decimal conversion
Difficulty: Medium (${difficulty}/10)
Answer: ${(num1/den1).toFixed(2)}`;
      } else if (topic === 'percentages') {
        const percentage = Math.floor(Math.random() * 80) + 10;
        const total = Math.floor(Math.random() * 90) + 10;
        const answer = Math.round((percentage / 100) * total);
        mathContent = `
Question: What is ${percentage}% of ${total}?
Topic: Percentage calculation
Difficulty: Medium (${difficulty}/10)
Answer: ${answer}`;
      }
      
    } else if (difficulty <= 8) {
      // Hard: Algebra or geometry
      const topics = ['algebra', 'geometry'];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      if (topic === 'algebra') {
        const a = Math.floor(Math.random() * 5) + 2;
        const b = Math.floor(Math.random() * 10) + 5;
        const answer = Math.round((b - 1) / a);
        mathContent = `
Question: Solve for x: ${a}x + 1 = ${b}
Topic: Linear algebra
Difficulty: Hard (${difficulty}/10)
Answer: x = ${answer}`;
      } else {
        const radius = Math.floor(Math.random() * 8) + 3;
        const area = Math.round(Math.PI * radius * radius * 100) / 100;
        mathContent = `
Question: What is the area of a circle with radius ${radius} units? (Use π ≈ 3.14)
Topic: Circle geometry
Difficulty: Hard (${difficulty}/10)
Answer: ${area} square units`;
      }
      
    } else {
      // Very Hard: Advanced topics
      const topics = ['quadratic', 'trigonometry', 'logarithms'];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      mathContent = `
Question: Advanced ${topic} problem
Topic: ${topic}
Difficulty: Very Hard (${difficulty}/10)
Note: Generate an appropriate ${topic} question for advanced students`;
    }

    return `Create a math question with these specifications:
${mathContent}

REQUIREMENTS:
- Generate exactly this difficulty level: ${difficulty}/10
- Provide exactly 4 answer choices labeled A, B, C, D
- Make one answer clearly correct
- Create 3 plausible but incorrect distractors
- Show your work/explanation if complex

FORMAT:
Question: [The question]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]

Correct Answer: [Letter]) [Value]

Generate this math question now:`;
  }

  private buildSciencePrompt(difficulty: number, userLevel: string): string {
    let topics: string[] = [];
    let complexityNote = '';
    
    if (difficulty <= 3) {
      topics = ['basic animals', 'weather', 'plants', 'colors in nature', 'day and night'];
      complexityNote = 'Keep it simple with basic facts and observations.';
    } else if (difficulty <= 5) {
      topics = ['states of matter', 'animal habitats', 'food chains', 'planets', 'human body systems'];
      complexityNote = 'Include some scientific terminology but keep explanations clear.';
    } else if (difficulty <= 7) {
      topics = ['chemical reactions', 'ecosystems', 'genetics basics', 'physics forces', 'cell biology'];
      complexityNote = 'Use proper scientific terms and require deeper understanding.';
    } else {
      topics = ['molecular biology', 'quantum physics basics', 'advanced chemistry', 'complex ecosystems', 'astrophysics'];
      complexityNote = 'Advanced concepts requiring scientific reasoning and analysis.';
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `Create a science question about ${randomTopic} for difficulty level ${difficulty}/10.

DIFFICULTY REQUIREMENTS:
- Level: ${difficulty}/10 (${difficulty <= 3 ? 'Easy' : difficulty <= 5 ? 'Medium' : difficulty <= 7 ? 'Hard' : 'Very Hard'})
- Topic: ${randomTopic}
- ${complexityNote}
- Age level: ${userLevel}

FORMAT REQUIREMENTS:
- Exactly 4 answer choices labeled A, B, C, D
- One clearly correct answer
- Educational and scientifically accurate

Create this science question now:`;
  }

  private buildHistoryPrompt(difficulty: number, userLevel: string): string {
    let topics: string[] = [];
    let complexityNote = '';
    
    if (difficulty <= 3) {
      topics = ['famous leaders', 'basic dates', 'countries and flags', 'simple inventions'];
      complexityNote = 'Focus on well-known facts and basic chronology.';
    } else if (difficulty <= 5) {
      topics = ['wars and battles', 'ancient civilizations', 'exploration', 'cultural movements'];
      complexityNote = 'Include causes, effects, and connections between events.';
    } else if (difficulty <= 7) {
      topics = ['political systems', 'economic history', 'social movements', 'diplomatic relations'];
      complexityNote = 'Require analysis of complex historical relationships and impacts.';
    } else {
      topics = ['historiography', 'comparative civilizations', 'historical methodology', 'complex causation'];
      complexityNote = 'Advanced historical thinking and interpretation required.';
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `Create a history question about ${randomTopic} for difficulty level ${difficulty}/10.

DIFFICULTY REQUIREMENTS:
- Level: ${difficulty}/10 (${difficulty <= 3 ? 'Easy' : difficulty <= 5 ? 'Medium' : difficulty <= 7 ? 'Hard' : 'Very Hard'})
- Topic: ${randomTopic}
- ${complexityNote}
- Age level: ${userLevel}

FORMAT REQUIREMENTS:
- Exactly 4 answer choices labeled A, B, C, D
- One clearly correct answer
- Historically accurate

Create this history question now:`;
  }

  private buildEnglishPrompt(difficulty: number, userLevel: string): string {
    let topics: string[] = [];
    let complexityNote = '';
    
    if (difficulty <= 3) {
      topics = ['basic vocabulary', 'simple grammar', 'spelling', 'sentence structure'];
      complexityNote = 'Use common words and straightforward concepts.';
    } else if (difficulty <= 5) {
      topics = ['synonyms/antonyms', 'punctuation', 'parts of speech', 'reading comprehension'];
      complexityNote = 'Include moderate vocabulary and grammar rules.';
    } else if (difficulty <= 7) {
      topics = ['advanced grammar', 'literary devices', 'complex vocabulary', 'writing techniques'];
      complexityNote = 'Require understanding of nuanced language concepts.';
    } else {
      topics = ['literary analysis', 'rhetoric', 'advanced composition', 'linguistic patterns'];
      complexityNote = 'Advanced language arts requiring critical thinking and analysis.';
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `Create an English question about ${randomTopic} for difficulty level ${difficulty}/10.

DIFFICULTY REQUIREMENTS:
- Level: ${difficulty}/10 (${difficulty <= 3 ? 'Easy' : difficulty <= 5 ? 'Medium' : difficulty <= 7 ? 'Hard' : 'Very Hard'})
- Topic: ${randomTopic}
- ${complexityNote}
- Age level: ${userLevel}

FORMAT REQUIREMENTS:
- Exactly 4 answer choices labeled A, B, C, D
- One clearly correct answer
- Educationally appropriate

Create this English question now:`;
  }

  private buildGenericPrompt(subject: string, difficulty: number, userLevel: string): string {
    const randomSeed = Math.floor(Math.random() * 1000);
    
    return `Create a ${subject} question for difficulty level ${difficulty}/10.

DIFFICULTY REQUIREMENTS:
- Exact difficulty: ${difficulty}/10
- Make it appropriately challenging for this level
- User level: ${userLevel}
- Question ID: #${randomSeed}

CONTENT REQUIREMENTS:
- Subject: ${subject}
- Exactly 4 answer choices (A, B, C, D)
- One clearly correct answer
- Educational and engaging
- Appropriate for difficulty level ${difficulty}/10

Create question #${randomSeed} now:`;
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
            temperature: 0.7, // Good variety
            top_p: 0.9,
            top_k: 40, 
            repeat_penalty: 1.1,
            max_tokens: 500,
            num_predict: 500,
            seed: Math.floor(Math.random() * 1000000) // Random seed each time
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