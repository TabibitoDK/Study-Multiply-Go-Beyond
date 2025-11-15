import { initializeJsonDatabase } from '../lib/jsonModelFactory.js'

const connectDB = async () => {
  await initializeJsonDatabase()
  console.log('[data] JSON storage initialized')
  return { driver: 'json-file' }
}

export default connectDB
