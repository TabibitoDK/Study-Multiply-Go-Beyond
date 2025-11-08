import express from 'express';
import mongoose from 'mongoose';
import { Book } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateRating,
  validateProgress,
  validateStatus,
  validateVisibility,
  validateISBN,
  validateURL
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/books - Get all books for the authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, visibility, rating, tags, search } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (rating) filter.rating = parseInt(rating);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments(filter);
    
    res.json({
      books,
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

// GET /api/books/public - Get public books from all users
router.get('/public', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, rating, tags, search } = req.query;
    
    // Build filter object for public books
    const filter = { visibility: 'public' };
    
    if (status) filter.status = status;
    if (rating) filter.rating = parseInt(rating);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const books = await Book.find(filter)
      .populate('userId', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments(filter);
    
    res.json({
      books,
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

// GET /api/books/:id - Get book by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('userId', 'username');
    
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The book with the provided ID does not exist'
      });
    }
    
    // Check if user has access to this book
    if (book.userId._id.toString() !== req.user.id && book.visibility !== 'public') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this book'
      });
    }
    
    res.json(book);
  } catch (error) {
    next(error);
  }
});

// POST /api/books - Create new book
router.post('/',
  authenticate,
  addUserIdToBody,
  validateRating,
  validateProgress,
  validateStatus(['reading', 'completed', 'want-to-read', 'abandoned']),
  validateVisibility,
  validateISBN,
  validateURL('cover'),
  async (req, res, next) => {
    try {
      const bookData = {
        ...req.body,
        userId: req.user.id, // Ensure userId is set to authenticated user
        visibility: 'public'
      };
      
      const newBook = new Book(bookData);
      await newBook.save();
      
      res.status(201).json({
        message: 'Book created successfully',
        book: newBook
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/books/:id - Update book
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateRating,
  validateProgress,
  validateStatus(['reading', 'completed', 'want-to-read', 'abandoned']),
  validateVisibility,
  validateISBN,
  validateURL('cover'),
  async (req, res, next) => {
    try {
      // First check if book exists and user has permission
      const existingBook = await Book.findById(req.params.id);
      
      if (!existingBook) {
        return res.status(404).json({
          error: 'Book not found',
          message: 'The book with the provided ID does not exist'
        });
      }
      
      if (existingBook.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own books'
        });
      }
      
      // Update book
      const updatedBook = await Book.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      res.json({
        message: 'Book updated successfully',
        book: updatedBook
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/books/:id - Delete book
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if book exists and user has permission
      const existingBook = await Book.findById(req.params.id);
      
      if (!existingBook) {
        return res.status(404).json({
          error: 'Book not found',
          message: 'The book with the provided ID does not exist'
        });
      }
      
      if (existingBook.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own books'
        });
      }
      
      await Book.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Book deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/books/:id/favorite - Toggle favorite status
router.post('/:id/favorite',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      const book = await Book.findById(req.params.id);
      
      if (!book) {
        return res.status(404).json({
          error: 'Book not found',
          message: 'The book with the provided ID does not exist'
        });
      }
      
      if (book.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only favorite your own books'
        });
      }
      
      book.favorite = !book.favorite;
      await book.save();
      
      res.json({
        message: `Book ${book.favorite ? 'added to' : 'removed from'} favorites`,
        favorite: book.favorite
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/books/:id/progress - Update reading progress
router.put('/:id/progress',
  authenticate,
  validateObjectId('id'),
  validateProgress,
  async (req, res, next) => {
    try {
      const { progress } = req.body;
      
      const book = await Book.findById(req.params.id);
      
      if (!book) {
        return res.status(404).json({
          error: 'Book not found',
          message: 'The book with the provided ID does not exist'
        });
      }
      
      if (book.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update progress for your own books'
        });
      }
      
      book.progress = progress;
      
      // Auto-update status based on progress
      if (progress >= 100 && book.status !== 'completed') {
        book.status = 'completed';
        book.finishDate = new Date();
      } else if (progress > 0 && book.status === 'want-to-read') {
        book.status = 'reading';
        if (!book.startDate) {
          book.startDate = new Date();
        }
      }
      
      await book.save();
      
      res.json({
        message: 'Progress updated successfully',
        progress: book.progress,
        status: book.status
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/books/stats/user - Get user's book statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await Book.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const totalBooks = await Book.countDocuments({ userId });
    const favoriteBooks = await Book.countDocuments({ userId, favorite: true });
    const totalPages = await Book.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), pages: { $exists: true, $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$pages' } } }
    ]);
    
    res.json({
      totalBooks,
      favoriteBooks,
      totalPages: totalPages.length > 0 ? totalPages[0].total : 0,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgRating: stat.avgRating || 0
        };
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;
