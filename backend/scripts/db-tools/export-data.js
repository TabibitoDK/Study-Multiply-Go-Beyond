#!/usr/bin/env node

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs/promises'

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

async function exportCollection(collectionName, format = 'json') {
  console.log(`\n? Exporting ${collectionName} collection...`)
  
  const model = collections[collectionName]
  if (!model) {
    console.error(`? Collection ${collectionName} not found`)
    return null
  }
  
  try {
    const documents = await model.find({}).lean()
    
    if (documents.length === 0) {
      console.log(`? No documents found in ${collectionName}`)
      return null
    }
    
    let exportData
    let filename
    let mimeType
    
    if (format === 'json') {
      exportData = JSON.stringify(documents, null, 2)
      filename = `${collectionName}-export-${Date.now()}.json`
      mimeType = 'application/json'
    } else if (format === 'csv') {
      exportData = convertToCSV(documents)
      filename = `${collectionName}-export-${Date.now()}.csv`
      mimeType = 'text/csv'
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }
    
    // Create exports directory if it doesn't exist
    const exportsDir = `${__dirname}/../exports`
    try {
      await fs.mkdir(exportsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    const filepath = `${exportsDir}/${filename}`
    await fs.writeFile(filepath, exportData, 'utf8')
    
    console.log(`? Exported ${documents.length} documents to ${filename}`)
    console.log(`   File size: ${(exportData.length / 1024).toFixed(2)} KB`)
    
    return {
      filepath,
      filename,
      count: documents.length,
      size: exportData.length,
      format
    }
  } catch (error) {
    console.error(`? Error exporting ${collectionName}:`, error.message)
    return null
  }
}

function convertToCSV(documents) {
  if (documents.length === 0) return ''
  
  // Get all unique keys from all documents
  const allKeys = new Set()
  documents.forEach(doc => {
    Object.keys(doc).forEach(key => {
      if (key !== '__v') {
        allKeys.add(key)
      }
    })
  })
  
  const headers = Array.from(allKeys)
  const csvHeaders = headers.join(',')
  
  const csvRows = documents.map(doc => {
    return headers.map(header => {
      let value = doc[header]
      
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value)
      }
      
      // Handle undefined and null
      if (value === undefined || value === null) {
        value = ''
      }
      
      // Escape quotes and wrap in quotes if needed
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""')
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`
        }
      }
      
      return value
    }).join(',')
  })
  
  return [csvHeaders, ...csvRows].join('\n')
}

async function exportUserData(userId, format = 'json') {
  console.log(`\n? Exporting data for user ${userId}...`)
  
  try {
    const user = await User.findById(userId)
    if (!user) {
      console.error(`? User not found: ${userId}`)
      return null
    }
    
    console.log(`   User: ${user.username} (${user.email})`)
    
    const userData = {
      user: user.toObject(),
      collections: {}
    }
    
    let totalItems = 0
    
    for (const [collectionName, model] of Object.entries(collections)) {
      if (collectionName === 'users') continue // Skip users collection
      
      const documents = await model.find({ userId }).lean()
      if (documents.length > 0) {
        userData.collections[collectionName] = documents
        totalItems += documents.length
        console.log(`   ${collectionName}: ${documents.length} items`)
      }
    }
    
    let exportData
    let filename
    
    if (format === 'json') {
      exportData = JSON.stringify(userData, null, 2)
      filename = `user-${user.username}-export-${Date.now()}.json`
    } else {
      throw new Error(`Unsupported format for user export: ${format}`)
    }
    
    // Create exports directory if it doesn't exist
    const exportsDir = `${__dirname}/../exports`
    try {
      await fs.mkdir(exportsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    const filepath = `${exportsDir}/${filename}`
    await fs.writeFile(filepath, exportData, 'utf8')
    
    console.log(`? Exported ${totalItems} items for user ${user.username}`)
    console.log(`   File: ${filename}`)
    console.log(`   File size: ${(exportData.length / 1024).toFixed(2)} KB`)
    
    return {
      filepath,
      filename,
      count: totalItems,
      size: exportData.length,
      format,
      username: user.username
    }
  } catch (error) {
    console.error(`? Error exporting user data:`, error.message)
    return null
  }
}

async function exportAllCollections(format = 'json') {
  console.log('\n? Exporting All Collections')
  console.log('============================')
  
  const results = []
  
  for (const collectionName of Object.keys(collections)) {
    const result = await exportCollection(collectionName, format)
    if (result) {
      results.push(result)
    }
  }
  
  // Create summary
  const totalDocuments = results.reduce((sum, result) => sum + result.count, 0)
  const totalSize = results.reduce((sum, result) => sum + result.size, 0)
  
  console.log('\n? Export Summary')
  console.log('=================')
  console.log(`Collections exported: ${results.length}`)
  console.log(`Total documents: ${totalDocuments.toLocaleString()}`)
  console.log(`Total size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`)
  
  return results
}

async function main() {
  console.log('? Database Export Tool')
  console.log('========================')
  
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('\nUsage:')
    console.log('  node export-data.js <collection> [format]           # Export specific collection')
    console.log('  node export-data.js --user <userId> [format]       # Export user data')
    console.log('  node export-data.js --all [format]                  # Export all collections')
    console.log('  node export-data.js --help                          # Show this help')
    console.log('\nFormats: json (default), csv')
    console.log('\nExamples:')
    console.log('  node export-data.js users')
    console.log('  node export-data.js books csv')
    console.log('  node export-data.js --user 507f1f77bcf86cd799439011')
    console.log('  node export-data.js --all json')
    process.exit(0)
  }
  
  if (args[0] === '--help') {
    console.log('\nThis tool exports data from your MongoDB database.')
    console.log('Supported formats:')
    console.log('- JSON: Full data with proper formatting')
    console.log('- CSV: Tabular format for spreadsheet applications')
    console.log('\nExport options:')
    console.log('- Single collection: Export all documents from a specific collection')
    console.log('- User data: Export all data belonging to a specific user')
    console.log('- All collections: Export entire database')
    process.exit(0)
  }
  
  await connectToDatabase()
  
  try {
    if (args[0] === '--all') {
      const format = args[1] || 'json'
      await exportAllCollections(format)
    } else if (args[0] === '--user') {
      if (args.length < 2) {
        console.error('? User ID is required')
        process.exit(1)
      }
      const userId = args[1]
      const format = args[2] || 'json'
      await exportUserData(userId, format)
    } else {
      const collectionName = args[0]
      const format = args[1] || 'json'
      await exportCollection(collectionName, format)
    }
  } catch (error) {
    console.error('? Export failed:', error.message)
    process.exit(1)
  }
  
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