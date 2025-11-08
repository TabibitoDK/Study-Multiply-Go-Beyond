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

async function checkOrphanedRecords() {
  console.log('\n? Checking for Orphaned Records')
  console.log('=================================')
  
  let totalOrphaned = 0
  const issues = []
  
  for (const [collectionName, model] of Object.entries(collections)) {
    try {
      // Find records with userId that don't have a corresponding user
      const orphanedRecords = await model.find({
        userId: { $exists: true, $ne: null }
      }).populate('userId', '_id')
      
      const orphanedCount = orphanedRecords.filter(doc => !doc.userId).length
      totalOrphaned += orphanedCount
      
      if (orphanedCount > 0) {
        issues.push({
          type: 'orphaned_records',
          collection: collectionName,
          count: orphanedCount,
          message: `${orphanedCount} records in ${collectionName} have non-existent user references`
        })
        console.log(`? ${collectionName}: ${orphanedCount} orphaned records`)
      } else {
        console.log(`? ${collectionName}: No orphaned records`)
      }
    } catch (error) {
      console.error(`? Error checking ${collectionName}:`, error.message)
      issues.push({
        type: 'check_error',
        collection: collectionName,
        error: error.message
      })
    }
  }
  
  return { totalOrphaned, issues }
}

async function checkDuplicateData() {
  console.log('\n? Checking for Duplicate Data')
  console.log('===============================')
  
  const issues = []
  
  // Check for duplicate users by email
  try {
    const duplicateEmails = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])
    
    if (duplicateEmails.length > 0) {
      const totalDuplicates = duplicateEmails.reduce((sum, dup) => sum + dup.count, 0)
      issues.push({
        type: 'duplicate_emails',
        count: duplicateEmails.length,
        totalDuplicates,
        message: `${duplicateEmails.length} users have duplicate email addresses (${totalDuplicates} total duplicates)`
      })
      console.log(`? Duplicate emails: ${duplicateEmails.length} groups, ${totalDuplicates} total duplicates`)
      duplicateEmails.forEach(dup => {
        console.log(`   - ${dup._id}: ${dup.count} occurrences`)
      })
    } else {
      console.log('? No duplicate emails found')
    }
  } catch (error) {
    console.error('? Error checking duplicate emails:', error.message)
  }
  
  // Check for duplicate users by username
  try {
    const duplicateUsernames = await User.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])
    
    if (duplicateUsernames.length > 0) {
      const totalDuplicates = duplicateUsernames.reduce((sum, dup) => sum + dup.count, 0)
      issues.push({
        type: 'duplicate_usernames',
        count: duplicateUsernames.length,
        totalDuplicates,
        message: `${duplicateUsernames.length} users have duplicate usernames (${totalDuplicates} total duplicates)`
      })
      console.log(`? Duplicate usernames: ${duplicateUsernames.length} groups, ${totalDuplicates} total duplicates`)
    } else {
      console.log('? No duplicate usernames found')
    }
  } catch (error) {
    console.error('? Error checking duplicate usernames:', error.message)
  }
  
  return issues
}

async function checkDataConsistency() {
  console.log('\n? Checking Data Consistency')
  console.log('=============================')
  
  const issues = []
  
  // Check for users without profiles
  try {
    const usersWithoutProfiles = await User.aggregate([
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $match: {
          profile: { $size: 0 }
        }
      },
      {
        $count: 'count'
      }
    ])
    
    const count = usersWithoutProfiles.length > 0 ? usersWithoutProfiles[0].count : 0
    if (count > 0) {
      issues.push({
        type: 'users_without_profiles',
        count,
        message: `${count} users don't have corresponding profiles`
      })
      console.log(`??  ${count} users without profiles`)
    } else {
      console.log('? All users have profiles')
    }
  } catch (error) {
    console.error('? Error checking user-profile consistency:', error.message)
  }
  
  // Check for required fields
  try {
    const usersMissingRequired = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: { $eq: '' } },
        { email: { $exists: false } },
        { email: { $eq: '' } }
      ]
    }).countDocuments()
    
    if (usersMissingRequired > 0) {
      issues.push({
        type: 'missing_required_fields',
        collection: 'users',
        count: usersMissingRequired,
        message: `${usersMissingRequired} users are missing required fields (username/email)`
      })
      console.log(`? ${usersMissingRequired} users missing required fields`)
    } else {
      console.log('? All users have required fields')
    }
  } catch (error) {
    console.error('? Error checking required fields:', error.message)
  }
  
  return issues
}

async function checkIndexHealth() {
  console.log('\n? Checking Index Health')
  console.log('========================')
  
  const issues = []
  
  try {
    const collections = await mongoose.connection.db.listCollections().toArray()
    
    for (const collection of collections) {
      const indexes = await mongoose.connection.db.collection(collection.name).listIndexes().toArray()
      const hasUserIdIndex = indexes.some(index => 
        index.key && index.key.userId && Object.keys(index.key).length === 1
      )
      
      if (collection.name !== 'users' && !hasUserIdIndex) {
        issues.push({
          type: 'missing_userId_index',
          collection: collection.name,
          message: `Collection ${collection.name} is missing userId index`
        })
        console.log(`??  ${collection.name}: Missing userId index`)
      } else {
        console.log(`? ${collection.name}: Indexes OK`)
      }
    }
  } catch (error) {
    console.error('? Error checking indexes:', error.message)
  }
  
  return issues
}

async function generateReport() {
  console.log('\n? Generating Integrity Report')
  console.log('============================')
  
  const orphanedResults = await checkOrphanedRecords()
  const duplicateIssues = await checkDuplicateData()
  const consistencyIssues = await checkDataConsistency()
  const indexIssues = await checkIndexHealth()
  
  const allIssues = [
    ...orphanedResults.issues,
    ...duplicateIssues,
    ...consistencyIssues,
    ...indexIssues
  ]
  
  console.log('\n? Summary Report')
  console.log('=================')
  
  if (allIssues.length === 0) {
    console.log('? All integrity checks passed! No issues found.')
  } else {
    console.log(`??  Found ${allIssues.length} issues:`)
    
    allIssues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.type.replace('_', ' ').toUpperCase()}`)
      console.log(`   ${issue.message}`)
      if (issue.collection) console.log(`   Collection: ${issue.collection}`)
      if (issue.count) console.log(`   Count: ${issue.count}`)
    })
  }
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    status: allIssues.length === 0 ? 'healthy' : 'issues_found',
    summary: {
      totalIssues: allIssues.length,
      orphanedRecords: orphanedResults.totalOrphaned,
      duplicateGroups: duplicateIssues.length,
      consistencyIssues: consistencyIssues.length,
      indexIssues: indexIssues.length
    },
    issues: allIssues
  }
  
  // Save report to file
  const fs = await import('fs')
  const reportPath = `${__dirname}/integrity-report-${Date.now()}.json`
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n? Detailed report saved to: ${reportPath}`)
  
  return report
}

async function main() {
  console.log('? Database Integrity Check Tool')
  console.log('================================')
  
  const args = process.argv.slice(2)
  
  if (args.length > 0 && args[0] === '--help') {
    console.log('\nThis tool checks the integrity of your migrated data.')
    console.log('It checks for:')
    console.log('- Orphaned records (records with non-existent user references)')
    console.log('- Duplicate data (duplicate emails, usernames)')
    console.log('- Data consistency (users without profiles, missing required fields)')
    console.log('- Index health (proper indexing for performance)')
    console.log('\nUsage: node check-integrity.js')
    process.exit(0)
  }
  
  await connectToDatabase()
  await generateReport()
  
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