// lib/ai/ollama-service.ts - Enhanced with OpenAI-style prompting

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

  // ENHANCED: OpenAI-style prompting with clear instructions and examples
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

    return this.buildGenericPrompt(subject, difficultyLevel, userLevel);
  }

  private buildMathPrompt(difficulty: number): string {
    // Define question types by difficulty with variety
    let questionTypes: string[] = [];
    let examples = '';
    
    if (difficulty <= 2) {
      questionTypes = ['single_digit_multiplication', 'single_digit_addition', 'basic_subtraction'];
      examples = `
EXAMPLE 1:
Question: What is 7 × 6?
A) 42
B) 36
C) 48  
D) 40
Correct Answer: A) 42

EXAMPLE 2:
Question: What is 15 + 23?
A) 38
B) 35
C) 42
D) 40
Correct Answer: A) 38`;
      
    } else if (difficulty <= 4) {
      questionTypes = ['two_digit_multiplication', 'division_with_remainder', 'basic_fractions'];
      examples = `
EXAMPLE 1:
Question: What is 24 × 3?
A) 72
B) 68
C) 76
D) 70
Correct Answer: A) 72

EXAMPLE 2:
Question: What is 84 ÷ 7?
A) 11
B) 12
C) 13
D) 14
Correct Answer: B) 12`;
      
    } else if (difficulty <= 6) {
      questionTypes = ['percentages', 'decimal_operations', 'fraction_to_decimal'];
      examples = `
EXAMPLE 1:
Question: What is 25% of 80?
A) 20
B) 15
C) 25
D) 30
Correct Answer: A) 20

EXAMPLE 2:
Question: Convert 3/4 to a decimal
A) 0.75
B) 0.34
C) 0.43
D) 0.67
Correct Answer: A) 0.75`;
      
    } else if (difficulty <= 8) {
      questionTypes = ['basic_algebra', 'geometry_area', 'compound_operations'];
      examples = `
EXAMPLE 1:
Question: If 2x + 5 = 17, what is x?
A) 6
B) 5
C) 7
D) 4
Correct Answer: A) 6

EXAMPLE 2:
Question: What is the area of a rectangle with length 8 and width 5?
A) 40
B) 26
C) 35
D) 45
Correct Answer: A) 40`;
      
    } else {
      questionTypes = ['quadratic_equations', 'advanced_geometry', 'logarithms'];
      examples = `
EXAMPLE 1:
Question: Solve x² - 5x + 6 = 0. What are the solutions?
A) x = 2, 3
B) x = 1, 6
C) x = -2, -3
D) x = 0, 5
Correct Answer: A) x = 2, 3`;
    }
    
    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    return `You are a precise math question generator. Create exactly one math question.

DIFFICULTY LEVEL: ${difficulty}/10
QUESTION TYPE: ${randomType}

STRICT REQUIREMENTS:
1. Generate a mathematically correct question and answer
2. Verify your math before providing the answer
3. Create exactly 4 answer choices labeled A), B), C), D)
4. Make one choice clearly correct, three clearly incorrect
5. Use clean formatting with no explanations in the choices
6. End with "Correct Answer: [LETTER]) [VALUE]"

${examples}

FORMATTING RULES:
- Question: [Clear, concise question]
- A) [First option - clean number/text only]
- B) [Second option - clean number/text only] 
- C) [Third option - clean number/text only]
- D) [Fourth option - clean number/text only]
- Correct Answer: [Letter]) [Exact value from choices]

MATH VERIFICATION REQUIRED:
- Double-check your arithmetic
- Ensure the correct answer actually solves the problem
- Make distractors plausible but clearly wrong

Now generate ONE ${randomType} question at difficulty ${difficulty}/10:`;
  }

  private buildSciencePrompt(difficulty: number, userLevel: string): string {
    let topics: string[] = [];
    let complexity = '';
    let examples = '';
    
    if (difficulty <= 3) {
      topics = ['basic_biology', 'simple_chemistry', 'weather', 'animals'];
      complexity = 'elementary level with simple vocabulary';
      examples = `
EXAMPLE:
Question: What gas do plants need for photosynthesis?
A) Carbon dioxide
B) Oxygen  
C) Nitrogen
D) Helium
Correct Answer: A) Carbon dioxide`;
      
    } else if (difficulty <= 5) {
      topics = ['human_body', 'states_of_matter', 'ecosystems', 'basic_physics'];
      complexity = 'middle school level with scientific terms';
      examples = `
EXAMPLE:
Question: Which organ is primarily responsible for filtering blood?
A) Heart
B) Liver
C) Kidneys
D) Lungs
Correct Answer: C) Kidneys`;
      
    } else if (difficulty <= 7) {
      topics = ['cellular_biology', 'chemical_reactions', 'genetics_basics', 'forces_motion'];
      complexity = 'high school level requiring deeper understanding';
      examples = `
EXAMPLE:
Question: In which phase of mitosis do chromosomes line up at the cell's equator?
A) Prophase
B) Metaphase
C) Anaphase  
D) Telophase
Correct Answer: B) Metaphase`;
      
    } else {
      topics = ['molecular_biology', 'advanced_chemistry', 'physics_concepts', 'biochemistry'];
      complexity = 'advanced level with complex scientific reasoning';
      examples = `
EXAMPLE:
Question: What type of bond forms between amino acids in protein synthesis?
A) Ionic bond
B) Hydrogen bond
C) Peptide bond
D) Covalent bond
Correct Answer: C) Peptide bond`;
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `You are an expert science educator creating assessment questions.

DIFFICULTY LEVEL: ${difficulty}/10
TOPIC: ${randomTopic}
COMPLEXITY: ${complexity}

REQUIREMENTS:
1. Create ONE scientifically accurate question
2. Ensure factual correctness - verify scientific facts
3. Use appropriate vocabulary for difficulty level ${difficulty}/10
4. Format exactly as shown below
5. Make distractors plausible but clearly incorrect

${examples}

STRICT FORMATTING:
- Question: [Clear, factual science question]
- A) [First option]
- B) [Second option]
- C) [Third option]
- D) [Fourth option]
- Correct Answer: [Letter]) [Exact text from correct choice]

SCIENTIFIC ACCURACY REQUIRED:
- Verify all facts are correct
- Use proper scientific terminology
- Ensure the correct answer is actually correct
- Make distractors scientifically plausible but wrong

Generate ONE ${randomTopic} question at ${complexity}:`;
  }

  private buildHistoryPrompt(difficulty: number, userLevel: string): string {
    let topics: string[] = [];
    let complexity = '';
    let examples = '';
    
    if (difficulty <= 3) {
      topics = ['famous_people', 'basic_dates', 'countries', 'simple_events'];
      complexity = 'basic historical facts';
      examples = `
EXAMPLE:
Question: Who was the first President of the United States?
A) George Washington
B) John Adams
C) Thomas Jefferson
D) Benjamin Franklin
Correct Answer: A) George Washington`;
      
    } else if (difficulty <= 5) {
      topics = ['wars_battles', 'ancient_civilizations', 'exploration', 'revolutions'];
      complexity = 'intermediate historical knowledge';
      examples = `
EXAMPLE:
Question: In which year did World War II end?
A) 1944
B) 1945
C) 1946
D) 1943
Correct Answer: B) 1945`;
      
    } else if (difficulty <= 7) {
      topics = ['political_systems', 'social_movements', 'economic_history', 'cultural_changes'];
      complexity = 'advanced historical analysis';
      examples = `
EXAMPLE:
Question: The Marshall Plan was primarily designed to:
A) Rebuild Europe after WWII
B) Contain communist expansion
C) Establish NATO alliance
D) Create the United Nations
Correct Answer: A) Rebuild Europe after WWII`;
      
    } else {
      topics = ['historiography', 'complex_causation', 'comparative_history', 'historical_methodology'];
      complexity = 'expert-level historical thinking';
      examples = `
EXAMPLE:
Question: Which factor most directly contributed to the decline of the Roman Empire?
A) Barbarian invasions alone
B) Economic inflation and taxation
C) Multiple interconnected factors
D) Loss of military discipline
Correct Answer: C) Multiple interconnected factors`;
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `You are a history expert creating educational assessments.

DIFFICULTY LEVEL: ${difficulty}/10
TOPIC: ${randomTopic}
COMPLEXITY: ${complexity}

REQUIREMENTS:
1. Create ONE historically accurate question
2. Verify all historical facts and dates
3. Use complexity appropriate for level ${difficulty}/10
4. Format exactly as specified
5. Make distractors historically plausible but incorrect

${examples}

STRICT FORMATTING:
- Question: [Clear, factual history question]
- A) [First option]
- B) [Second option] 
- C) [Third option]
- D) [Fourth option]
- Correct Answer: [Letter]) [Exact text from correct choice]

HISTORICAL ACCURACY REQUIRED:
- Double-check all dates and facts
- Ensure correct answer is factually accurate
- Make distractors plausible but wrong
- Use proper historical context

Generate ONE ${randomTopic} question with ${complexity}:`;
  }

  private buildEnglishPrompt(difficulty: number, userLevel: string): string {
    let topics: string[] = [];
    let complexity = '';
    let examples = '';
    
    if (difficulty <= 3) {
      topics = ['basic_vocabulary', 'simple_grammar', 'parts_of_speech'];
      complexity = 'elementary English skills';
      examples = `
EXAMPLE:
Question: What is a synonym for "happy"?
A) Joyful
B) Sad
C) Angry
D) Tired
Correct Answer: A) Joyful`;
      
    } else if (difficulty <= 5) {
      topics = ['synonyms_antonyms', 'sentence_structure', 'punctuation'];
      complexity = 'intermediate English knowledge';
      examples = `
EXAMPLE:
Question: Which sentence uses correct punctuation?
A) Hello, how are you today.
B) Hello how are you today?
C) Hello, how are you today?
D) Hello; how are you today.
Correct Answer: C) Hello, how are you today?`;
      
    } else if (difficulty <= 7) {
      topics = ['literary_devices', 'advanced_grammar', 'reading_comprehension'];
      complexity = 'advanced English skills';
      examples = `
EXAMPLE:
Question: In the phrase "The wind whispered through the trees," what literary device is used?
A) Metaphor
B) Personification
C) Alliteration
D) Hyperbole
Correct Answer: B) Personification`;
      
    } else {
      topics = ['rhetoric', 'literary_analysis', 'complex_composition'];
      complexity = 'expert-level English analysis';
      examples = `
EXAMPLE:
Question: Which rhetorical appeal primarily uses logic and reasoning?
A) Ethos
B) Pathos  
C) Logos
D) Kairos
Correct Answer: C) Logos`;
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `You are an English language expert creating educational questions.

DIFFICULTY LEVEL: ${difficulty}/10
TOPIC: ${randomTopic}
COMPLEXITY: ${complexity}

REQUIREMENTS:
1. Create ONE linguistically/grammatically correct question
2. Verify grammar and language rules
3. Use vocabulary appropriate for level ${difficulty}/10
4. Format exactly as specified
5. Make distractors plausible but clearly incorrect

${examples}

STRICT FORMATTING:
- Question: [Clear, well-written English question]
- A) [First option]
- B) [Second option]
- C) [Third option] 
- D) [Fourth option]
- Correct Answer: [Letter]) [Exact text from correct choice]

LANGUAGE ACCURACY REQUIRED:
- Verify grammar and spelling
- Ensure correct answer is actually correct
- Make distractors grammatically plausible but wrong
- Use appropriate vocabulary level

Generate ONE ${randomTopic} question with ${complexity}:`;
  }

  private buildGenericPrompt(subject: string, difficulty: number, userLevel: string): string {
    return `You are an expert educator creating assessment questions.

SUBJECT: ${subject}
DIFFICULTY LEVEL: ${difficulty}/10
USER LEVEL: ${userLevel}

REQUIREMENTS:
1. Create ONE factually correct question in ${subject}
2. Verify accuracy of content and answer
3. Use difficulty appropriate for level ${difficulty}/10
4. Format exactly as specified below
5. Make distractors plausible but clearly wrong

STRICT FORMATTING:
- Question: [Clear, educational question about ${subject}]
- A) [First option]
- B) [Second option]
- C) [Third option]
- D) [Fourth option]
- Correct Answer: [Letter]) [Exact text from correct choice]

ACCURACY REQUIRED:
- Double-check facts and content
- Ensure correct answer is factually accurate
- Make distractors believable but incorrect
- Use appropriate terminology for difficulty ${difficulty}/10

Generate ONE ${subject} question now:`;
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
      console.log('🤖 Calling Ollama with enhanced prompt:', prompt.substring(0, 200) + '...')

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
            temperature: 0.3, // Lower for more consistent formatting
            top_p: 0.8,
            top_k: 20,
            repeat_penalty: 1.2, // Higher to prevent repetition
            max_tokens: 300, // Shorter responses
            num_predict: 300,
            seed: Math.floor(Math.random() * 1000000),
            // Add formatting constraints
            stop: ["EXAMPLE:", "Note:", "Explanation:"] // Stop at these tokens
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ollama API error response:', errorText)
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
      }

      const data: OllamaResponse = await response.json()
      
      console.log('✅ Enhanced Ollama response received:', data.response.substring(0, 200) + '...')
      
      return data.response
    } catch (error) {
      console.error('❌ Ollama API error:', error)
      
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Ollama server not running. Please run: ollama serve')
      }
      
      throw new Error(`AI service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateTestQuestion(): Promise<string> {
    return this.buildMathPrompt(3)
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