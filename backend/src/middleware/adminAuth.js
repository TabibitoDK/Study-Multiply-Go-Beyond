import bcrypt from 'bcrypt'

// Simple password-based authentication for admin tools
// In production, you might want to use a more secure authentication method
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export const authenticateAdmin = (req, res, next) => {
  const { password } = req.body || req.query || req.headers

  if (!password) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide admin password' 
    })
  }

  // Simple password comparison (in production, use bcrypt.compare with hashed passwords)
  if (password === ADMIN_PASSWORD) {
    req.adminAuthenticated = true
    next()
  } else {
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid admin password' 
    })
  }
}

// Middleware to check if admin is authenticated (for session-based auth)
export const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.adminAuthenticated) {
    next()
  } else {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access admin tools' 
    })
  }
}

// Session-based authentication middleware
export const adminSessionAuth = (req, res, next) => {
  // Check if session exists and user is authenticated
  if (req.session && req.session.adminAuthenticated) {
    return next()
  }

  // For POST requests with password in body
  if (req.method === 'POST' && req.body.password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true
    return next()
  }

  // For GET requests with password in query
  if (req.method === 'GET' && req.query.password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true
    return next()
  }

  // For requests with password in header
  if (req.headers['x-admin-password'] === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true
    return next()
  }

  // If no valid authentication found, redirect to login or return error
  if (req.path.includes('/api/')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide admin password' 
    })
  } else {
    // For web routes, redirect to login page
    return res.redirect('/admin/login')
  }
}

export default {
  authenticateAdmin,
  requireAdminAuth,
  adminSessionAuth
}