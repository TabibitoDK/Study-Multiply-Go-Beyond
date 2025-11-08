import express from 'express';
import { FlashcardAISettings } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/flashcard-ai-settings - Get AI settings for authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const settings = await FlashcardAISettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        userId: req.user.id,
        language: 'en',
        preferences: {
          defaultCardCount: 10,
          difficulty: 'intermediate',
          includeImages: false,
          autoTranslate: false
        },
        usageStats: {
          totalCardsGenerated: 0,
          lastUsed: null,
          monthlyUsage: []
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// GET /api/flashcard-ai-settings/:id - Get AI settings by user ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const settings = await FlashcardAISettings.findOne({ userId: req.params.id });
    
    if (!settings) {
      return res.status(404).json({
        error: 'AI settings not found',
        message: 'The AI settings for this user do not exist'
      });
    }
    
    // Only allow users to view their own settings
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own AI settings'
      });
    }
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// POST /api/flashcard-ai-settings - Create new AI settings
router.post('/',
  authenticate,
  addUserIdToBody,
  async (req, res, next) => {
    try {
      const { userId, language, apiKey, preferences, usageStats } = req.body;
      
      // Check if settings already exist for this user
      const existingSettings = await FlashcardAISettings.findOne({ userId: req.user.id });
      if (existingSettings) {
        return res.status(409).json({
          error: 'Settings already exist',
          message: 'AI settings already exist for this user. Use PUT to update.'
        });
      }
      
      // Create new settings
      const newSettings = new FlashcardAISettings({
        userId: req.user.id,
        language: language || 'en',
        apiKey: apiKey || '',
        preferences: {
          defaultCardCount: preferences?.defaultCardCount || 10,
          difficulty: preferences?.difficulty || 'intermediate',
          includeImages: preferences?.includeImages || false,
          autoTranslate: preferences?.autoTranslate || false
        },
        usageStats: {
          totalCardsGenerated: usageStats?.totalCardsGenerated || 0,
          lastUsed: usageStats?.lastUsed || null,
          monthlyUsage: usageStats?.monthlyUsage || []
        }
      });
      
      await newSettings.save();
      
      res.status(201).json({
        message: 'AI settings created successfully',
        settings: newSettings
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flashcard-ai-settings/:id - Update AI settings
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if settings exist and user has permission
      const existingSettings = await FlashcardAISettings.findOne({ userId: req.params.id });
      
      if (!existingSettings) {
        return res.status(404).json({
          error: 'AI settings not found',
          message: 'The AI settings for this user do not exist'
        });
      }
      
      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own AI settings'
        });
      }
      
      // Update settings
      const updateData = { ...req.body };
      
      const updatedSettings = await FlashcardAISettings.findOneAndUpdate(
        { userId: req.params.id },
        updateData,
        { new: true, runValidators: true }
      );
      
      res.json({
        message: 'AI settings updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/flashcard-ai-settings/:id - Delete AI settings
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if settings exist and user has permission
      const existingSettings = await FlashcardAISettings.findOne({ userId: req.params.id });
      
      if (!existingSettings) {
        return res.status(404).json({
          error: 'AI settings not found',
          message: 'The AI settings for this user do not exist'
        });
      }
      
      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own AI settings'
        });
      }
      
      await FlashcardAISettings.findOneAndDelete({ userId: req.params.id });
      
      res.json({
        message: 'AI settings deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flashcard-ai-settings/:id/api-key - Update API key
router.put('/:id/api-key',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({
          error: 'Missing API key',
          message: 'API key is required'
        });
      }
      
      const existingSettings = await FlashcardAISettings.findOne({ userId: req.params.id });
      
      if (!existingSettings) {
        return res.status(404).json({
          error: 'AI settings not found',
          message: 'The AI settings for this user do not exist'
        });
      }
      
      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own API key'
        });
      }
      
      // Update API key
      const updatedSettings = await FlashcardAISettings.findOneAndUpdate(
        { userId: req.params.id },
        { apiKey },
        { new: true, runValidators: true }
      );
      
      res.json({
        message: 'API key updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flashcard-ai-settings/:id/preferences - Update preferences
router.put('/:id/preferences',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { preferences } = req.body;
      
      if (!preferences) {
        return res.status(400).json({
          error: 'Missing preferences',
          message: 'Preferences object is required'
        });
      }
      
      const existingSettings = await FlashcardAISettings.findOne({ userId: req.params.id });
      
      if (!existingSettings) {
        return res.status(404).json({
          error: 'AI settings not found',
          message: 'The AI settings for this user do not exist'
        });
      }
      
      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own preferences'
        });
      }
      
      // Update preferences
      const updatedSettings = await FlashcardAISettings.findOneAndUpdate(
        { userId: req.params.id },
        { preferences },
        { new: true, runValidators: true }
      );
      
      res.json({
        message: 'Preferences updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/flashcard-ai-settings/:id/usage - Record usage
router.post('/:id/usage',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { cardsGenerated } = req.body;
      
      if (!cardsGenerated || cardsGenerated <= 0) {
        return res.status(400).json({
          error: 'Invalid usage data',
          message: 'Number of cards generated must be greater than 0'
        });
      }
      
      const existingSettings = await FlashcardAISettings.findOne({ userId: req.params.id });
      
      if (!existingSettings) {
        return res.status(404).json({
          error: 'AI settings not found',
          message: 'The AI settings for this user do not exist'
        });
      }
      
      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only record usage for your own settings'
        });
      }
      
      // Update usage stats
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Find existing monthly usage entry
      const monthlyUsageIndex = existingSettings.usageStats.monthlyUsage.findIndex(
        entry => entry.month === currentMonth
      );
      
      if (monthlyUsageIndex >= 0) {
        // Update existing month
        existingSettings.usageStats.monthlyUsage[monthlyUsageIndex].count += cardsGenerated;
      } else {
        // Add new month entry
        existingSettings.usageStats.monthlyUsage.push({
          month: currentMonth,
          count: cardsGenerated
        });
      }
      
      // Update total and last used
      existingSettings.usageStats.totalCardsGenerated += cardsGenerated;
      existingSettings.usageStats.lastUsed = now;
      
      await existingSettings.save();
      
      res.json({
        message: 'Usage recorded successfully',
        totalCardsGenerated: existingSettings.usageStats.totalCardsGenerated,
        monthlyUsage: existingSettings.usageStats.monthlyUsage
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/flashcard-ai-settings/:id/usage - Get usage statistics
router.get('/:id/usage',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const settings = await FlashcardAISettings.findOne({ userId: req.params.id });
      
      if (!settings) {
        return res.status(404).json({
          error: 'AI settings not found',
          message: 'The AI settings for this user do not exist'
        });
      }
      
      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own usage statistics'
        });
      }
      
      res.json({
        usageStats: settings.usageStats
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;