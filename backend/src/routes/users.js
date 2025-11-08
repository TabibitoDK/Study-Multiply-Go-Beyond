import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateEmail,
  validateUsername,
  validatePassword,
  validateStatus
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/users - Get all users (admin only in production)
// For demo purposes, returns basic user info
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    
    const users = await User.find({ isActive: true })
      .select('username email createdAt lastLoginAt preferences.language preferences.theme')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments({ isActive: true });
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('followers', 'username')
      .populate('following', 'username');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The user with the provided ID does not exist'
      });
    }
    
    // Only allow users to see their own full profile
    if (req.user.id !== req.params.id) {
      // Return limited public information
      const publicUser = {
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
        preferences: {
          language: user.preferences.language,
          theme: user.preferences.theme
        }
      };
      return res.json(publicUser);
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user (register)
router.post('/', 
  validateEmail,
  validateUsername,
  validatePassword,
  async (req, res, next) => {
    try {
      const { username, email, password, preferences } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });
      
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'A user with this email or username already exists'
        });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create new user
      const newUser = new User({
        username,
        email,
        passwordHash,
        preferences: {
          language: preferences?.language || 'en',
          theme: preferences?.theme || 'light',
          timezone: preferences?.timezone || 'UTC'
        }
      });
      
      await newUser.save();
      
      // Return user without password hash
      const userResponse = newUser.toObject();
      delete userResponse.passwordHash;
      
      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/users/:id - Update user
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  ensureUserAccess,
  validateEmail,
  validateUsername,
  async (req, res, next) => {
    try {
      const { username, email, preferences, isActive } = req.body;
      
      // Check if username or email is already taken by another user
      if (username || email) {
        const existingUser = await User.findOne({
          _id: { $ne: req.params.id },
          $or: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : [])
          ]
        });
        
        if (existingUser) {
          return res.status(409).json({
            error: 'Username or email already taken',
            message: 'Another user is already using this username or email'
          });
        }
      }
      
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (preferences) updateData.preferences = { ...preferences };
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-passwordHash');
      
      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The user with the provided ID does not exist'
        });
      }
      
      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/users/:id - Delete user (soft delete by setting isActive to false)
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  ensureUserAccess,
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The user with the provided ID does not exist'
        });
      }
      
      res.json({
        message: 'User deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/users/login - User login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Both email and password are required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    
    // Return user without password hash
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/password - Change password
router.put('/:id/password',
  authenticate,
  validateObjectId('id'),
  ensureUserAccess,
  validatePassword,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Missing passwords',
          message: 'Both current password and new password are required'
        });
      }
      
      // Get user with password
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The user with the provided ID does not exist'
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Invalid current password',
          message: 'The current password is incorrect'
        });
      }
      
      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await User.findByIdAndUpdate(req.params.id, {
        passwordHash: newPasswordHash
      });
      
      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;