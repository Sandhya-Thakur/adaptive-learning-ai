// lib/db/knowledge-graph.ts
import { db } from './index'

export class KnowledgeGraphService {
  
  /**
   * Get topic by subject and inferred topic name from question
   */
 static async getTopicByQuestion(subject: string, questionText: string, difficulty: number): Promise<any> {
  try {
    const topicSlug = this.detectTopicFromQuestion(subject, questionText, difficulty)
    console.log(`🔍 Detected topic slug: ${topicSlug}`)
    
    // Try exact match first
    let query = `SELECT * FROM topics WHERE topic_slug = $1 LIMIT 1`
    let result = await db.query(query, [topicSlug])
    
    if (result.rows.length > 0) {
      console.log(`✅ Found exact match: ${result.rows[0].topic_name}`)
      return result.rows[0]
    }
    
    // Try partial keyword matching
    const keywords = topicSlug.split('-').filter(word => word.length > 2)
    const likePatterns = keywords.map(keyword => `%${keyword}%`)
    
    query = `
      SELECT * FROM topics 
      WHERE subject = $1 
        AND (topic_slug ILIKE ANY($2) OR topic_name ILIKE ANY($2))
      ORDER BY ABS(difficulty_level - $3) ASC
      LIMIT 1
    `
    
    result = await db.query(query, [subject, likePatterns, difficulty])
    
    if (result.rows.length > 0) {
      console.log(`✅ Found partial match: ${result.rows[0].topic_name}`)
      return result.rows[0]
    }
    
    // Create fallback topic if nothing found
    console.log(`⚠️ No match found, using fallback topic`)
    return {
      id: `fallback-${Date.now()}`,
      topic_name: this.generateTopicName(topicSlug),
      topic_slug: topicSlug,
      subject: subject,
      difficulty_level: difficulty
    }
    
  } catch (error) {
    console.error('Error getting topic:', error)
    return null
  }
}

private static generateTopicName(slug: string): string {
  return slug
    .replace(/^[^-]+-/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

  /**
   * Update user mastery for a topic based on quiz performance
   */
  static async updateTopicMastery(
    userId: string, 
    topicId: string, 
    isCorrect: boolean, 
    confidence: number = 0.5
  ): Promise<void> {
    try {
      // Get or create mastery record
      const existingMastery = await this.getUserTopicMastery(userId, topicId)
      
      if (existingMastery) {
        // Update existing mastery
        const newQuestionsAttempted = existingMastery.questions_attempted + 1
        const newQuestionsCorrect = existingMastery.questions_correct + (isCorrect ? 1 : 0)
        const newMasteryLevel = newQuestionsCorrect / newQuestionsAttempted
        const consecutiveCorrect = isCorrect ? existingMastery.consecutive_correct + 1 : 0
        
        const updateQuery = `
          UPDATE user_topic_mastery 
          SET 
            questions_attempted = $3,
            questions_correct = $4,
            mastery_level = $5,
            last_practiced = NOW(),
            consecutive_correct = $6,
            confidence_level = $7,
            updated_at = NOW()
          WHERE user_id = $1 AND topic_id = $2
        `
        
        await db.query(updateQuery, [
          userId, topicId, newQuestionsAttempted, newQuestionsCorrect, 
          newMasteryLevel, consecutiveCorrect, confidence
        ])
        
      } else {
        // Create new mastery record
        const insertQuery = `
          INSERT INTO user_topic_mastery (
            user_id, topic_id, questions_attempted, questions_correct,
            mastery_level, last_practiced, consecutive_correct, confidence_level
          ) VALUES ($1, $2, 1, $3, $4, NOW(), $5, $6)
        `
        
        await db.query(insertQuery, [
          userId, topicId, isCorrect ? 1 : 0, isCorrect ? 1.0 : 0.0, 
          isCorrect ? 1 : 0, confidence
        ])
      }
      
      console.log(`Topic mastery updated: User ${userId}, Topic ${topicId}, Correct: ${isCorrect}`)
      
    } catch (error) {
      console.error('Error updating topic mastery:', error)
    }
  }

  /**
   * Get user's mastery level for a specific topic
   */
  static async getUserTopicMastery(userId: string, topicId: string): Promise<any> {
    try {
      const query = `
        SELECT * FROM user_topic_mastery 
        WHERE user_id = $1 AND topic_id = $2
      `
      const result = await db.query(query, [userId, topicId])
      return result.rows[0] || null
    } catch (error) {
      console.error('Error getting user topic mastery:', error)
      return null
    }
  }

  /**
   * Get recommended next topics for a user based on prerequisites
   */
  static async getRecommendedTopics(userId: string, subject: string, limit: number = 5): Promise<any[]> {
    try {
      const query = `
        WITH user_mastery AS (
          SELECT topic_id, mastery_level 
          FROM user_topic_mastery 
          WHERE user_id = $1
        ),
        mastered_topics AS (
          SELECT topic_id 
          FROM user_mastery 
          WHERE mastery_level >= 0.8
        ),
        available_topics AS (
          SELECT t.*, 
            COALESCE(um.mastery_level, 0) as current_mastery,
            COUNT(tp.prerequisite_id) as total_prerequisites,
            COUNT(mt.topic_id) as mastered_prerequisites
          FROM topics t
          LEFT JOIN user_mastery um ON t.id = um.topic_id
          LEFT JOIN topic_prerequisites tp ON t.id = tp.topic_id
          LEFT JOIN mastered_topics mt ON tp.prerequisite_id = mt.topic_id
          WHERE t.subject = $2 
            AND COALESCE(um.mastery_level, 0) < 0.8  -- Not yet mastered
          GROUP BY t.id, t.topic_name, t.difficulty_level, um.mastery_level
        )
        SELECT * FROM available_topics
        WHERE total_prerequisites = 0 OR mastered_prerequisites = total_prerequisites
        ORDER BY difficulty_level ASC, current_mastery DESC
        LIMIT $3
      `
      
      const result = await db.query(query, [userId, subject, limit])
      return result.rows
      
    } catch (error) {
      console.error('Error getting recommended topics:', error)
      return []
    }
  }

  /**
   * Get user's learning pathway progress
   */
  static async getUserPathwayProgress(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          lp.*,
          upp.current_step,
          upp.progress_percentage,
          upp.started_at,
          upp.completed_at,
          COUNT(ps.id) as total_steps
        FROM learning_pathways lp
        LEFT JOIN user_pathway_progress upp ON lp.id = upp.pathway_id AND upp.user_id = $1
        LEFT JOIN pathway_steps ps ON lp.id = ps.pathway_id
        WHERE lp.is_active = true
        GROUP BY lp.id, upp.current_step, upp.progress_percentage, upp.started_at, upp.completed_at
        ORDER BY upp.started_at DESC NULLS LAST, lp.created_at DESC
      `
      
      const result = await db.query(query, [userId])
      return result.rows
      
    } catch (error) {
      console.error('Error getting pathway progress:', error)
      return []
    }
  }

  /**
   * Start a learning pathway for a user
   */
  static async startPathway(userId: string, pathwayId: string): Promise<boolean> {
    try {
      const insertQuery = `
        INSERT INTO user_pathway_progress (user_id, pathway_id, current_step, started_at)
        VALUES ($1, $2, 1, NOW())
        ON CONFLICT (user_id, pathway_id) 
        DO UPDATE SET is_active = true, started_at = NOW()
      `
      
      await db.query(insertQuery, [userId, pathwayId])
      return true
      
    } catch (error) {
      console.error('Error starting pathway:', error)
      return false
    }
  }

  /**
   * Get topics that are prerequisites for a given topic
   */
  static async getTopicPrerequisites(topicId: string): Promise<any[]> {
    try {
      const query = `
        SELECT t.*, tp.strength, tp.prerequisite_type
        FROM topics t
        JOIN topic_prerequisites tp ON t.id = tp.prerequisite_id
        WHERE tp.topic_id = $1
        ORDER BY tp.strength DESC, t.difficulty_level ASC
      `
      
      const result = await db.query(query, [topicId])
      return result.rows
      
    } catch (error) {
      console.error('Error getting prerequisites:', error)
      return []
    }
  }

  /**
   * Get user's overall subject progress with topic breakdown
   */
  static async getSubjectProgressWithTopics(userId: string, subject: string): Promise<any> {
    try {
      const query = `
        SELECT 
          t.*,
          COALESCE(utm.mastery_level, 0) as mastery_level,
          COALESCE(utm.questions_attempted, 0) as questions_attempted,
          COALESCE(utm.questions_correct, 0) as questions_correct,
          utm.last_practiced,
          utm.confidence_level
        FROM topics t
        LEFT JOIN user_topic_mastery utm ON t.id = utm.topic_id AND utm.user_id = $1
        WHERE t.subject = $2
        ORDER BY t.difficulty_level ASC, t.topic_name ASC
      `
      
      const result = await db.query(query, [userId, subject])
      
      const topics = result.rows
      const totalTopics = topics.length
      const masteredTopics = topics.filter(t => t.mastery_level >= 0.8).length
      const overallProgress = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0
      
      return {
        subject,
        overallProgress,
        totalTopics,
        masteredTopics,
        topics
      }
      
    } catch (error) {
      console.error('Error getting subject progress:', error)
      return { subject, overallProgress: 0, totalTopics: 0, masteredTopics: 0, topics: [] }
    }
  }

  /**
   * Simple topic detection from question text and subject
   */
 /**
 * Enhanced topic detection from question text and subject
 */
private static detectTopicFromQuestion(subject: string, questionText: string, difficulty: number): string {
  const text = questionText.toLowerCase()
  
  console.log(`🔍 Detecting topic for: "${questionText.substring(0, 60)}..."`);
  
  // Math topic detection
  if (subject === 'math') {
    if (text.includes('×') || text.includes('*') || text.includes('multiply') || text.includes('times')) {
      return difficulty < 3 ? 'math-basic-arithmetic' : 'math-basic-arithmetic'
    }
    if (text.includes('÷') || text.includes('divide') || text.includes('division')) return 'math-basic-arithmetic'
    if (text.includes('%') || text.includes('percent')) return 'math-percentages'
    if (text.includes('fraction') || text.includes('/') || text.includes('decimal')) return 'math-fractions'
    if (text.includes('x =') || text.includes('solve') || text.includes('equation') || text.includes('x +') || text.includes('x -')) {
      return difficulty > 6 ? 'math-quadratic-equations' : 'math-linear-equations'
    }
    if (text.includes('area') || text.includes('perimeter') || text.includes('triangle') || text.includes('circle')) return 'math-basic-geometry'
    if (text.includes('sin') || text.includes('cos') || text.includes('tan') || text.includes('trigonometry')) return 'math-trigonometry'
    
    // Default math fallback
    return difficulty < 3 ? 'math-basic-arithmetic' : difficulty < 6 ? 'math-basic-algebra' : 'math-quadratic-equations'
  }
  
  // Science topic detection with more comprehensive keywords
  if (subject === 'science') {
    // Chemical Reactions
    if (text.includes('reaction') || text.includes('sodium') || text.includes('reacts with') || 
        text.includes('chemical') || text.includes('displacement') || text.includes('synthesis') ||
        text.includes('decomposition') || text.includes('produces') || text.includes('reactant')) {
      console.log(`✅ Detected: Chemical Reactions`);
      return 'science-chemical-reactions'
    }
    
    // Catalysts and Enzymes
    if (text.includes('catalyst') || text.includes('enzyme') || text.includes('activation energy') ||
        text.includes('rate of reaction') || text.includes('enzymatic') || text.includes('catalytic') ||
        text.includes('lowers') || text.includes('increases rate') || text.includes('without being consumed')) {
      console.log(`✅ Detected: Catalysts and Enzymes`);
      return 'science-catalysts-enzymes'
    }
    
    // Physics - Energy and Motion
    if (text.includes('kinetic energy') || text.includes('potential energy') || text.includes('energy') ||
        text.includes('accelerates') || text.includes('velocity') || text.includes('motion') ||
        text.includes('rest') || text.includes('conservation') || text.includes('mechanical')) {
      console.log(`✅ Detected: Physics Energy`);
      return 'science-physics-energy'
    }
    
    // Thermodynamics
    if (text.includes('thermodynamics') || text.includes('entropy') || text.includes('adiabatic') ||
        text.includes('expansion') || text.includes('heat transfer') || text.includes('internal energy')) {
      console.log(`✅ Detected: Thermodynamics`);
      return 'science-thermodynamics'
    }
    
    // Molecular Biology
    if (text.includes('dna') || text.includes('recombination') || text.includes('chromosome') ||
        text.includes('molecular biology') || text.includes('holliday junction') || text.includes('strand invasion') ||
        text.includes('homologous') || text.includes('triplex') || text.includes('quadruplex')) {
      console.log(`✅ Detected: Molecular Biology`);
      return 'science-molecular-biology'
    }
    
    // Cell Biology
    if (text.includes('cell') || text.includes('mitosis') || text.includes('membrane') ||
        text.includes('cytoplasm') || text.includes('nucleus') || text.includes('organelle')) {
      console.log(`✅ Detected: Cell Biology`);
      return 'science-cell-structure'
    }
    
    // Basic Chemistry
    if (text.includes('atom') || text.includes('element') || text.includes('periodic') ||
        text.includes('chemical symbol') || text.includes('compound')) {
      console.log(`✅ Detected: Basic Chemistry`);
      return 'science-atoms-elements'
    }
    
    // Forces and Motion
    if (text.includes('force') || text.includes('newton') || text.includes('friction') ||
        text.includes('gravity') || text.includes('acceleration')) {
      console.log(`✅ Detected: Forces and Motion`);
      return 'science-forces-motion'
    }
    
    // Default science fallback based on difficulty
    const scienceDefault = difficulty < 4 ? 'science-atoms-elements' : 
                          difficulty < 7 ? 'science-chemical-reactions' : 
                          'science-molecular-biology';
    console.log(`⚠️ Using science default: ${scienceDefault}`);
    return scienceDefault
  }
  
  // History topic detection
  if (subject === 'history') {
    if (text.includes('ancient') || text.includes('egypt') || text.includes('mesopotamia')) return 'history-ancient-civilizations'
    if (text.includes('rome') || text.includes('greece') || text.includes('classical')) return 'history-classical-antiquity'
    if (text.includes('medieval') || text.includes('middle age')) return 'history-medieval-period'
    if (text.includes('renaissance') || text.includes('leonardo')) return 'history-renaissance'
    if (text.includes('world war') || text.includes('wwi') || text.includes('ww1')) return 'history-world-war-1'
    if (text.includes('world war') || text.includes('wwii') || text.includes('ww2')) return 'history-world-war-2'
    if (text.includes('cold war') || text.includes('soviet')) return 'history-cold-war'
    
    // Default history fallback
    return difficulty < 4 ? 'history-ancient-civilizations' : 
           difficulty < 7 ? 'history-medieval-period' : 'history-cold-war'
  }
  
  // English topic detection
  if (subject === 'english') {
    if (text.includes('noun') || text.includes('verb') || text.includes('adjective') || 
        text.includes('parts of speech') || text.includes('adverb')) return 'english-parts-speech'
    if (text.includes('sentence') || text.includes('subject') || text.includes('predicate') ||
        text.includes('clause') || text.includes('phrase')) return 'english-sentence-structure'
    if (text.includes('comma') || text.includes('period') || text.includes('punctuat') ||
        text.includes('semicolon') || text.includes('apostrophe')) return 'english-punctuation'
    if (text.includes('synonym') || text.includes('antonym') || text.includes('meaning') ||
        text.includes('definition') || text.includes('vocabulary')) return 'english-vocabulary-building'
    if (text.includes('metaphor') || text.includes('simile') || text.includes('symbol') ||
        text.includes('literary') || text.includes('figurative')) return 'english-literary-devices'
    if (text.includes('essay') || text.includes('paragraph') || text.includes('thesis') ||
        text.includes('writing') || text.includes('composition')) return 'english-essay-writing'
    
    // Default english fallback
    return difficulty < 4 ? 'english-parts-speech' : 
           difficulty < 7 ? 'english-writing-basics' : 'english-literature-analysis'
  }
  
  // Final fallback
  const finalDefault = `${subject}-basic-topic`;
  console.log(`⚠️ Using final default: ${finalDefault}`);
  return finalDefault
}
}