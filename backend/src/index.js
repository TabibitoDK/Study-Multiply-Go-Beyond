import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/database.js'
import { authenticate, requestLogger, errorHandler } from './middleware/auth.js'
import {
  usersRouter,
  booksRouter,
  postsRouter,
  profilesRouter,
  goalsRouter,
  calendarEventsRouter,
  flashcardGroupsRouter,
  flashcardAISettingsRouter,
  taskPlansRouter,
  flowEdgesRouter,
  tagsRouter,
  studyGroupsRouter,
  chatsRouter
} from './routes/index.js'
import adminRouter from './routes/admin.js'
import { ensureSampleAccounts } from './utils/sampleAccounts.js'
import { seedFrontendData } from './utils/frontendDataSeeder.js'
import { ensureCommunityShowcase } from './utils/sampleCommunity.js'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Session middleware for admin authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Set EJS as templating engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API Routes
app.use('/api/users', usersRouter)
app.use('/api/books', booksRouter)
app.use('/api/posts', postsRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/calendar-events', calendarEventsRouter)
app.use('/api/flashcard-groups', flashcardGroupsRouter)
app.use('/api/flashcard-ai-settings', flashcardAISettingsRouter)
app.use('/api/task-plans', taskPlansRouter)
app.use('/api/flow-edges', flowEdgesRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/study-groups', studyGroupsRouter)
app.use('/api/chats', chatsRouter)

// Admin routes
app.use('/admin', adminRouter)

// Error handling middleware (must be last)
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

async function startServer() {
  try {
    await connectDB()
    await ensureSampleAccounts()
    await seedFrontendData()
    await ensureCommunityShowcase()
    app.listen(PORT, () => {
      console.log(`? API server listening on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('[startup] Failed to initialize API server:', error)
    process.exit(1)
  }
}

startServer()
