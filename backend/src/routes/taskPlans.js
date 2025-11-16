import express from 'express';
import { TaskPlan } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateStatus,
  validatePriority,
  validateCategory
} from '../middleware/validation.js';

const router = express.Router();

const normalizeId = value => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    const nested = value._id || value.id || value.toString?.();
    if (nested && nested !== value) {
      return normalizeId(nested);
    }
  }
  return String(value);
};

// GET /api/task-plans - Get all task plans for authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, isPublic, category, tags } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (status) filter.status = status;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (category) filter.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    const taskPlans = await TaskPlan.find(filter)
      .populate('collaborators', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await TaskPlan.countDocuments(filter);
    
    res.json({
      taskPlans,
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

// GET /api/task-plans/public - Get public task plans from all users
router.get('/public', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, category, tags } = req.query;
    
    // Build filter object for public task plans
    const filter = { isPublic: true };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    const taskPlans = await TaskPlan.find(filter)
      .populate('userId', 'username')
      .populate('collaborators', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await TaskPlan.countDocuments(filter);
    
    res.json({
      taskPlans,
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

// GET /api/task-plans/:id - Get task plan by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const taskPlan = await TaskPlan.findById(req.params.id)
      .populate('userId', 'username')
      .populate('collaborators', 'username')
      .populate('tasks.relatedBookId', 'title author');
    
    if (!taskPlan) {
      return res.status(404).json({
        error: 'Task plan not found',
        message: 'The task plan with provided ID does not exist'
      });
    }
    
    // Check if user has access to this task plan
    if (taskPlan.userId._id.toString() !== req.user.id && 
        !taskPlan.isPublic && 
        !taskPlan.collaborators.some(collab => collab._id.toString() === req.user.id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this task plan'
      });
    }
    
    res.json(taskPlan);
  } catch (error) {
    next(error);
  }
});

// POST /api/task-plans - Create new task plan
router.post('/',
  authenticate,
  addUserIdToBody,
  validateStatus(['not-started', 'in-progress', 'completed', 'paused']),
  validateCategory(['academic', 'personal', 'work']),
  async (req, res, next) => {
    try {
      const planData = {
        ...req.body,
        userId: req.user.id // Ensure userId is set to authenticated user
      };
      
      const newTaskPlan = new TaskPlan(planData);
      await newTaskPlan.save();
      
      // Populate references for response
      await newTaskPlan.populate('userId', 'username');
      await newTaskPlan.populate('collaborators', 'username');
      
      res.status(201).json({
        message: 'Task plan created successfully',
        taskPlan: newTaskPlan
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/task-plans/:id - Update task plan
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateStatus(['not-started', 'in-progress', 'completed', 'paused']),
  validateCategory(['academic', 'personal', 'work']),
  async (req, res, next) => {
    try {
      // First check if task plan exists and user has permission
      const existingTaskPlan = await TaskPlan.findById(req.params.id);
      
      if (!existingTaskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with provided ID does not exist'
        });
      }
      
      if (normalizeId(existingTaskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own task plans'
        });
      }
      
      // Update task plan
      const updateData = { ...req.body };
      
      // Auto-set completedAt when status is changed to completed
      if (req.body.status === 'completed' && existingTaskPlan.status !== 'completed') {
        updateData.completedAt = new Date();
      }
      
      const updatedTaskPlan = await TaskPlan.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'username')
       .populate('collaborators', 'username');
      
      res.json({
        message: 'Task plan updated successfully',
        taskPlan: updatedTaskPlan
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/task-plans/:id - Delete task plan
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if task plan exists and user has permission
      const existingTaskPlan = await TaskPlan.findById(req.params.id);
      
      if (!existingTaskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(existingTaskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own task plans'
        });
      }
      
      await TaskPlan.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Task plan deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/task-plans/:id/tasks - Add task to task plan
router.post('/:id/tasks',
  authenticate,
  validateObjectId('id'),
  validateStatus(['not-started', 'in-progress', 'completed']),
  validatePriority,
  async (req, res, next) => {
    try {
      const { title, description, priority, dueDate, estimatedHours, tags, dependencies, relatedBookId } = req.body;
      
      if (!title) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Task title is required'
        });
      }
      
      const taskPlan = await TaskPlan.findById(req.params.id);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(taskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only add tasks to your own task plans'
        });
      }
      
      // Generate unique task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add new task
      const newTask = {
        id: taskId,
        title,
        description: description || '',
        status: 'not-started',
        priority: priority || 'medium',
        createdAt: new Date(),
        startAt: null,
        dueDate: dueDate || null,
        completedAt: null,
        estimatedHours: estimatedHours || 0,
        actualHours: 0,
        tags: tags || [],
        dependencies: dependencies || [],
        relatedBookId: relatedBookId || null,
        subtasks: []
      };
      
      taskPlan.tasks.push(newTask);
      await taskPlan.save();
      
      res.status(201).json({
        message: 'Task added successfully',
        task: newTask
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/task-plans/:id/tasks/:taskId - Update task in task plan
router.put('/:id/tasks/:taskId',
  authenticate,
  validateObjectId('id'),
  validateStatus(['not-started', 'in-progress', 'completed']),
  validatePriority,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      
      const taskPlan = await TaskPlan.findById(req.params.id);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(taskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update tasks in your own task plans'
        });
      }
      
      // Find specific task
      const taskIndex = taskPlan.tasks.findIndex(
        task => task.id === taskId
      );
      
      if (taskIndex === -1) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The task with the provided ID does not exist'
        });
      }
      
      // Update task
      const task = taskPlan.tasks[taskIndex];
      const updateData = { ...req.body };
      
      // Auto-set completedAt when status is changed to completed
      if (req.body.status === 'completed' && task.status !== 'completed') {
        updateData.completedAt = new Date();
      }
      
      Object.assign(task, updateData);
      task.updatedAt = new Date();
      
      await taskPlan.save();
      
      res.json({
        message: 'Task updated successfully',
        task: taskPlan.tasks[taskIndex]
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/task-plans/:id/tasks/:taskId - Delete task from task plan
router.delete('/:id/tasks/:taskId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      
      const taskPlan = await TaskPlan.findById(req.params.id);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(taskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete tasks from your own task plans'
        });
      }
      
      // Find specific task
      const taskIndex = taskPlan.tasks.findIndex(
        task => task.id === taskId
      );
      
      if (taskIndex === -1) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The task with the provided ID does not exist'
        });
      }
      
      // Remove task
      taskPlan.tasks.splice(taskIndex, 1);
      await taskPlan.save();
      
      res.json({
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/task-plans/:id/tasks/:taskId/subtasks - Add subtask to task
router.post('/:id/tasks/:taskId/subtasks',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Subtask title is required'
        });
      }
      
      const taskPlan = await TaskPlan.findById(req.params.id);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(taskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only add subtasks to your own task plans'
        });
      }
      
      // Find specific task
      const taskIndex = taskPlan.tasks.findIndex(
        task => task.id === taskId
      );
      
      if (taskIndex === -1) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The task with the provided ID does not exist'
        });
      }
      
      // Generate unique subtask ID
      const subtaskId = `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add new subtask
      const newSubtask = {
        id: subtaskId,
        title,
        completed: false,
        completedAt: null
      };
      
      taskPlan.tasks[taskIndex].subtasks.push(newSubtask);
      await taskPlan.save();
      
      res.status(201).json({
        message: 'Subtask added successfully',
        subtask: newSubtask
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/task-plans/:id/tasks/:taskId/subtasks/:subtaskId - Update subtask
router.put('/:id/tasks/:taskId/subtasks/:subtaskId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { taskId, subtaskId } = req.params;
      const { completed } = req.body;
      
      const taskPlan = await TaskPlan.findById(req.params.id);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(taskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update subtasks in your own task plans'
        });
      }
      
      // Find specific task
      const taskIndex = taskPlan.tasks.findIndex(
        task => task.id === taskId
      );
      
      if (taskIndex === -1) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The task with the provided ID does not exist'
        });
      }
      
      // Find specific subtask
      const subtaskIndex = taskPlan.tasks[taskIndex].subtasks.findIndex(
        subtask => subtask.id === subtaskId
      );
      
      if (subtaskIndex === -1) {
        return res.status(404).json({
          error: 'Subtask not found',
          message: 'The subtask with the provided ID does not exist'
        });
      }
      
      // Update subtask
      const subtask = taskPlan.tasks[taskIndex].subtasks[subtaskIndex];
      
      if (completed !== undefined) {
        subtask.completed = completed;
        if (completed && !subtask.completedAt) {
          subtask.completedAt = new Date();
        } else if (!completed) {
          subtask.completedAt = null;
        }
      }
      
      await taskPlan.save();
      
      res.json({
        message: 'Subtask updated successfully',
        subtask: taskPlan.tasks[taskIndex].subtasks[subtaskIndex]
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/task-plans/:id/tasks/:taskId/subtasks/:subtaskId - Delete subtask
router.delete('/:id/tasks/:taskId/subtasks/:subtaskId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { taskId, subtaskId } = req.params;
      
      const taskPlan = await TaskPlan.findById(req.params.id);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with the provided ID does not exist'
        });
      }
      
      if (normalizeId(taskPlan.userId) !== normalizeId(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete subtasks from your own task plans'
        });
      }
      
      // Find specific task
      const taskIndex = taskPlan.tasks.findIndex(
        task => task.id === taskId
      );
      
      if (taskIndex === -1) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The task with the provided ID does not exist'
        });
      }
      
      // Find specific subtask
      const subtaskIndex = taskPlan.tasks[taskIndex].subtasks.findIndex(
        subtask => subtask.id === subtaskId
      );
      
      if (subtaskIndex === -1) {
        return res.status(404).json({
          error: 'Subtask not found',
          message: 'The subtask with the provided ID does not exist'
        });
      }
      
      // Remove subtask
      taskPlan.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
      await taskPlan.save();
      
      res.json({
        message: 'Subtask deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/task-plans/stats/user - Get user's task plan statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await TaskPlan.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalPlans = await TaskPlan.countDocuments({ userId });
    const publicPlans = await TaskPlan.countDocuments({ userId, isPublic: true });
    
    // Task statistics
    const taskStats = await TaskPlan.aggregate([
      { $match: { userId } },
      { $unwind: '$tasks' },
      {
        $group: {
          _id: '$tasks.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalTasks = await TaskPlan.aggregate([
      { $match: { userId } },
      { $project: { taskCount: { $size: '$tasks' } } },
      { $group: { _id: null, total: { $sum: '$taskCount' } } }
    ]);
    
    const completedTasks = await TaskPlan.aggregate([
      { $match: { userId } },
      { $unwind: '$tasks' },
      { $match: { 'tasks.status': 'completed' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    
    // Calculate completion rate
    const taskCompletionRate = totalTasks.length > 0 && totalTasks[0].total > 0 
      ? (completedTasks.length > 0 ? completedTasks[0].total : 0) / totalTasks[0].total * 100 
      : 0;
    
    res.json({
      totalPlans,
      publicPlans,
      totalTasks: totalTasks.length > 0 ? totalTasks[0].total : 0,
      completedTasks: completedTasks.length > 0 ? completedTasks[0].total : 0,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      planStatusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      taskStatusBreakdown: taskStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;
