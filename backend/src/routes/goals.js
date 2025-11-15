import express from 'express';
import { Goal } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateStatus,
  validatePriority,
  validateProgress
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/goals - Get all goals for the authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, isPublic, category, priority } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (status) filter.status = status;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    const goals = await Goal.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Goal.countDocuments(filter);
    
    res.json({
      goals,
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

// GET /api/goals/public - Get public goals from all users
router.get('/public', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, category, priority } = req.query;
    
    // Build filter object for public goals
    const filter = { isPublic: true };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    const goals = await Goal.find(filter)
      .populate('userId', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Goal.countDocuments(filter);
    
    res.json({
      goals,
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

// GET /api/goals/:id - Get goal by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id).populate('userId', 'username');
    
    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'The goal with the provided ID does not exist'
      });
    }
    
    // Check if user has access to this goal
    if (goal.userId._id.toString() !== req.user.id && !goal.isPublic) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this goal'
      });
    }
    
    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// POST /api/goals - Create new goal
router.post('/',
  authenticate,
  addUserIdToBody,
  validateStatus(['active', 'completed', 'paused']),
  validatePriority,
  validateProgress,
  async (req, res, next) => {
    try {
      const goalData = {
        ...req.body,
        userId: req.user.id // Ensure userId is set to authenticated user
      };
      
      const newGoal = new Goal(goalData);
      await newGoal.save();
      
      // Populate references for response
      await newGoal.populate('userId', 'username');
      
      res.status(201).json({
        message: 'Goal created successfully',
        goal: newGoal
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/goals/:id - Update goal
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateStatus(['active', 'completed', 'paused']),
  validatePriority,
  validateProgress,
  async (req, res, next) => {
    try {
      // First check if goal exists and user has permission
      const existingGoal = await Goal.findById(req.params.id);
      
      if (!existingGoal) {
        return res.status(404).json({
          error: 'Goal not found',
          message: 'The goal with the provided ID does not exist'
        });
      }
      
      if (existingGoal.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own goals'
        });
      }
      
      // Update goal
      const updateData = { ...req.body };
      
      // Auto-set completedAt when status is changed to completed
      if (req.body.status === 'completed' && existingGoal.status !== 'completed') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
      
      const updatedGoal = await Goal.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'username');
      
      res.json({
        message: 'Goal updated successfully',
        goal: updatedGoal
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/goals/:id - Delete goal
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if goal exists and user has permission
      const existingGoal = await Goal.findById(req.params.id);
      
      if (!existingGoal) {
        return res.status(404).json({
          error: 'Goal not found',
          message: 'The goal with the provided ID does not exist'
        });
      }
      
      if (existingGoal.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own goals'
        });
      }
      
      await Goal.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Goal deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/goals/:id/progress - Update goal progress
router.put('/:id/progress',
  authenticate,
  validateObjectId('id'),
  validateProgress,
  async (req, res, next) => {
    try {
      const { progress } = req.body;
      
      const goal = await Goal.findById(req.params.id);
      
      if (!goal) {
        return res.status(404).json({
          error: 'Goal not found',
          message: 'The goal with the provided ID does not exist'
        });
      }
      
      if (goal.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update progress for your own goals'
        });
      }
      
      goal.progress = progress;
      
      // Auto-update status based on progress
      if (progress >= 100 && goal.status !== 'completed') {
        goal.status = 'completed';
        goal.completedAt = new Date();
      } else if (progress > 0 && goal.status === 'paused') {
        goal.status = 'active';
      }
      
      await goal.save();
      
      res.json({
        message: 'Progress updated successfully',
        progress: goal.progress,
        status: goal.status
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/goals/:id/complete - Mark goal as completed
router.post('/:id/complete',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const goal = await Goal.findById(req.params.id);
      
      if (!goal) {
        return res.status(404).json({
          error: 'Goal not found',
          message: 'The goal with the provided ID does not exist'
        });
      }
      
      if (goal.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only complete your own goals'
        });
      }
      
      if (goal.status === 'completed') {
        return res.status(400).json({
          error: 'Already completed',
          message: 'This goal is already marked as completed'
        });
      }
      
      goal.status = 'completed';
      goal.progress = 100;
      goal.completedAt = new Date();
      
      await goal.save();
      
      res.json({
        message: 'Goal marked as completed successfully',
        goal
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/goals/stats/user - Get user's goal statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await Goal.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress' }
        }
      }
    ]);
    
    const totalGoals = await Goal.countDocuments({ userId });
    const completedGoals = await Goal.countDocuments({ userId, status: 'completed' });
    const activeGoals = await Goal.countDocuments({ userId, status: 'active' });
    const pausedGoals = await Goal.countDocuments({ userId, status: 'paused' });
    const publicGoals = await Goal.countDocuments({ userId, isPublic: true });
    
    // Calculate completion rate
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    
    res.json({
      totalGoals,
      completedGoals,
      activeGoals,
      pausedGoals,
      publicGoals,
      completionRate: Math.round(completionRate * 100) / 100,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgProgress: stat.avgProgress || 0
        };
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;
