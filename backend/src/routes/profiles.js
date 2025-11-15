import express from 'express';
import { Profile, User } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateUsername,
  validateURL
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/profiles - Get all public profiles (with pagination)
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, tags } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    const profiles = await Profile.find(filter)
      .populate('userId', 'username email isActive')
      .populate('followers', 'username')
      .populate('following', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ joined: -1 });
    
    const total = await Profile.countDocuments(filter);
    
    res.json({
      profiles,
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

// GET /api/profiles/user/:userId - Get profile by user ID
router.get('/user/:userId', validateObjectId('userId'), async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId })
      .populate('userId', 'username email isActive')
      .populate('followers', 'username')
      .populate('following', 'username');
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The profile for the provided user ID does not exist'
      });
    }
    
    // Check privacy settings
    const isOwner = req.user && req.user.id === req.params.userId;
    const responseProfile = profile.toObject();
    
    if (!isOwner) {
      // Remove private information
      delete responseProfile.privacy;
      if (!responseProfile.privacy?.showEmail) {
        delete responseProfile.userId.email;
      }
      if (!responseProfile.privacy?.showLocation) {
        delete responseProfile.location;
      }
    }
    
    res.json(responseProfile);
  } catch (error) {
    next(error);
  }
});

// GET /api/profiles/me - Get current user's profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id })
      .populate('userId', 'username email isActive')
      .populate('followers', 'username')
      .populate('following', 'username');
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'You do not have a profile yet'
      });
    }
    
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// POST /api/profiles - Create new profile
router.post('/',
  authenticate,
  addUserIdToBody,
  validateUsername,
  validateURL('socialLinks.website'),
  async (req, res, next) => {
    try {
      const { userId, username, name, bio, ...profileData } = req.body;
      
      // Check if profile already exists for this user
      const existingProfile = await Profile.findOne({ userId: req.user.id });
      if (existingProfile) {
        return res.status(409).json({
          error: 'Profile already exists',
          message: 'You already have a profile'
        });
      }
      
      // Check if username is already taken
      const existingUsername = await Profile.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({
          error: 'Username taken',
          message: 'This username is already taken'
        });
      }
      
      // Create new profile
      const newProfile = new Profile({
        userId: req.user.id,
        username,
        name,
        bio,
        joined: new Date(),
        ...profileData
      });
      
      await newProfile.save();
      
      // Populate references for response
      await newProfile.populate('userId', 'username email');
      
      res.status(201).json({
        message: 'Profile created successfully',
        profile: newProfile
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/profiles/:id - Update profile
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateUsername,
  validateURL('socialLinks.website'),
  async (req, res, next) => {
    try {
      // First check if profile exists and user has permission
      const existingProfile = await Profile.findById(req.params.id);
      
      if (!existingProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile with the provided ID does not exist'
        });
      }
      
      if (existingProfile.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own profile'
        });
      }
      
      // Check if username is being changed and if it's already taken
      if (req.body.username && req.body.username !== existingProfile.username) {
        const existingUsername = await Profile.findOne({ 
          username: req.body.username,
          _id: { $ne: req.params.id }
        });
        if (existingUsername) {
          return res.status(409).json({
            error: 'Username taken',
            message: 'This username is already taken'
          });
        }
      }
      
      // Update profile
      const updatedProfile = await Profile.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('userId', 'username email')
       .populate('followers', 'username')
       .populate('following', 'username');
      
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/profiles/:id - Delete profile
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if profile exists and user has permission
      const existingProfile = await Profile.findById(req.params.id);
      
      if (!existingProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile with the provided ID does not exist'
        });
      }
      
      if (existingProfile.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own profile'
        });
      }
      
      await Profile.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/profiles/:id/follow - Follow a user
router.post('/:id/follow',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const targetProfile = await Profile.findById(req.params.id);
      
      if (!targetProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile with the provided ID does not exist'
        });
      }
      
      // Check if user is trying to follow themselves
      if (targetProfile.userId.toString() === req.user.id) {
        return res.status(400).json({
          error: 'Invalid action',
          message: 'You cannot follow yourself'
        });
      }
      
      // Check if following is allowed
      if (!targetProfile.privacy?.allowFollowers) {
        return res.status(403).json({
          error: 'Follow not allowed',
          message: 'This user does not allow followers'
        });
      }
      
      // Get current user's profile
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      
      if (!currentUserProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'You need to create a profile first'
        });
      }
      
      // Check if already following
      const isAlreadyFollowing = currentUserProfile.following.includes(
        targetProfile.userId
      );
      
      if (isAlreadyFollowing) {
        return res.status(400).json({
          error: 'Already following',
          message: 'You are already following this user'
        });
      }
      
      // Add to following list
      currentUserProfile.following.push(targetProfile.userId);
      await currentUserProfile.save();
      
      // Add to followers list of target user
      targetProfile.followers.push(req.user.id);
      await targetProfile.save();
      
      res.json({
        message: 'User followed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/profiles/:id/follow - Unfollow a user
router.delete('/:id/follow',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const targetProfile = await Profile.findById(req.params.id);
      
      if (!targetProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile with the provided ID does not exist'
        });
      }
      
      // Get current user's profile
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      
      if (!currentUserProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'You need to create a profile first'
        });
      }
      
      // Check if actually following
      const isFollowing = currentUserProfile.following.includes(
        targetProfile.userId
      );
      
      if (!isFollowing) {
        return res.status(400).json({
          error: 'Not following',
          message: 'You are not following this user'
        });
      }
      
      // Remove from following list
      currentUserProfile.following = currentUserProfile.following.filter(
        id => id.toString() !== targetProfile.userId.toString()
      );
      await currentUserProfile.save();
      
      // Remove from followers list of target user
      targetProfile.followers = targetProfile.followers.filter(
        id => id.toString() !== req.user.id
      );
      await targetProfile.save();
      
      res.json({
        message: 'User unfollowed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/profiles/:id/followers - Get followers of a user
router.get('/:id/followers',
  validateObjectId('id'),
  validatePagination,
  async (req, res, next) => {
    try {
      const { page, limit, skip } = req.pagination;
      
      const profile = await Profile.findById(req.params.id)
        .populate({
          path: 'followers',
          select: 'username',
          options: { skip, limit }
        });
      
      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile with the provided ID does not exist'
        });
      }
      
      const total = profile.followers.length;
      
      res.json({
        followers: profile.followers,
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
  }
);

// GET /api/profiles/:id/following - Get users that a user is following
router.get('/:id/following',
  validateObjectId('id'),
  validatePagination,
  async (req, res, next) => {
    try {
      const { page, limit, skip } = req.pagination;
      
      const profile = await Profile.findById(req.params.id)
        .populate({
          path: 'following',
          select: 'username',
          options: { skip, limit }
        });
      
      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile with the provided ID does not exist'
        });
      }
      
      const total = profile.following.length;
      
      res.json({
        following: profile.following,
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
  }
);

// POST /api/profiles/follow/:userId - Follow a user by userId
router.post('/follow/:userId',
  authenticate,
  validateObjectId('userId'),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      
      // Check if user is trying to follow themselves
      if (targetUserId === req.user.id) {
        return res.status(400).json({
          error: 'Invalid action',
          message: 'You cannot follow yourself'
        });
      }
      
      // Get target user's profile
      const targetProfile = await Profile.findOne({ userId: targetUserId });
      
      if (!targetProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile for the provided user ID does not exist'
        });
      }
      
      // Check if following is allowed
      if (!targetProfile.privacy?.allowFollowers) {
        return res.status(403).json({
          error: 'Follow not allowed',
          message: 'This user does not allow followers'
        });
      }
      
      // Get current user's profile
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      
      if (!currentUserProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'You need to create a profile first'
        });
      }
      
      // Check if already following
      const isAlreadyFollowing = currentUserProfile.following.includes(
        targetUserId
      );
      
      if (isAlreadyFollowing) {
        return res.status(400).json({
          error: 'Already following',
          message: 'You are already following this user'
        });
      }
      
      // Add to following list
      currentUserProfile.following.push(targetUserId);
      await currentUserProfile.save();
      
      // Add to followers list of target user
      targetProfile.followers.push(req.user.id);
      await targetProfile.save();
      
      res.json({
        message: 'User followed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/profiles/unfollow/:userId - Unfollow a user by userId
router.delete('/unfollow/:userId',
  authenticate,
  validateObjectId('userId'),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      
      // Get target user's profile
      const targetProfile = await Profile.findOne({ userId: targetUserId });
      
      if (!targetProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'The profile for the provided user ID does not exist'
        });
      }
      
      // Get current user's profile
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      
      if (!currentUserProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'You need to create a profile first'
        });
      }
      
      // Check if actually following
      const isFollowing = currentUserProfile.following.includes(
        targetUserId
      );
      
      if (!isFollowing) {
        return res.status(400).json({
          error: 'Not following',
          message: 'You are not following this user'
        });
      }
      
      // Remove from following list
      currentUserProfile.following = currentUserProfile.following.filter(
        id => id.toString() !== targetUserId
      );
      await currentUserProfile.save();
      
      // Remove from followers list of target user
      targetProfile.followers = targetProfile.followers.filter(
        id => id.toString() !== req.user.id
      );
      await targetProfile.save();
      
      res.json({
        message: 'User unfollowed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
