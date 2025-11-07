import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/study_multiply_go_beyond'

app.use(cors())
app.use(express.json())

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || undefined,
    })
    console.log('✅ MongoDB connection established')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working' })
})

app.listen(PORT, async () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`)
  await connectToDatabase()
})
