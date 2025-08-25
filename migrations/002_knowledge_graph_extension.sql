-- Knowledge Graph Extension for AdaptiveLearn AI
-- Run this after your existing schema to add knowledge graph capabilities

-- Topics table: Individual learning concepts/topics
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject VARCHAR(100) NOT NULL, -- Links to your existing subject column
  topic_name VARCHAR(200) NOT NULL, -- 'Linear Equations', 'Photosynthesis', etc.
  topic_slug VARCHAR(200) UNIQUE NOT NULL, -- 'math-linear-equations'
  description TEXT,
  difficulty_level DECIMAL(3,2) NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  estimated_time_minutes INTEGER DEFAULT 30,
  topic_type VARCHAR(50) DEFAULT 'concept', -- 'concept', 'skill', 'application'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prerequisites table: Defines which topics must be learned before others
CREATE TABLE IF NOT EXISTS topic_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  prerequisite_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  strength DECIMAL(3,2) DEFAULT 1.0, -- How strongly required (0.0-1.0)
  prerequisite_type VARCHAR(50) DEFAULT 'required', -- 'required', 'recommended', 'helpful'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(topic_id, prerequisite_id),
  CHECK (topic_id != prerequisite_id)
);

-- User topic mastery: Track individual progress on each topic
CREATE TABLE IF NOT EXISTS user_topic_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  mastery_level DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 (0% to 100%)
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_practiced TIMESTAMP,
  first_encountered TIMESTAMP DEFAULT NOW(),
  
  -- Spaced repetition data (for future use)
  next_review_date TIMESTAMP,
  review_interval_days INTEGER DEFAULT 1,
  ease_factor DECIMAL(4,2) DEFAULT 2.5,
  consecutive_correct INTEGER DEFAULT 0,
  
  -- Knowledge retention tracking
  forgetting_curve_data JSONB DEFAULT '{}',
  confidence_level DECIMAL(3,2) DEFAULT 0.5,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Learning pathways: Suggested sequences of topics
CREATE TABLE IF NOT EXISTS learning_pathways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pathway_name VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty_level VARCHAR(50) DEFAULT 'intermediate',
  estimated_duration_hours INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pathway steps: Individual topics within a pathway
CREATE TABLE IF NOT EXISTS pathway_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pathway_id UUID REFERENCES learning_pathways(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  unlock_criteria JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pathway_id, topic_id),
  UNIQUE(pathway_id, step_order)
);

-- User pathway progress: Track progress through pathways
CREATE TABLE IF NOT EXISTS user_pathway_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pathway_id UUID REFERENCES learning_pathways(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, pathway_id)
);

-- Link existing questions to topics (add topic_id column to questions)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject);
CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON topics(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(topic_slug);
CREATE INDEX IF NOT EXISTS idx_prerequisites_topic ON topic_prerequisites(topic_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_prereq ON topic_prerequisites(prerequisite_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_user ON user_topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_topic ON user_topic_mastery(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_review ON user_topic_mastery(next_review_date);
CREATE INDEX IF NOT EXISTS idx_pathway_steps_pathway ON pathway_steps(pathway_id);
CREATE INDEX IF NOT EXISTS idx_user_pathway_user ON user_pathway_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);

-- Insert sample math topics with proper difficulty progression
INSERT INTO topics (subject, topic_name, topic_slug, description, difficulty_level, estimated_time_minutes) VALUES
('math', 'Basic Arithmetic', 'math-basic-arithmetic', 'Addition, subtraction, multiplication, division of whole numbers', 0.1, 20),
('math', 'Fractions', 'math-fractions', 'Understanding and operations with fractions', 0.2, 30),
('math', 'Decimals', 'math-decimals', 'Decimal operations and conversions', 0.2, 25),
('math', 'Percentages', 'math-percentages', 'Percentage calculations and applications', 0.3, 35),
('math', 'Basic Algebra', 'math-basic-algebra', 'Introduction to variables and simple equations', 0.4, 45),
('math', 'Linear Equations', 'math-linear-equations', 'Solving and graphing linear equations', 0.5, 50),
('math', 'Quadratic Equations', 'math-quadratic-equations', 'Solving quadratic equations using various methods', 0.6, 60),
('math', 'Basic Geometry', 'math-basic-geometry', 'Area, perimeter, and properties of shapes', 0.4, 40),
('math', 'Coordinate Geometry', 'math-coordinate-geometry', 'Graphing points and lines on coordinate plane', 0.5, 45),
('math', 'Trigonometry', 'math-trigonometry', 'Sine, cosine, tangent and their applications', 0.7, 70),
('math', 'Functions', 'math-functions', 'Understanding and working with mathematical functions', 0.6, 55),
('math', 'Polynomials', 'math-polynomials', 'Operations with polynomial expressions', 0.6, 50),
('math', 'Calculus Basics', 'math-calculus-basics', 'Introduction to limits, derivatives, and integrals', 0.8, 90)
ON CONFLICT (topic_slug) DO NOTHING;

-- Insert science topics
INSERT INTO topics (subject, topic_name, topic_slug, description, difficulty_level, estimated_time_minutes) VALUES
('science', 'Atoms and Elements', 'science-atoms-elements', 'Basic atomic structure and periodic table', 0.3, 40),
('science', 'Chemical Bonds', 'science-chemical-bonds', 'Ionic, covalent, and metallic bonding', 0.4, 45),
('science', 'Chemical Reactions', 'science-chemical-reactions', 'Types of reactions and balancing equations', 0.5, 55),
('science', 'States of Matter', 'science-states-matter', 'Solid, liquid, gas, and phase transitions', 0.2, 30),
('science', 'Acids and Bases', 'science-acids-bases', 'pH scale and acid-base reactions', 0.4, 40),
('science', 'Cell Structure', 'science-cell-structure', 'Parts and functions of plant and animal cells', 0.3, 35),
('science', 'Photosynthesis', 'science-photosynthesis', 'How plants convert sunlight to energy', 0.4, 35),
('science', 'Cell Division', 'science-cell-division', 'Mitosis and meiosis processes', 0.6, 50),
('science', 'Genetics Basics', 'science-genetics-basics', 'DNA, genes, and inheritance patterns', 0.5, 45),
('science', 'Forces and Motion', 'science-forces-motion', 'Newton''s laws and basic mechanics', 0.4, 45),
('science', 'Energy', 'science-energy', 'Forms of energy and energy transformations', 0.4, 40),
('science', 'Waves and Sound', 'science-waves-sound', 'Properties of waves and sound phenomena', 0.5, 50),
('science', 'Electricity and Magnetism', 'science-electricity-magnetism', 'Electric circuits and magnetic fields', 0.6, 60)
ON CONFLICT (topic_slug) DO NOTHING;

-- Insert history topics
INSERT INTO topics (subject, topic_name, topic_slug, description, difficulty_level, estimated_time_minutes) VALUES
('history', 'Ancient Civilizations', 'history-ancient-civilizations', 'Early human societies and their development', 0.3, 40),
('history', 'Classical Antiquity', 'history-classical-antiquity', 'Greek and Roman civilizations', 0.4, 45),
('history', 'Medieval Period', 'history-medieval-period', 'Middle Ages in Europe and beyond', 0.4, 50),
('history', 'Renaissance', 'history-renaissance', 'Cultural and artistic rebirth in Europe', 0.5, 45),
('history', 'Age of Exploration', 'history-age-exploration', 'European exploration and colonization', 0.5, 50),
('history', 'Industrial Revolution', 'history-industrial-revolution', 'Technological and social changes 1750-1850', 0.6, 55),
('history', 'World War I', 'history-world-war-1', 'Causes, events, and consequences of WWI', 0.6, 60),
('history', 'World War II', 'history-world-war-2', 'Causes, events, and consequences of WWII', 0.6, 65),
('history', 'Cold War', 'history-cold-war', 'Post-WWII tension between superpowers', 0.7, 70),
('history', 'Modern History', 'history-modern-history', 'Contemporary global developments', 0.7, 60)
ON CONFLICT (topic_slug) DO NOTHING;

-- Insert English topics
INSERT INTO topics (subject, topic_name, topic_slug, description, difficulty_level, estimated_time_minutes) VALUES
('english', 'Parts of Speech', 'english-parts-speech', 'Nouns, verbs, adjectives, and other word types', 0.2, 30),
('english', 'Sentence Structure', 'english-sentence-structure', 'Building grammatically correct sentences', 0.3, 35),
('english', 'Punctuation', 'english-punctuation', 'Proper use of commas, periods, and other marks', 0.3, 30),
('english', 'Vocabulary Building', 'english-vocabulary-building', 'Expanding word knowledge and usage', 0.4, 40),
('english', 'Reading Comprehension', 'english-reading-comprehension', 'Understanding and analyzing texts', 0.5, 45),
('english', 'Writing Basics', 'english-writing-basics', 'Paragraph structure and essay organization', 0.5, 50),
('english', 'Literary Devices', 'english-literary-devices', 'Metaphor, simile, symbolism, and other techniques', 0.6, 45),
('english', 'Poetry Analysis', 'english-poetry-analysis', 'Understanding poetic forms and meanings', 0.6, 50),
('english', 'Essay Writing', 'english-essay-writing', 'Advanced composition and argumentation', 0.7, 60),
('english', 'Literature Analysis', 'english-literature-analysis', 'Critical analysis of literary works', 0.7, 65)
ON CONFLICT (topic_slug) DO NOTHING;

-- Insert prerequisite relationships for math (logical progression)
INSERT INTO topic_prerequisites (topic_id, prerequisite_id, strength, prerequisite_type)
SELECT 
  t1.id as topic_id, 
  t2.id as prerequisite_id,
  1.0 as strength,
  'required' as prerequisite_type
FROM topics t1, topics t2 
WHERE (t1.topic_slug, t2.topic_slug) IN (
  ('math-fractions', 'math-basic-arithmetic'),
  ('math-decimals', 'math-basic-arithmetic'),
  ('math-percentages', 'math-fractions'),
  ('math-percentages', 'math-decimals'),
  ('math-basic-algebra', 'math-basic-arithmetic'),
  ('math-linear-equations', 'math-basic-algebra'),
  ('math-quadratic-equations', 'math-linear-equations'),
  ('math-basic-geometry', 'math-basic-arithmetic'),
  ('math-coordinate-geometry', 'math-basic-geometry'),
  ('math-coordinate-geometry', 'math-linear-equations'),
  ('math-functions', 'math-linear-equations'),
  ('math-polynomials', 'math-basic-algebra'),
  ('math-trigonometry', 'math-coordinate-geometry'),
  ('math-trigonometry', 'math-functions'),
  ('math-calculus-basics', 'math-functions'),
  ('math-calculus-basics', 'math-trigonometry')
)
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Insert prerequisite relationships for science
INSERT INTO topic_prerequisites (topic_id, prerequisite_id, strength, prerequisite_type)
SELECT 
  t1.id as topic_id, 
  t2.id as prerequisite_id,
  1.0 as strength,
  'required' as prerequisite_type
FROM topics t1, topics t2 
WHERE (t1.topic_slug, t2.topic_slug) IN (
  ('science-chemical-bonds', 'science-atoms-elements'),
  ('science-chemical-reactions', 'science-chemical-bonds'),
  ('science-acids-bases', 'science-chemical-reactions'),
  ('science-photosynthesis', 'science-cell-structure'),
  ('science-photosynthesis', 'science-chemical-reactions'),
  ('science-cell-division', 'science-cell-structure'),
  ('science-genetics-basics', 'science-cell-division'),
  ('science-waves-sound', 'science-energy'),
  ('science-electricity-magnetism', 'science-forces-motion')
)
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Insert prerequisite relationships for history (chronological)
INSERT INTO topic_prerequisites (topic_id, prerequisite_id, strength, prerequisite_type)
SELECT 
  t1.id as topic_id, 
  t2.id as prerequisite_id,
  0.8 as strength,
  'recommended' as prerequisite_type
FROM topics t1, topics t2 
WHERE (t1.topic_slug, t2.topic_slug) IN (
  ('history-classical-antiquity', 'history-ancient-civilizations'),
  ('history-medieval-period', 'history-classical-antiquity'),
  ('history-renaissance', 'history-medieval-period'),
  ('history-age-exploration', 'history-renaissance'),
  ('history-industrial-revolution', 'history-age-exploration'),
  ('history-world-war-1', 'history-industrial-revolution'),
  ('history-world-war-2', 'history-world-war-1'),
  ('history-cold-war', 'history-world-war-2'),
  ('history-modern-history', 'history-cold-war')
)
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Insert prerequisite relationships for English
INSERT INTO topic_prerequisites (topic_id, prerequisite_id, strength, prerequisite_type)
SELECT 
  t1.id as topic_id, 
  t2.id as prerequisite_id,
  1.0 as strength,
  'required' as prerequisite_type
FROM topics t1, topics t2 
WHERE (t1.topic_slug, t2.topic_slug) IN (
  ('english-sentence-structure', 'english-parts-speech'),
  ('english-punctuation', 'english-sentence-structure'),
  ('english-reading-comprehension', 'english-vocabulary-building'),
  ('english-writing-basics', 'english-sentence-structure'),
  ('english-writing-basics', 'english-punctuation'),
  ('english-literary-devices', 'english-reading-comprehension'),
  ('english-poetry-analysis', 'english-literary-devices'),
  ('english-essay-writing', 'english-writing-basics'),
  ('english-literature-analysis', 'english-literary-devices'),
  ('english-literature-analysis', 'english-essay-writing')
)
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Create sample learning pathways
INSERT INTO learning_pathways (pathway_name, subject, description, difficulty_level, estimated_duration_hours) VALUES
('Mathematics Fundamentals', 'math', 'Complete foundation from arithmetic to algebra', 'beginner', 4),
('Advanced Mathematics', 'math', 'From algebra through calculus preparation', 'advanced', 6),
('Chemistry Basics', 'science', 'Fundamental chemistry concepts', 'intermediate', 4),
('Physics Foundations', 'science', 'Basic physics principles and applications', 'intermediate', 4),
('World History Survey', 'history', 'Overview of major historical periods', 'intermediate', 5),
('English Composition', 'english', 'Writing and analysis skills development', 'intermediate', 4)
ON CONFLICT DO NOTHING;

-- Insert pathway steps for Mathematics Fundamentals
INSERT INTO pathway_steps (pathway_id, topic_id, step_order, is_optional)
SELECT 
  lp.id as pathway_id,
  t.id as topic_id,
  step_data.step_order,
  step_data.is_optional
FROM learning_pathways lp,
     topics t,
     (VALUES 
       ('math-basic-arithmetic', 1, false),
       ('math-fractions', 2, false),
       ('math-decimals', 3, false),
       ('math-percentages', 4, false),
       ('math-basic-algebra', 5, false),
       ('math-basic-geometry', 6, true)
     ) AS step_data(topic_slug, step_order, is_optional)
WHERE lp.pathway_name = 'Mathematics Fundamentals'
  AND t.topic_slug = step_data.topic_slug
ON CONFLICT (pathway_id, topic_id) DO NOTHING;