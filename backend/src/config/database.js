import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;
let connectionPromise = null;
let listenersRegistered = false;

const registerConnectionEvents = () => {
  if (listenersRegistered) {
    return;
  }

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });

  listenersRegistered = true;
};

const startInMemoryServer = async (reason) => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  const uri = memoryServer.getUri();
  const dbName = process.env.MONGO_DB_NAME || 'nyacademy_demo';

  console.warn(reason || '[db] Falling back to in-memory MongoDB instance for local development.');
  const conn = await mongoose.connect(uri, { dbName });
  registerConnectionEvents();
  console.log(`In-memory MongoDB started at ${uri}`);
  return conn;
};

const connectWithPrimary = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
  registerConnectionEvents();
  return conn;
};

const connectDB = async () => {
  if (connectionPromise) {
    return connectionPromise;
  }

  const shouldUseMemory = process.env.USE_IN_MEMORY_DB === 'true';

  connectionPromise = (async () => {
    if (!shouldUseMemory) {
      try {
        return await connectWithPrimary();
      } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
      }
    }

    try {
      return await startInMemoryServer(
        shouldUseMemory
          ? '[db] USE_IN_MEMORY_DB enabled - starting ephemeral database.'
          : '[db] Falling back to in-memory MongoDB instance. Start a Mongo server to use persistent data.'
      );
    } catch (memoryError) {
      console.error('Failed to start in-memory MongoDB instance:', memoryError);
      throw memoryError;
    }
  })();

  return connectionPromise;
};

export default connectDB;
