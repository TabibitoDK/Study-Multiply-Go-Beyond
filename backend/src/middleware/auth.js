import { User } from '../models/index.js';

const DEMO_USERNAME_FALLBACKS = (process.env.DEMO_USERNAMES || 'aiko_hennyuu,haruto_study')
  .split(',')
  .map(name => name.trim())
  .filter(Boolean);

const isReadOnlyMethod = method => ['GET', 'HEAD', 'OPTIONS'].includes(method?.toUpperCase?.());

const findDemoUser = async () => {
  if (process.env.DEFAULT_USER_ID) {
    const explicitUser = await User.findById(process.env.DEFAULT_USER_ID).catch(() => null);
    if (explicitUser && explicitUser.isActive) {
      return explicitUser;
    }
  }

  if (process.env.DEFAULT_USER_EMAIL) {
    const explicitEmail = await User.findOne({
      email: process.env.DEFAULT_USER_EMAIL.toLowerCase(),
      isActive: true,
    });
    if (explicitEmail) {
      return explicitEmail;
    }
  }

  for (const username of DEMO_USERNAME_FALLBACKS) {
    // eslint-disable-next-line no-await-in-loop
    const candidate = await User.findOne({ username, isActive: true });
    if (candidate) {
      return candidate;
    }
  }

  return User.findOne({ isActive: true });
};

// Simple authentication middleware for demo purposes
// In production, you would use JWT or another proper authentication method
export const authenticate = async (req, res, next) => {
  try {
    // For demo purposes, we'll use a simple header-based authentication
    // In production, use proper JWT tokens
    let userId = req.headers['x-user-id'];
    let user = null;

    if (userId) {
      user = await User.findById(userId);
    }

    // Allow guests/read-only sessions to automatically fall back
    const isGuestSession = !userId || userId.startsWith('guest_');
    if ((!user || !user.isActive) && isReadOnlyMethod(req.method)) {
      const demoUser = await findDemoUser();
      if (demoUser) {
        const reason = !userId ? 'missing header' : `invalid user id (${userId})`;
        console.warn(`[auth] ${reason} - falling back to demo account ${demoUser.username}`);
        user = demoUser;
        userId = demoUser._id.toString();
        req.headers['x-user-id'] = userId;
        req.isDemoSession = true;
      }
    }

    if (!user || !user.isActive) {
      const message = userId
        ? 'User not found or inactive'
        : 'Please provide user ID in x-user-id header';
      return res.status(401).json({
        error: 'Authentication required',
        message,
      });
    }

    // Add user to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
    });
  }
};

// Middleware to ensure user can only access their own data
export const ensureUserAccess = (req, res, next) => {
  const requestUserId = req.params.userId || req.body.userId || req.query.userId;
  const authenticatedUserId = req.user.id;

  // If request contains a userId, ensure it matches the authenticated user
  if (requestUserId && requestUserId !== authenticatedUserId.toString()) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You can only access your own data'
    });
  }

  // Add userId filter to query parameters for automatic data filtering
  if (req.query && !req.query.userId) {
    req.query.userId = authenticatedUserId;
  }

  next();
};

// Middleware to add userId to request body for create operations
export const addUserIdToBody = (req, res, next) => {
  if (!req.body.userId) {
    req.body.userId = req.user.id;
  }
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', ')
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'}`);
  next();
};
