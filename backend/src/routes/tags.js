import express from 'express';
import { Tag } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateHexColor,
  validateCategory
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/tags - Get all tags (with pagination)
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { category, search, isSystem } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (isSystem !== undefined) filter.isSystem = isSystem === 'true';
    
    // Text search
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const tags = await Tag.find(filter)
      .populate('relatedTags', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ usageCount: -1, name: 1 });
    
    const total = await Tag.countDocuments(filter);
    
    res.json({
      tags,
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

// GET /api/tags/popular - Get popular tags
router.get('/popular', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { category } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    
    const tags = await Tag.find(filter)
      .populate('relatedTags', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ usageCount: -1, name: 1 });
    
    const total = await Tag.countDocuments(filter);
    
    res.json({
      tags,
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

// GET /api/tags/system - Get system tags
router.get('/system', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { category } = req.query;
    
    // Build filter object for system tags
    const filter = { isSystem: true };
    
    if (category) filter.category = category;
    
    const tags = await Tag.find(filter)
      .populate('relatedTags', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ usageCount: -1, name: 1 });
    
    const total = await Tag.countDocuments(filter);
    
    res.json({
      tags,
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

// GET /api/tags/user - Get user-created tags
router.get('/user', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { category } = req.query;
    
    // Build filter object for user-created tags
    const filter = { isSystem: false };
    
    if (category) filter.category = category;
    
    const tags = await Tag.find(filter)
      .populate('relatedTags', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ usageCount: -1, name: 1 });
    
    const total = await Tag.countDocuments(filter);
    
    res.json({
      tags,
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

// GET /api/tags/:id - Get tag by ID
router.get('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id)
      .populate('relatedTags', 'name');
    
    if (!tag) {
      return res.status(404).json({
        error: 'Tag not found',
        message: 'The tag with provided ID does not exist'
      });
    }
    
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

// GET /api/tags/name/:name - Get tag by name
router.get('/name/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    
    const tag = await Tag.findOne({ name })
      .populate('relatedTags', 'name');
    
    if (!tag) {
      return res.status(404).json({
        error: 'Tag not found',
        message: 'The tag with provided name does not exist'
      });
    }
    
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

// POST /api/tags - Create new tag
router.post('/',
  authenticate,
  validateCategory(['subject', 'skill', 'general']),
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      const { name, category, description, color, relatedTags } = req.body;
      
      if (!name) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Tag name is required'
        });
      }
      
      // Check if tag already exists
      const existingTag = await Tag.findOne({ name });
      if (existingTag) {
        return res.status(409).json({
          error: 'Tag already exists',
          message: 'A tag with this name already exists'
        });
      }
      
      // Create new tag
      const newTag = new Tag({
        name,
        category: category || 'general',
        description: description || '',
        color: color || '#007bff',
        usageCount: 0,
        isSystem: false,
        relatedTags: relatedTags || []
      });
      
      await newTag.save();
      
      // Populate references for response
      await newTag.populate('relatedTags', 'name');
      
      res.status(201).json({
        message: 'Tag created successfully',
        tag: newTag
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tags/:id - Update tag
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateCategory(['subject', 'skill', 'general']),
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      // First check if tag exists
      const existingTag = await Tag.findById(req.params.id);
      
      if (!existingTag) {
        return res.status(404).json({
          error: 'Tag not found',
          message: 'The tag with provided ID does not exist'
        });
      }
      
      // Only allow updating user-created tags, not system tags
      if (existingTag.isSystem) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'System tags cannot be modified'
        });
      }
      
      // Check if name is being changed and if it's already taken
      if (req.body.name && req.body.name !== existingTag.name) {
        const existingName = await Tag.findOne({ 
          name: req.body.name,
          _id: { $ne: req.params.id }
        });
        if (existingName) {
          return res.status(409).json({
            error: 'Name taken',
            message: 'This tag name is already taken'
          });
        }
      }
      
      // Update tag
      const updatedTag = await Tag.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('relatedTags', 'name');
      
      res.json({
        message: 'Tag updated successfully',
        tag: updatedTag
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/tags/:id - Delete tag
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if tag exists
      const existingTag = await Tag.findById(req.params.id);
      
      if (!existingTag) {
        return res.status(404).json({
          error: 'Tag not found',
          message: 'The tag with provided ID does not exist'
        });
      }
      
      // Only allow deleting user-created tags, not system tags
      if (existingTag.isSystem) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'System tags cannot be deleted'
        });
      }
      
      await Tag.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Tag deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tags/:id/related - Add related tag
router.post('/:id/related',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { relatedTagId } = req.body;
      
      if (!relatedTagId) {
        return res.status(400).json({
          error: 'Missing related tag ID',
          message: 'Related tag ID is required'
        });
      }
      
      const tag = await Tag.findById(req.params.id);
      
      if (!tag) {
        return res.status(404).json({
          error: 'Tag not found',
          message: 'The tag with provided ID does not exist'
        });
      }
      
      const relatedTag = await Tag.findById(relatedTagId);
      
      if (!relatedTag) {
        return res.status(404).json({
          error: 'Related tag not found',
          message: 'The related tag with provided ID does not exist'
        });
      }
      
      // Check if already related
      const isAlreadyRelated = tag.relatedTags.includes(
        relatedTagId
      );
      
      if (isAlreadyRelated) {
        return res.status(400).json({
          error: 'Already related',
          message: 'This tag is already related to the specified tag'
        });
      }
      
      // Add to related tags
      tag.relatedTags.push(relatedTagId);
      await tag.save();
      
      // Populate references for response
      await tag.populate('relatedTags', 'name');
      
      res.json({
        message: 'Related tag added successfully',
        tag
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/tags/:id/related/:relatedTagId - Remove related tag
router.delete('/:id/related/:relatedTagId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { relatedTagId } = req.params;
      
      const tag = await Tag.findById(req.params.id);
      
      if (!tag) {
        return res.status(404).json({
          error: 'Tag not found',
          message: 'The tag with provided ID does not exist'
        });
      }
      
      // Check if actually related
      const isRelated = tag.relatedTags.includes(
        relatedTagId
      );
      
      if (!isRelated) {
        return res.status(400).json({
          error: 'Not related',
          message: 'This tag is not related to the specified tag'
        });
      }
      
      // Remove from related tags
      tag.relatedTags = tag.relatedTags.filter(
        id => id.toString() !== relatedTagId
      );
      await tag.save();
      
      res.json({
        message: 'Related tag removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tags/:id/increment-usage - Increment tag usage count
router.put('/:id/increment-usage',
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const tag = await Tag.findById(req.params.id);
      
      if (!tag) {
        return res.status(404).json({
          error: 'Tag not found',
          message: 'The tag with provided ID does not exist'
        });
      }
      
      // Increment usage count
      tag.usageCount += 1;
      await tag.save();
      
      res.json({
        message: 'Usage count incremented successfully',
        usageCount: tag.usageCount
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tags/:id/decrement-usage - Decrement tag usage count
router.put('/:id/decrement-usage',
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const tag = await Tag.findById(req.params.id);
      
      if (!tag) {
        return res.status(404).json({
          error: 'Tag not found',
          message: 'The tag with provided ID does not exist'
        });
      }
      
      // Decrement usage count (but not below 0)
      tag.usageCount = Math.max(0, tag.usageCount - 1);
      await tag.save();
      
      res.json({
        message: 'Usage count decremented successfully',
        usageCount: tag.usageCount
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tags/stats/overview - Get tag statistics overview
router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await Tag.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' }
        }
      }
    ]);
    
    const totalTags = await Tag.countDocuments();
    const systemTags = await Tag.countDocuments({ isSystem: true });
    const userTags = await Tag.countDocuments({ isSystem: false });
    const totalUsage = await Tag.aggregate([
      { $group: { _id: null, total: { $sum: '$usageCount' } } }
    ]);
    
    res.json({
      totalTags,
      systemTags,
      userTags,
      totalUsage: totalUsage.length > 0 ? totalUsage[0].total : 0,
      categoryBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalUsage: stat.totalUsage,
          avgUsage: stat.avgUsage || 0
        };
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;
