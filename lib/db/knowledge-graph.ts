// lib/db/knowledge-graph.ts
import { db } from './index'

export class KnowledgeGraphService {
  
  /**
   * Get topic by subject and inferred topic name from question
   */
  static async getTopicByQuestion(subject: string, questionText: string, difficulty: number): Promise<any> {
    try {
      // Simple topic detection based on keywords in question
      const topicSlug = this.detectTopicFromQuestion(subject, questionText, difficulty)
      
      const query = `
        SELECT * FROM topics 
        WHERE topic_slug = $1 
        OR (subject = $2 AND difficulty_level <= $3)
        ORDER BY ABS(difficulty_level - $3) ASC
        LIMIT 1
      `
      
      const result = await db.query(query, [topicSlug, subject, difficulty])
      return result.rows[0] || null
      
    } catch (error) {
      console.error('Error getting topic:', error)
      return null
    }
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
  private static detectTopicFromQuestion(subject: string, questionText: string, difficulty: number): string {
    const text = questionText.toLowerCase()
    
    // Math topic detection
    if (subject === 'math') {
      if (text.includes('×') || text.includes('*') || text.includes('multiply') || text.includes('times')) {
        return difficulty < 0.3 ? 'math-basic-arithmetic' : 'math-basic-arithmetic'
      }
      if (text.includes('÷') || text.includes('divide')) return 'math-basic-arithmetic'
      if (text.includes('%') || text.includes('percent')) return 'math-percentages'
      if (text.includes('fraction') || text.includes('/')) return 'math-fractions'
      if (text.includes('decimal')) return 'math-decimals'
      if (text.includes('x =') || text.includes('solve') || text.includes('equation')) {
        return difficulty > 0.6 ? 'math-quadratic-equations' : 'math-linear-equations'
      }
      if (text.includes('area') || text.includes('perimeter') || text.includes('triangle')) return 'math-basic-geometry'
      if (text.includes('sin') || text.includes('cos') || text.includes('tan')) return 'math-trigonometry'
    }
    
    // Science topic detection
    if (subject === 'science') {
      if (text.includes('atom') || text.includes('element') || text.includes('periodic')) return 'science-atoms-elements'
      if (text.includes('bond') || text.includes('ionic') || text.includes('covalent')) return 'science-chemical-bonds'
      if (text.includes('reaction') || text.includes('equation') || text.includes('balance')) return 'science-chemical-reactions'
      if (text.includes('cell') || text.includes('mitosis') || text.includes('membrane')) return 'science-cell-structure'
      if (text.includes('photosynthesis') || text.includes('chlorophyll')) return 'science-photosynthesis'
      if (text.includes('force') || text.includes('motion') || text.includes('newton')) return 'science-forces-motion'
      if (text.includes('energy') || text.includes('kinetic') || text.includes('potential')) return 'science-energy'
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
    }
    
    // English topic detection
    if (subject === 'english') {
      if (text.includes('noun') || text.includes('verb') || text.includes('adjective')) return 'english-parts-speech'
      if (text.includes('sentence') || text.includes('subject') || text.includes('predicate')) return 'english-sentence-structure'
      if (text.includes('comma') || text.includes('period') || text.includes('punctuat')) return 'english-punctuation'
      if (text.includes('synonym') || text.includes('antonym') || text.includes('meaning')) return 'english-vocabulary-building'
      if (text.includes('metaphor') || text.includes('simile') || text.includes('symbol')) return 'english-literary-devices'
      if (text.includes('essay') || text.includes('paragraph') || text.includes('thesis')) return 'english-essay-writing'
    }
    
    // Default fallback based on difficulty
    const difficultyMap: Record<string, string> = {
      'math': difficulty < 0.3 ? 'math-basic-arithmetic' : difficulty < 0.6 ? 'math-basic-algebra' : 'math-quadratic-equations',
      'science': difficulty < 0.4 ? 'science-atoms-elements' : difficulty < 0.6 ? 'science-chemical-reactions' : 'science-genetics-basics',
      'history': difficulty < 0.4 ? 'history-ancient-civilizations' : difficulty < 0.7 ? 'history-medieval-period' : 'history-cold-war',
      'english': difficulty < 0.4 ? 'english-parts-speech' : difficulty < 0.7 ? 'english-writing-basics' : 'english-literature-analysis'
    }
    
    return difficultyMap[subject] || `${subject}-basic-topic`
  }
}