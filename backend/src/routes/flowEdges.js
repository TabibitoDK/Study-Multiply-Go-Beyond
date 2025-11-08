import express from 'express';
import mongoose from 'mongoose';
import { FlowEdge, TaskPlan } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateHexColor
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/flow-edges - Get all flow edges for authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { planId } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (planId) {
      filter.planId = planId;
    }
    
    const flowEdges = await FlowEdge.find(filter)
      .populate('planId', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await FlowEdge.countDocuments(filter);
    
    res.json({
      flowEdges,
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

// GET /api/flow-edges/plan/:planId - Get flow edges for a specific task plan
router.get('/plan/:planId', authenticate, validateObjectId('planId'), async (req, res, next) => {
  try {
    const { planId } = req.params;
    
    // First check if task plan exists and user has access
    const taskPlan = await TaskPlan.findById(planId);
    
    if (!taskPlan) {
      return res.status(404).json({
        error: 'Task plan not found',
        message: 'The task plan with provided ID does not exist'
      });
    }
    
    // Check if user has access to this task plan
    if (taskPlan.userId.toString() !== req.user.id && 
        !taskPlan.isPublic && 
        !taskPlan.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view flow edges for this task plan'
      });
    }
    
    const flowEdge = await FlowEdge.findOne({ planId })
      .populate('planId', 'title');
    
    if (!flowEdge) {
      // Return empty edges array for plan with no edges
      return res.json({
        planId,
        edges: []
      });
    }
    
    res.json(flowEdge);
  } catch (error) {
    next(error);
  }
});

// GET /api/flow-edges/:id - Get flow edge document by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const flowEdge = await FlowEdge.findById(req.params.id)
      .populate('planId', 'title');
    
    if (!flowEdge) {
      return res.status(404).json({
        error: 'Flow edges not found',
        message: 'The flow edges document with provided ID does not exist'
      });
    }
    
    // Check if user has access to this flow edge
    if (flowEdge.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view these flow edges'
      });
    }
    
    res.json(flowEdge);
  } catch (error) {
    next(error);
  }
});

// POST /api/flow-edges - Create new flow edge document
router.post('/',
  authenticate,
  addUserIdToBody,
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      const { planId, edges } = req.body;
      
      if (!planId) {
        return res.status(400).json({
          error: 'Missing plan ID',
          message: 'Plan ID is required for flow edges'
        });
      }
      
      // Check if task plan exists and user has access
      const taskPlan = await TaskPlan.findById(planId);
      
      if (!taskPlan) {
        return res.status(404).json({
          error: 'Task plan not found',
          message: 'The task plan with provided ID does not exist'
        });
      }
      
      if (taskPlan.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only create flow edges for your own task plans'
        });
      }
      
      // Check if flow edge document already exists for this plan
      let flowEdge = await FlowEdge.findOne({ planId });
      
      if (flowEdge) {
        // Add new edges to existing document
        if (edges && Array.isArray(edges)) {
          flowEdge.edges.push(...edges);
          await flowEdge.save();
        }
      } else {
        // Create new flow edge document
        flowEdge = new FlowEdge({
          userId: req.user.id,
          planId,
          edges: edges || []
        });
        await flowEdge.save();
      }
      
      // Populate references for response
      await flowEdge.populate('planId', 'title');
      
      res.status(201).json({
        message: 'Flow edges created successfully',
        flowEdge
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flow-edges/:id - Update flow edge document
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      // First check if flow edge exists and user has permission
      const existingFlowEdge = await FlowEdge.findById(req.params.id);
      
      if (!existingFlowEdge) {
        return res.status(404).json({
          error: 'Flow edges not found',
          message: 'The flow edges document with provided ID does not exist'
        });
      }
      
      if (existingFlowEdge.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own flow edges'
        });
      }
      
      // Update flow edge
      const updatedFlowEdge = await FlowEdge.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('planId', 'title');
      
      res.json({
        message: 'Flow edges updated successfully',
        flowEdge: updatedFlowEdge
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/flow-edges/:id - Delete flow edge document
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if flow edge exists and user has permission
      const existingFlowEdge = await FlowEdge.findById(req.params.id);
      
      if (!existingFlowEdge) {
        return res.status(404).json({
          error: 'Flow edges not found',
          message: 'The flow edges document with provided ID does not exist'
        });
      }
      
      if (existingFlowEdge.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own flow edges'
        });
      }
      
      await FlowEdge.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Flow edges deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/flow-edges/:id/edges - Add edge to flow edge document
router.post('/:id/edges',
  authenticate,
  validateObjectId('id'),
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      const { source, target, type, style, label } = req.body;
      
      if (!source || !target) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Both source and target are required'
        });
      }
      
      const flowEdge = await FlowEdge.findById(req.params.id);
      
      if (!flowEdge) {
        return res.status(404).json({
          error: 'Flow edges not found',
          message: 'The flow edges document with provided ID does not exist'
        });
      }
      
      if (flowEdge.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only add edges to your own flow edge documents'
        });
      }
      
      // Generate unique edge ID
      const edgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add new edge
      const newEdge = {
        id: edgeId,
        source,
        target,
        type: type || 'dependency',
        style: {
          type: style?.type || 'straight',
          animated: style?.animated || false,
          color: style?.color || '#000000',
          width: style?.width || 2
        },
        label: label || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      flowEdge.edges.push(newEdge);
      await flowEdge.save();
      
      res.status(201).json({
        message: 'Edge added successfully',
        edge: newEdge
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flow-edges/:id/edges/:edgeId - Update edge in flow edge document
router.put('/:id/edges/:edgeId',
  authenticate,
  validateObjectId('id'),
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      const { edgeId } = req.params;
      const { source, target, type, style, label } = req.body;
      
      const flowEdge = await FlowEdge.findById(req.params.id);
      
      if (!flowEdge) {
        return res.status(404).json({
          error: 'Flow edges not found',
          message: 'The flow edges document with provided ID does not exist'
        });
      }
      
      if (flowEdge.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update edges in your own flow edge documents'
        });
      }
      
      // Find specific edge
      const edgeIndex = flowEdge.edges.findIndex(
        edge => edge.id === edgeId
      );
      
      if (edgeIndex === -1) {
        return res.status(404).json({
          error: 'Edge not found',
          message: 'The edge with provided ID does not exist'
        });
      }
      
      // Update edge
      const edge = flowEdge.edges[edgeIndex];
      if (source) edge.source = source;
      if (target) edge.target = target;
      if (type) edge.type = type;
      if (style) edge.style = { ...edge.style, ...style };
      if (label !== undefined) edge.label = label;
      edge.updatedAt = new Date();
      
      await flowEdge.save();
      
      res.json({
        message: 'Edge updated successfully',
        edge: flowEdge.edges[edgeIndex]
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/flow-edges/:id/edges/:edgeId - Delete edge from flow edge document
router.delete('/:id/edges/:edgeId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { edgeId } = req.params;
      
      const flowEdge = await FlowEdge.findById(req.params.id);
      
      if (!flowEdge) {
        return res.status(404).json({
          error: 'Flow edges not found',
          message: 'The flow edges document with provided ID does not exist'
        });
      }
      
      if (flowEdge.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete edges from your own flow edge documents'
        });
      }
      
      // Find specific edge
      const edgeIndex = flowEdge.edges.findIndex(
        edge => edge.id === edgeId
      );
      
      if (edgeIndex === -1) {
        return res.status(404).json({
          error: 'Edge not found',
          message: 'The edge with provided ID does not exist'
        });
      }
      
      // Remove edge
      flowEdge.edges.splice(edgeIndex, 1);
      await flowEdge.save();
      
      res.json({
        message: 'Edge deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/flow-edges/stats/user - Get user's flow edge statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await FlowEdge.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalFlowDocuments: { $sum: 1 },
          totalEdges: { $sum: { $size: '$edges' } }
        }
      }
    ]);
    
    const edgeTypeStats = await FlowEdge.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$edges' },
      {
        $group: {
          _id: '$edges.type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = stats.length > 0 ? stats[0] : {
      totalFlowDocuments: 0,
      totalEdges: 0
    };
    
    res.json({
      ...result,
      edgeTypeBreakdown: edgeTypeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;