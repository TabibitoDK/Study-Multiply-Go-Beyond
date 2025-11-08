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

async function findUser(identifier) {
  try {
    // Try to find by ObjectId first
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const user = await User.findById(identifier)
      if (user) return user
    }
    
    // Try to find by username
    const user = await User.findOne({ username: identifier })
    if (user) return user
    
    // Try to find by email
    const userByEmail = await User.findOne({ email: identifier })
    if (userByEmail) return userByEmail
    
    return null
  } catch (error) {
    console.error('? Error finding user:', error.message)
    return null
  }
}

async function queryUserData(userId) {
  console.log('\n? User Data Query Results')
  console.log('==========================')
  
  // Get user info
  const user = await User.findById(userId)
  if (!user) {
    console.log('? User not found')
    return
  }
  
  console.log(`\n? User Information`)
  console.log(`ID: ${user._id}`)
  console.log(`Username: ${user.username}`)
  console.log(`Email: ${user.email}`)
  console.log(`Created: ${user.createdAt}`)
  console.log(`Updated: ${user.updatedAt}`)
  
  console.log('\n? User Data Summary')
  console.log('====================')
  
  let totalItems = 0
  
  for (const [name, model] of Object.entries(collections)) {
    try {
      const count = await model.countDocuments({ userId })
      totalItems += count
      
      if (count > 0) {
        console.log(`\n? ${name.charAt(0).toUpperCase() + name.slice(1)}: ${count} items`)
        
        // Get recent items
        const recentItems = await model.find({ userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('title name description createdAt')
          .lean()
        
        if (recentItems.length > 0) {
          console.log('   Recent items:')
          recentItems.forEach((item, index) => {
            const title = item.title || item.name || item.description || 'Untitled'
            const date = new Date(item.createdAt).toLocaleDateString()
            console.log(`   ${index + 1}. ${title} (${date})`)
          })
        }
      } else {
        console.log(`? ${name.charAt(0).toUpperCase() + name.slice(1)}: 0 items`)
      }
    } catch (error) {
      console.error(`? Error querying ${name}:`, error.message)
    }
  }
  
  console.log('\n? Summary')
  console.log('===========')
  console.log(`Total items across all collections: ${totalItems}`)
  
  // Show data distribution
  console.log('\n? Data Distribution')
  console.log('===================')
  for (const [name, model] of Object.entries(collections)) {
    const count = await model.countDocuments({ userId })
    if (count > 0) {
      const percentage = ((count / totalItems) * 100).toFixed(1)
      const bar = '?'.repeat(Math.round(percentage / 2))
      console.log(`${name.padEnd(20)} ${bar} ${count} (${percentage}%)`)
    }
  }
}

async function showAllUsers() {
  console.log('\n? All Users in Database')
  console.log('========================')
  
  const users = await User.find()
    .select('username email _id createdAt')
    .sort({ createdAt: -1 })
    .lean()
  
  if (users.length === 0) {
    console.log('No users found in database')
    return
  }
  
  console.log(`\nFound ${users.length} users:\n`)
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username} (${user.email})`)
    console.log(`   ID: ${user._id}`)
    console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`)
    console.log('')
  })
}

async function main() {
  console.log('? User Data Query Tool')
  console.log('=======================')
  
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('\nUsage:')
    console.log('  node query-by-user.js <userId|username|email>  # Query specific user')
    console.log('  node query-by-user.js --list                   # List all users')
    console.log('  node query-by-user.js --help                   # Show this help')
    process.exit(0)
  }
  
  if (args[0] === '--help') {
    console.log('\nThis tool allows you to query data for a specific user.')
    console.log('You can identify users by:')
    console.log('- User ID (ObjectId)')
    console.log('- Username')
    console.log('- Email address')
    console.log('\nExamples:')
    console.log('  node query-by-user.js 507f1f77bcf86cd799439011')
    console.log('  node query-by-user.js johndoe')
    console.log('  node query-by-user.js john@example.com')
    process.exit(0)
  }
  
  if (args[0] === '--list') {
    await connectToDatabase()
    await showAllUsers()
    await mongoose.disconnect()
    console.log('\n? Disconnected from MongoDB')
    process.exit(0)
  }
  
  const identifier = args[0]
  
  await connectToDatabase()
  
  const user = await findUser(identifier)
  if (!user) {
    console.log(`? User not found: ${identifier}`)
    console.log('Use --list to see all available users')
    await mongoose.disconnect()
    process.exit(1)
  }
  
  await queryUserData(user._id)
  
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