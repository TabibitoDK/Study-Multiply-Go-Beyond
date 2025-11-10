import express from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateStatus,
  validateVisibility
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/posts - Get all posts for the authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { visibility, tags, search } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (visibility) filter.visibility = visibility;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const posts = await Post.find(filter)
      .populate('userId', 'username')
      .populate('books', 'title author cover')
      .populate('comments.userId', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Post.countDocuments(filter);
    
    res.json({
      posts,
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

// GET /api/posts/public - Get public posts from all users
router.get('/public', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { tags, search } = req.query;
    
    // Build filter object for public posts
    const filter = { visibility: 'public' };
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const posts = await Post.find(filter)
      .populate('userId', 'username')
      .populate('books', 'title author cover')
      .populate('comments.userId', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Post.countDocuments(filter);
    
    res.json({
      posts,
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

// GET /api/posts/search - Search posts with pagination
router.get('/search', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { q, tags, visibility } = req.query;
    
    // Validate search query
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query cannot be empty'
      });
    }
    
    // Build filter object for search
    const filter = { visibility: 'public' }; // Default to public posts for search
    
    // Override visibility if specified
    if (visibility) {
      filter.visibility = visibility;
    }
    
    // Add tags filter if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search using MongoDB's $text operator
    filter.$text = { $search: q.trim() };
    
    const posts = await Post.find(filter)
      .populate('userId', 'username')
      .populate('books', 'title author cover')
      .populate('comments.userId', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 }); // Sort by relevance then date
    
    const total = await Post.countDocuments(filter);
    
    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      query: q.trim()
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/user/:userId - Get posts for a specific user (public unless owner)
router.get('/user/:userId', validateObjectId('userId'), async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const requesterId = req.headers['x-user-id'];
    const isOwner = requesterId && requesterId === targetUserId;

    const filter = {
      userId: new mongoose.Types.ObjectId(targetUserId)
    };

    if (!isOwner) {
      filter.visibility = 'public';
    }

    const posts = await Post.find(filter)
      .populate('userId', 'username')
      .populate('books', 'title author cover')
      .populate('comments.userId', 'username')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/:id - Get post by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username')
      .populate('books', 'title author cover')
      .populate('comments.userId', 'username');
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'The post with the provided ID does not exist'
      });
    }
    
    // Check if user has access to this post
    if (post.userId._id.toString() !== req.user.id && post.visibility === 'private') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this post'
      });
    }
    
    res.json(post);
  } catch (error) {
    next(error);
  }
});

// POST /api/posts - Create new post
router.post('/',
  authenticate,
  addUserIdToBody,
  validateVisibility,
  async (req, res, next) => {
    try {
      const postData = {
        ...req.body,
        userId: req.user.id // Ensure userId is set to authenticated user
      };
      
      const newPost = new Post(postData);
      await newPost.save();
      
      // Populate references for response
      await newPost.populate('userId', 'username');
      await newPost.populate('books', 'title author cover');
      
      res.status(201).json({
        message: 'Post created successfully',
        post: newPost
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/posts/:id - Update post
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateVisibility,
  async (req, res, next) => {
    try {
      // First check if post exists and user has permission
      const existingPost = await Post.findById(req.params.id);
      
      if (!existingPost) {
        return res.status(404).json({
          error: 'Post not found',
          message: 'The post with the provided ID does not exist'
        });
      }
      
      if (existingPost.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own posts'
        });
      }
      
      // Mark as edited if content is being changed
      const updateData = { ...req.body };
      if (req.body.content && req.body.content !== existingPost.content) {
        updateData.isEdited = true;
        updateData.editedAt = new Date();
      }
      
      // Update post
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'username')
       .populate('books', 'title author cover')
       .populate('comments.userId', 'username');
      
      res.json({
        message: 'Post updated successfully',
        post: updatedPost
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/posts/:id - Delete post
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if post exists and user has permission
      const existingPost = await Post.findById(req.params.id);
      
      if (!existingPost) {
        return res.status(404).json({
          error: 'Post not found',
          message: 'The post with the provided ID does not exist'
        });
      }
      
      if (existingPost.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own posts'
        });
      }
      
      await Post.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Post deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/posts/:id/like - Like a post
router.post('/:id/like',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          error: 'Post not found',
          message: 'The post with the provided ID does not exist'
        });
      }
      
      // Only allow liking public posts or own posts
      if (post.visibility === 'private' && post.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Cannot like private posts'
        });
      }
      
      post.likes += 1;
      await post.save();
      
      res.json({
        message: 'Post liked successfully',
        likes: post.likes
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/posts/:id/comments - Add comment to post
router.post('/:id/comments',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid comment',
          message: 'Comment content cannot be empty'
        });
      }
      
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          error: 'Post not found',
          message: 'The post with the provided ID does not exist'
        });
      }
      
      // Only allow commenting on public posts or own posts
      if (post.visibility === 'private' && post.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Cannot comment on private posts'
        });
      }
      
      // Add comment
      post.comments.push({
        userId: req.user.id,
        content: content.trim(),
        createdAt: new Date()
      });
      
      await post.save();
      
      // Populate the new comment
      await post.populate('comments.userId', 'username');
      
      const newComment = post.comments[post.comments.length - 1];
      
      res.status(201).json({
        message: 'Comment added successfully',
        comment: newComment
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/posts/:id/comments/:commentId - Delete comment from post
router.delete('/:id/comments/:commentId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          error: 'Post not found',
          message: 'The post with the provided ID does not exist'
        });
      }
      
      const commentIndex = post.comments.findIndex(
        comment => comment._id.toString() === req.params.commentId
      );
      
      if (commentIndex === -1) {
        return res.status(404).json({
          error: 'Comment not found',
          message: 'The comment with the provided ID does not exist'
        });
      }
      
      const comment = post.comments[commentIndex];
      
      // Only allow comment author or post author to delete
      if (comment.userId.toString() !== req.user.id && post.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own comments or comments on your posts'
        });
      }
      
      post.comments.splice(commentIndex, 1);
      await post.save();
      
      res.json({
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/posts/stats/user - Get user's post statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await Post.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$visibility',
          count: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
          totalComments: { $sum: { $size: '$comments' } }
        }
      }
    ]);
    
    const totalPosts = await Post.countDocuments({ userId });
    const totalLikes = await Post.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);
    const totalComments = await Post.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: { $size: '$comments' } } } }
    ]);
    
    res.json({
      totalPosts,
      totalLikes: totalLikes.length > 0 ? totalLikes[0].total : 0,
      totalComments: totalComments.length > 0 ? totalComments[0].total : 0,
      visibilityBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalLikes: stat.totalLikes,
          totalComments: stat.totalComments
        };
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;
