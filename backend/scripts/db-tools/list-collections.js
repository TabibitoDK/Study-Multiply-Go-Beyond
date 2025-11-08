#!/usr/bin/env node

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: `${__dirname}/../../.env` })

// Import models
import User from '../../src/models/User.js'
import Book from '../../src/models/Book.js'
import Post from '../../src/models/Post.js'
import Profile from '../../src/models/Profile.js'
import Goal from '../../src/models/Goal.js'
import CalendarEvent from '../../src/models/CalendarEvent.js'
import FlashcardGroup from '../../src/models/FlashcardGroup.js'
import FlashcardAISettings from '../../src/models/FlashcardAISettings.js'
import TaskPlan from '../../src/models/TaskPlan.js'
import FlowEdge from '../../src/models/FlowEdge.js'
import Tag from '../../src/models/Tag.js'

const collections = {
  users: User,
  books: Book,
  posts: Post,
  profiles: Profile,
  goals: Goal,
  calendarEvents: CalendarEvent,
  flashcardGroups: FlashcardGroup,
  flashcardAISettings: FlashcardAISettings,
  taskPlans: TaskPlan,
  flowEdges: FlowEdge,
  tags: Tag
}

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/study-multiply')
    console.log('? Connected to MongoDB')
  } catch (error) {
    console.error('? Failed to connect to MongoDB:', error.message)
    process.exit(1)
  }
}

async function listCollections() {
  console.log('\n? Database Collection Overview')
  console.log('================================')
  
  let totalDocuments = 0
  
  for (const [name, model] of Object.entries(collections)) {
    try {
      const count = await model.countDocuments()
      totalDocuments += count
      
      // Get collection stats
      const stats = await mongoose.connection.db.collection(model.collection.name).stats()
      const sizeKB = Math.round(stats.size / 1024)
      const avgSize = count > 0 ? Math.round(stats.avgObjSize) : 0
      
      console.log(`\n? ${name.charAt(0).toUpperCase() + name.slice(1)}`)
      console.log(`   Documents: ${count.toLocaleString()}`)
      console.log(`   Size: ${sizeKB.toLocaleString()} KB`)
      console.log(`   Avg Document Size: ${avgSize} bytes`)
      console.log(`   Indexes: ${stats.nindexes}`)
      
      // Show sample data structure for first document
      if (count > 0) {
        const sample = await model.findOne().lean()
        const fields = Object.keys(sample).filter(key => key !== '__v')
        console.log(`   Fields: ${fields.join(', ')}`)
      }
    } catch (error) {
      console.error(`? Error accessing ${name}:`, error.message)
    }
  }
  
  console.log('\n? Summary')
  console.log('===========')
  console.log(`Total Documents: ${totalDocuments.toLocaleString()}`)
  console.log(`Total Collections: ${Object.keys(collections).length}`)
  
  // Database stats
  try {
    const dbStats = await mongoose.connection.db.stats()
    const sizeMB = Math.round(dbStats.dataSize / (1024 * 1024))
    console.log(`Database Size: ${sizeMB} MB`)
    console.log(`Collections in DB: ${dbStats.collections}`)
  } catch (error) {
    console.error('? Error getting database stats:', error.message)
  }
}

async function main() {
  console.log('? Database Collection Listing Tool')
  console.log('==================================')
  
  await connectToDatabase()
  await listCollections()
  
  await mongoose.disconnect()
  console.log('\n? Disconnected from MongoDB')
  process.exit(0)
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

main().catch(error => {
  console.error('? Script failed:', error)
  process.exit(1)
})