// lib/db/index.ts
import { initializeDatabase } from './schema'

const databaseConfig = {
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === 'production'
}

export const db = initializeDatabase(databaseConfig)

// Initialize database tables on startup
export async function setupDatabase() {
  try {
    await db.initializeDatabase()
    console.log('✅ Database setup complete')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }
}