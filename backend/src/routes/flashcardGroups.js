import express from 'express';
import mongoose from 'mongoose';
import { FlashcardGroup } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateProgress
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/flashcard-groups - Get all flashcard groups for authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { isPublic, category, tags, search } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (category) filter.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const flashcardGroups = await FlashcardGroup.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ lastStudiedAt: -1, createdAt: -1 });
    
    const total = await FlashcardGroup.countDocuments(filter);
    
    res.json({
      flashcardGroups,
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

// GET /api/flashcard-groups/public - Get public flashcard groups from all users
router.get('/public', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { category, tags, search } = req.query;
    
    // Build filter object for public flashcard groups
    const filter = { isPublic: true };
    
    if (category) filter.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const flashcardGroups = await FlashcardGroup.find(filter)
      .populate('userId', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ lastStudiedAt: -1, createdAt: -1 });
    
    const total = await FlashcardGroup.countDocuments(filter);
    
    res.json({
      flashcardGroups,
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

// GET /api/flashcard-groups/:id - Get flashcard group by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const flashcardGroup = await FlashcardGroup.findById(req.params.id)
      .populate('userId', 'username');
    
    if (!flashcardGroup) {
      return res.status(404).json({
        error: 'Flashcard group not found',
        message: 'The flashcard group with provided ID does not exist'
      });
    }
    
    // Check if user has access to this flashcard group
    if (flashcardGroup.userId._id.toString() !== req.user.id && !flashcardGroup.isPublic) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this flashcard group'
      });
    }
    
    res.json(flashcardGroup);
  } catch (error) {
    next(error);
  }
});

// POST /api/flashcard-groups - Create new flashcard group
router.post('/',
  authenticate,
  addUserIdToBody,
  async (req, res, next) => {
    try {
      const groupData = {
        ...req.body,
        userId: req.user.id, // Ensure userId is set to authenticated user
        nextCardId: 1,
        stats: {
          totalCards: 0,
          masteredCards: 0,
          reviewingCards: 0,
          newCards: 0
        }
      };
      
      const newFlashcardGroup = new FlashcardGroup(groupData);
      await newFlashcardGroup.save();
      
      // Populate references for response
      await newFlashcardGroup.populate('userId', 'username');
      
      res.status(201).json({
        message: 'Flashcard group created successfully',
        flashcardGroup: newFlashcardGroup
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flashcard-groups/:id - Update flashcard group
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if flashcard group exists and user has permission
      const existingFlashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!existingFlashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (existingFlashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own flashcard groups'
        });
      }
      
      // Update flashcard group
      const updatedFlashcardGroup = await FlashcardGroup.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('userId', 'username');
      
      res.json({
        message: 'Flashcard group updated successfully',
        flashcardGroup: updatedFlashcardGroup
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/flashcard-groups/:id - Delete flashcard group
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if flashcard group exists and user has permission
      const existingFlashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!existingFlashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (existingFlashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own flashcard groups'
        });
      }
      
      await FlashcardGroup.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Flashcard group deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/flashcard-groups/:id/cards - Add card to flashcard group
router.post('/:id/cards',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { question, answer, category } = req.body;
      
      if (!question || !answer) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Both question and answer are required'
        });
      }
      
      const flashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!flashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (flashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only add cards to your own flashcard groups'
        });
      }
      
      // Add new card
      const newCard = {
        id: flashcardGroup.nextCardId,
        question,
        answer,
        category: category || 'general',
        easyCount: 0,
        difficulty: 1, // medium by default
        reviewCount: 0,
        correctCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      flashcardGroup.cards.push(newCard);
      flashcardGroup.nextCardId += 1;
      flashcardGroup.stats.totalCards += 1;
      flashcardGroup.stats.newCards += 1;
      
      await flashcardGroup.save();
      
      res.status(201).json({
        message: 'Card added successfully',
        card: newCard
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/flashcard-groups/:id/cards/:cardId - Update card in flashcard group
router.put('/:id/cards/:cardId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { cardId } = req.params;
      const { question, answer, category } = req.body;
      
      const flashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!flashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (flashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update cards in your own flashcard groups'
        });
      }
      
      // Find specific card
      const cardIndex = flashcardGroup.cards.findIndex(
        card => card.id === parseInt(cardId)
      );
      
      if (cardIndex === -1) {
        return res.status(404).json({
          error: 'Card not found',
          message: 'The card with provided ID does not exist'
        });
      }
      
      // Update card
      const card = flashcardGroup.cards[cardIndex];
      if (question) card.question = question;
      if (answer) card.answer = answer;
      if (category) card.category = category;
      card.updatedAt = new Date();
      
      await flashcardGroup.save();
      
      res.json({
        message: 'Card updated successfully',
        card: flashcardGroup.cards[cardIndex]
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/flashcard-groups/:id/cards/:cardId - Delete card from flashcard group
router.delete('/:id/cards/:cardId',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { cardId } = req.params;
      
      const flashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!flashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (flashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete cards from your own flashcard groups'
        });
      }
      
      // Find specific card
      const cardIndex = flashcardGroup.cards.findIndex(
        card => card.id === parseInt(cardId)
      );
      
      if (cardIndex === -1) {
        return res.status(404).json({
          error: 'Card not found',
          message: 'The card with provided ID does not exist'
        });
      }
      
      const deletedCard = flashcardGroup.cards[cardIndex];
      
      // Remove card and update stats
      flashcardGroup.cards.splice(cardIndex, 1);
      flashcardGroup.stats.totalCards -= 1;
      
      // Update category stats based on card difficulty
      if (deletedCard.difficulty === 0) {
        flashcardGroup.stats.masteredCards -= 1;
      } else if (deletedCard.reviewCount > 0) {
        flashcardGroup.stats.reviewingCards -= 1;
      } else {
        flashcardGroup.stats.newCards -= 1;
      }
      
      await flashcardGroup.save();
      
      res.json({
        message: 'Card deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/flashcard-groups/:id/review - Review a card
router.post('/:id/review',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const { cardId, difficulty, isCorrect } = req.body;
      
      if (!cardId || difficulty === undefined || isCorrect === undefined) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'cardId, difficulty, and isCorrect are required'
        });
      }
      
      const flashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!flashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (flashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only review cards in your own flashcard groups'
        });
      }
      
      // Find specific card
      const cardIndex = flashcardGroup.cards.findIndex(
        card => card.id === parseInt(cardId)
      );
      
      if (cardIndex === -1) {
        return res.status(404).json({
          error: 'Card not found',
          message: 'The card with provided ID does not exist'
        });
      }
      
      const card = flashcardGroup.cards[cardIndex];
      
      // Update card review data
      card.reviewCount += 1;
      card.lastReviewed = new Date();
      
      if (isCorrect) {
        card.correctCount += 1;
      }
      
      // Update difficulty and stats
      const oldDifficulty = card.difficulty;
      card.difficulty = difficulty;
      
      // Update group stats based on difficulty change
      if (oldDifficulty === 0 && difficulty !== 0) {
        flashcardGroup.stats.masteredCards -= 1;
      } else if (oldDifficulty !== 0 && difficulty === 0) {
        flashcardGroup.stats.masteredCards += 1;
      }
      
      if (card.reviewCount === 1) {
        flashcardGroup.stats.newCards -= 1;
        flashcardGroup.stats.reviewingCards += 1;
      }
      
      // Calculate next review date (simple spaced repetition)
      const now = new Date();
      let nextReview;
      
      if (difficulty === 0) { // easy
        nextReview = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      } else if (difficulty === 1) { // medium
        nextReview = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      } else { // hard
        nextReview = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day
      }
      
      card.nextReview = nextReview;
      flashcardGroup.lastStudiedAt = now;
      
      await flashcardGroup.save();
      
      res.json({
        message: 'Card reviewed successfully',
        card: flashcardGroup.cards[cardIndex]
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/flashcard-groups/:id/due - Get cards due for review
router.get('/:id/due',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const flashcardGroup = await FlashcardGroup.findById(req.params.id);
      
      if (!flashcardGroup) {
        return res.status(404).json({
          error: 'Flashcard group not found',
          message: 'The flashcard group with provided ID does not exist'
        });
      }
      
      if (flashcardGroup.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view due cards for your own flashcard groups'
        });
      }
      
      const now = new Date();
      const dueCards = flashcardGroup.cards.filter(card => {
        return !card.nextReview || card.nextReview <= now;
      });
      
      res.json({
        dueCards,
        totalDue: dueCards.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/flashcard-groups/stats/user - Get user's flashcard statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await FlashcardGroup.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalGroups: { $sum: 1 },
          totalCards: { $sum: '$stats.totalCards' },
          masteredCards: { $sum: '$stats.masteredCards' },
          reviewingCards: { $sum: '$stats.reviewingCards' },
          newCards: { $sum: '$stats.newCards' },
          publicGroups: {
            $sum: { $cond: ['$isPublic', 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats.length > 0 ? stats[0] : {
      totalGroups: 0,
      totalCards: 0,
      masteredCards: 0,
      reviewingCards: 0,
      newCards: 0,
      publicGroups: 0
    };
    
    // Calculate mastery rate
    const masteryRate = result.totalCards > 0 
      ? (result.masteredCards / result.totalCards) * 100 
      : 0;
    
    res.json({
      ...result,
      masteryRate: Math.round(masteryRate * 100) / 100
    });
  } catch (error) {
    next(error);
  }
});

export default router;