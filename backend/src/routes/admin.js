import express from 'express'
import { adminSessionAuth } from '../middleware/adminAuth.js'
import User from '../models/User.js'
import Book from '../models/Book.js'
import Post from '../models/Post.js'
import Profile from '../models/Profile.js'
import Goal from '../models/Goal.js'
import CalendarEvent from '../models/CalendarEvent.js'
import FlashcardGroup from '../models/FlashcardGroup.js'
import FlashcardAISettings from '../models/FlashcardAISettings.js'
import TaskPlan from '../models/TaskPlan.js'
import FlowEdge from '../models/FlowEdge.js'
import Tag from '../models/Tag.js'

const router = express.Router()

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin-login', { 
    title: 'Admin Login',
    error: req.query.error 
  })
})

// Admin login POST handler
router.post('/login', (req, res) => {
  const { password } = req.body
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
  
  if (password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true
    res.redirect('/admin/view-data')
  } else {
    res.redirect('/admin/login?error=Invalid password')
  }
})

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin/login')
})

// Main data viewer dashboard
router.get('/view-data', adminSessionAuth, async (req, res) => {
  try {
    // Get collection counts
    const stats = {
      users: await User.countDocuments(),
      books: await Book.countDocuments(),
      posts: await Post.countDocuments(),
      profiles: await Profile.countDocuments(),
      goals: await Goal.countDocuments(),
      calendarEvents: await CalendarEvent.countDocuments(),
      flashcardGroups: await FlashcardGroup.countDocuments(),
      flashcardAISettings: await FlashcardAISettings.countDocuments(),
      taskPlans: await TaskPlan.countDocuments(),
      flowEdges: await FlowEdge.countDocuments(),
      tags: await Tag.countDocuments()
    }

    // Get user distribution
    const userDistribution = await User.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'userId',
          as: 'userBooks'
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'userPosts'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          booksCount: { $size: '$userBooks' },
          postsCount: { $size: '$userPosts' }
        }
      }
    ])

    res.render('admin-dashboard', {
      title: 'Database Viewer Dashboard',
      stats,
      userDistribution,
      collections: Object.keys(stats)
    })
  } catch (error) {
    console.error('Error loading dashboard:', error)
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Failed to load dashboard data' 
    })
  }
})

// Collection viewer with pagination and search
router.get('/view-data/:collection', adminSessionAuth, async (req, res) => {
  try {
    const { collection } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const search = req.query.search || ''
    const userId = req.query.userId || ''
    const skip = (page - 1) * limit

    // Map collection names to models
    const collectionModels = {
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

    const Model = collectionModels[collection]
    if (!Model) {
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: `Collection ${collection} not found` 
      })
    }

    // Build query
    let query = {}
    
    // Add userId filter if provided
    if (userId) {
      query.userId = userId
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Get total count for pagination
    const total = await Model.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    // Get documents with pagination
    let documents = await Model.find(query)
      .skip(skip)
      .limit(limit)
      .lean()

    // If not users collection, populate user info
    if (collection !== 'users') {
      documents = await Model.find(query)
        .populate('userId', 'username email')
        .skip(skip)
        .limit(limit)
        .lean()
    }

    // Get all users for filter dropdown
    const users = await User.find().select('username email _id').lean()

    res.render('collection-viewer', {
      title: `${collection.charAt(0).toUpperCase() + collection.slice(1)} Collection`,
      collection,
      documents,
      users,
      pagination: {
        current: page,
        total: totalPages,
        limit,
        count: total
      },
      filters: {
        search,
        userId
      }
    })
  } catch (error) {
    console.error('Error viewing collection:', error)
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Failed to load collection data' 
    })
  }
})

// API endpoint for collection data (for AJAX requests)
router.get('/api/collection/:collection', adminSessionAuth, async (req, res) => {
  try {
    const { collection } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const search = req.query.search || ''
    const userId = req.query.userId || ''
    const skip = (page - 1) * limit

    const collectionModels = {
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

    const Model = collectionModels[collection]
    if (!Model) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    let query = {}
    
    if (userId) {
      query.userId = userId
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Model.countDocuments(query)
    const documents = await Model.find(query)
      .populate('userId', 'username email')
      .skip(skip)
      .limit(limit)
      .lean()

    res.json({
      documents,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        limit,
        count: total
      }
    })
  } catch (error) {
    console.error('Error fetching collection data:', error)
    res.status(500).json({ error: 'Failed to fetch collection data' })
  }
})

// Data integrity check endpoint
router.get('/api/integrity-check', adminSessionAuth, async (req, res) => {
  try {
    const issues = []

    // Check for orphaned records (records with non-existent userId)
    const collections = ['books', 'posts', 'profiles', 'goals', 'calendarEvents', 'flashcardGroups', 'flashcardAISettings', 'taskPlans', 'flowEdges']
    
    for (const collectionName of collections) {
      const Model = {
        books: Book,
        posts: Post,
        profiles: Profile,
        goals: Goal,
        calendarEvents: CalendarEvent,
        flashcardGroups: FlashcardGroup,
        flashcardAISettings: FlashcardAISettings,
        taskPlans: TaskPlan,
        flowEdges: FlowEdge
      }[collectionName]

      if (Model) {
        const orphaned = await Model.find({
          userId: { $exists: true, $ne: null }
        }).populate('userId', '_id')

        const orphanedCount = orphaned.filter(doc => !doc.userId).length
        if (orphanedCount > 0) {
          issues.push({
            type: 'orphaned_records',
            collection: collectionName,
            count: orphanedCount,
            message: `${orphanedCount} records in ${collectionName} have non-existent user references`
          })
        }
      }
    }

    // Check for duplicate data
    const duplicateUsers = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])

    if (duplicateUsers.length > 0) {
      issues.push({
        type: 'duplicate_emails',
        count: duplicateUsers.length,
        message: `${duplicateUsers.length} users have duplicate email addresses`
      })
    }

    res.json({
      status: issues.length === 0 ? 'healthy' : 'issues_found',
      issues,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error performing integrity check:', error)
    res.status(500).json({ error: 'Failed to perform integrity check' })
  }
})

export default router