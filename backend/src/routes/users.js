import express from 'express';
import bcrypt from 'bcrypt';
import { User, Profile } from '../models/index.js';
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

const LOGIN_ALIAS_MAP = {
  'aiko_henyuu@nyacademy.dev': 'aiko_hennyuu@nyacademy.dev',
  'aiko_henyuu': 'aiko_hennyuu',
  'aiko_hennyu@nyacademy.dev': 'aiko_hennyuu@nyacademy.dev',
  'aiko_hennyu': 'aiko_hennyuu'
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const looksLikeEmail = value => value.includes('@');

const normalizeIdentifier = value =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const resolveLoginAlias = value => {
  let normalized = normalizeIdentifier(value);
  if (!normalized) {
    return normalized;
  }

  const visited = new Set();
  while (LOGIN_ALIAS_MAP[normalized] && !visited.has(normalized)) {
    visited.add(normalized);
    normalized = normalizeIdentifier(LOGIN_ALIAS_MAP[normalized]);
  }

  return normalized;
};

const buildUsernameCandidates = identifier => {
  if (!identifier || typeof identifier !== 'string') {
    return [];
  }

  const normalized = identifier.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const candidates = new Set();

  if (USERNAME_PATTERN.test(normalized)) {
    candidates.add(normalized);
  }

  const sanitized = normalized
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (USERNAME_PATTERN.test(sanitized)) {
    candidates.add(sanitized);
  }

  const spaceCollapsed = normalized.replace(/\s+/g, '_');
  if (USERNAME_PATTERN.test(spaceCollapsed)) {
    candidates.add(spaceCollapsed);
  }

  return Array.from(candidates);
};

const expandUsernameCandidates = baseCandidates => {
  if (!baseCandidates?.length) {
    return [];
  }

  const candidates = new Set();
  const addCandidate = candidate => {
    if (candidate && USERNAME_PATTERN.test(candidate)) {
      candidates.add(candidate);
    }
  };

  baseCandidates.forEach(addCandidate);

  baseCandidates.forEach(candidate => {
    const alias = resolveLoginAlias(candidate);
    if (alias && alias !== candidate) {
      if (looksLikeEmail(alias)) {
        const [localPart] = alias.split('@');
        addCandidate(localPart);
      } else {
        addCandidate(alias);
      }
    }
  });

  return Array.from(candidates);
};

const findActiveUserByEmail = async email => {
  const normalizedEmail = resolveLoginAlias(email);
  if (!normalizedEmail || !looksLikeEmail(normalizedEmail)) {
    return null;
  }
  return User.findOne({ email: normalizedEmail, isActive: true });
};

const findActiveUserByUsername = async identifier => {
  const usernameCandidates = expandUsernameCandidates(buildUsernameCandidates(identifier));
  if (!usernameCandidates.length) {
    return null;
  }

  const userByUsername = await User.findOne({
    isActive: true,
    username: { $in: usernameCandidates }
  });

  if (userByUsername) {
    return userByUsername;
  }

  const guessedEmails = usernameCandidates.map(candidate => `${candidate}@nyacademy.dev`);
  return User.findOne({
    isActive: true,
    email: { $in: guessedEmails }
  });
};

const findActiveUserByLoginIdentifier = async identifier => {
  const normalizedIdentifier = resolveLoginAlias(identifier);
  if (!normalizedIdentifier) {
    return null;
  }

  if (looksLikeEmail(normalizedIdentifier)) {
    const userByEmail = await findActiveUserByEmail(normalizedIdentifier);
    if (userByEmail) {
      return userByEmail;
    }

    const [localPart] = normalizedIdentifier.split('@');
    if (localPart) {
      return findActiveUserByUsername(localPart);
    }
    return null;
  }

  return findActiveUserByUsername(normalizedIdentifier);
};

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
      .select('-passwordHash');
    
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
        name: preferences?.displayName?.trim?.() || username,
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
      const { username, email, preferences, isActive, name } = req.body;
      
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
      if (name && typeof name === 'string' && name.trim()) updateData.name = name.trim();
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
    const { email, password, username: usernameField, identifier: identifierField } = req.body;
    const rawIdentifier =
      [email, usernameField, identifierField].find(
        value => typeof value === 'string' && value.trim().length > 0
      ) || '';
    const identifier = rawIdentifier.trim();
    
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email or username and password are required'
      });
    }

    const user = await findActiveUserByLoginIdentifier(identifier);
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/username or password is incorrect'
      });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/username or password is incorrect'
      });
    }
    
    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    
    // Return user without password hash
    const userResponse = user.toObject();
    if (!userResponse.name && userResponse.username) {
      userResponse.name = userResponse.username;
    }
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

// GET /api/users/suggestions - Get friend suggestions for the current user
router.get('/suggestions', authenticate, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    
    // Get current user's profile to see who they're following
    const currentUserProfile = await Profile.findOne({ userId: currentUserId });
    
    if (!currentUserProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'You need to create a profile first to get friend suggestions'
      });
    }
    
    // Get IDs of users already followed
    const followingIds = currentUserProfile.following.map(id => id.toString());
    followingIds.push(currentUserId); // Exclude self from suggestions
    
    // Find users with similar tags (interests)
    const similarTagsUsers = await Profile.find({
      userId: { $nin: followingIds },
      tags: { $in: currentUserProfile.tags }
    }).populate('userId', 'username email').limit(10);
    
    // Find users followed by people the current user follows
    let followedByFollowed = [];
    if (followingIds.length > 1) { // Only if user follows someone
      const profilesOfFollowed = await Profile.find({
        userId: { $in: followingIds.slice(0, -1) } // Exclude self
      });
      
      const followedByFollowedIds = profilesOfFollowed.flatMap(profile =>
        profile.following.map(id => id.toString())
      );
      
      // Remove duplicates and already followed users
      const uniqueFollowedIds = [...new Set(followedByFollowedIds)]
        .filter(id => !followingIds.includes(id));
      
      if (uniqueFollowedIds.length > 0) {
        followedByFollowed = await Profile.find({
          userId: { $in: uniqueFollowedIds }
        }).populate('userId', 'username email').limit(10);
      }
    }
    
    // Get random users as additional suggestions if needed
    let randomUsers = [];
    const allSuggestions = [...similarTagsUsers, ...followedByFollowed];
    const suggestionIds = allSuggestions.map(p => p.userId._id.toString());
    
    if (allSuggestions.length < 10) {
      const remainingCount = 10 - allSuggestions.length;
      randomUsers = await Profile.find({
        userId: {
          $nin: [...followingIds, ...suggestionIds]
        }
      }).populate('userId', 'username email')
        .limit(remainingCount);
    }
    
    // Combine all suggestions and limit to 10
    const allSuggestionsCombined = [...allSuggestions, ...randomUsers].slice(0, 10);
    
    // Format the response with user profile information
    const suggestions = allSuggestionsCombined.map(profile => ({
      _id: profile.userId._id.toString(), // Ensure _id is a string
      userId: profile.userId._id.toString(), // Add userId field as string
      username: profile.userId.username,
      name: profile.name,
      bio: profile.bio,
      avatar: profile.profileImage,
      tags: profile.tags,
      isFollowing: false // All suggestions are users not currently followed
    }));
    
    res.json({
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/search - Search users by name, username, and bio
router.get('/search', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing search query',
        message: 'Search query parameter "q" is required'
      });
    }
    
    const searchTerm = q.trim();
    
    // Get current user's profile to check follow status
    const currentUserProfile = await Profile.findOne({ userId: req.user.id });
    const followingIds = currentUserProfile ?
      currentUserProfile.following.map(id => id.toString()) : [];
    
    // Search for users by name, username, or bio
    const searchFilter = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { bio: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    const profiles = await Profile.find(searchFilter)
      .populate('userId', 'username email isActive')
      .skip(skip)
      .limit(limit)
      .sort({ joined: -1 });
    
    const total = await Profile.countDocuments(searchFilter);
    
    // Format results with follow status
    const users = profiles.map(profile => {
      const userObj = profile.toObject();
      userObj.isFollowing = followingIds.includes(profile.userId._id.toString());
      return userObj;
    });
    
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

export default router;
