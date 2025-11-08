
import express from 'express';
import mongoose from 'mongoose';
import { CalendarEvent } from '../models/index.js';
import { authenticate, ensureUserAccess, addUserIdToBody } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  validateDateFormat,
  validateTimeFormat,
  validatePriority,
  validateHexColor
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/calendar-events - Get all calendar events for the authenticated user
router.get('/', authenticate, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { startDate, endDate } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    // Filter by date range if provided
    if (startDate && endDate) {
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }
    
    const calendarEvents = await CalendarEvent.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ date: 1 });
    
    const total = await CalendarEvent.countDocuments(filter);
    
    res.json({
      calendarEvents,
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

// GET /api/calendar-events/date/:date - Get events for a specific date
router.get('/date/:date',
  authenticate,
  validateDateFormat('date'),
  async (req, res, next) => {
    try {
      const { date } = req.params;
      
      const calendarEvent = await CalendarEvent.findOne({ 
        userId: req.user.id, 
        date 
      });
      
      if (!calendarEvent) {
        // Return empty events array for date with no events
        return res.json({
          date,
          events: []
        });
      }
      
      res.json(calendarEvent);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/calendar-events/:id - Get calendar event document by ID
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const calendarEvent = await CalendarEvent.findById(req.params.id);
    
    if (!calendarEvent) {
      return res.status(404).json({
        error: 'Calendar events not found',
        message: 'The calendar events document with provided ID does not exist'
      });
    }
    
    // Check if user has access to this calendar event
    if (calendarEvent.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view these calendar events'
      });
    }
    
    res.json(calendarEvent);
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar-events - Create new calendar event document
router.post('/',
  authenticate,
  addUserIdToBody,
  validateDateFormat('date'),
  validateTimeFormat('startTime'),
  validateTimeFormat('endTime'),
  validatePriority,
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      const { date, events } = req.body;
      
      if (!date) {
        return res.status(400).json({
          error: 'Missing date',
          message: 'Date is required for calendar events'
        });
      }
      
      // Check if calendar event document already exists for this date
      let calendarEvent = await CalendarEvent.findOne({
        userId: req.user.id,
        date
      });
      
      if (calendarEvent) {
        // Add new events to existing document
        if (events && Array.isArray(events)) {
          calendarEvent.events.push(...events);
          await calendarEvent.save();
        }
      } else {
        // Create new calendar event document
        calendarEvent = new CalendarEvent({
          userId: req.user.id,
          date,
          events: events || []
        });
        await calendarEvent.save();
      }
      
      res.status(201).json({
        message: 'Calendar events created successfully',
        calendarEvent
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/calendar-events/:id - Update calendar event document
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateDateFormat('date'),
  validateTimeFormat('startTime'),
  validateTimeFormat('endTime'),
  validatePriority,
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      // First check if calendar event exists and user has permission
      const existingCalendarEvent = await CalendarEvent.findById(req.params.id);
      
      if (!existingCalendarEvent) {
        return res.status(404).json({
          error: 'Calendar events not found',
          message: 'The calendar events document with provided ID does not exist'
        });
      }
      
      if (existingCalendarEvent.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own calendar events'
        });
      }
      
      // Update calendar event
      const updatedCalendarEvent = await CalendarEvent.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      res.json({
        message: 'Calendar events updated successfully',
        calendarEvent: updatedCalendarEvent
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/calendar-events/:id - Delete calendar event document
router.delete('/:id',
  authenticate,
  validateObjectId('id'),
  async (req, res, next) => {
    try {
      // First check if calendar event exists and user has permission
      const existingCalendarEvent = await CalendarEvent.findById(req.params.id);
      
      if (!existingCalendarEvent) {
        return res.status(404).json({
          error: 'Calendar events not found',
          message: 'The calendar events document with provided ID does not exist'
        });
      }
      
      if (existingCalendarEvent.userId.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own calendar events'
        });
      }
      
      await CalendarEvent.findByIdAndDelete(req.params.id);
      
      res.json({
        message: 'Calendar events deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/calendar-events/date/:date/event/:eventId - Update specific event
router.put('/date/:date/event/:eventId',
  authenticate,
  validateDateFormat('date'),
  validateTimeFormat('startTime'),
  validateTimeFormat('endTime'),
  validatePriority,
  validateHexColor('color'),
  async (req, res, next) => {
    try {
      const { date, eventId } = req.params;
      
      const calendarEvent = await CalendarEvent.findOne({
        userId: req.user.id,
        date
      });
      
      if (!calendarEvent) {
        return res.status(404).json({
          error: 'Calendar events not found',
          message: 'No calendar events found for this date'
        });
      }
      
      // Find the specific event
      const eventIndex = calendarEvent.events.findIndex(
        event => event.id === eventId
      );
      
      if (eventIndex === -1) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'The event with provided ID does not exist'
        });
      }
      
      // Update the specific event
      Object.assign(calendarEvent.events[eventIndex], req.body);
      await calendarEvent.save();
      
      res.json({
        message: 'Event updated successfully',
        event: calendarEvent.events[eventIndex]
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/calendar-events/date/:date/event/:eventId - Delete specific event
router.delete('/date/:date/event/:eventId',
  authenticate,
  validateDateFormat('date'),
  async (req, res, next) => {
    try {
      const { date, eventId } = req.params;
      
      const calendarEvent = await CalendarEvent.findOne({
        userId: req.user.id,
        date
      });
      
      if (!calendarEvent) {
        return res.status(404).json({
          error: 'Calendar events not found',
          message: 'No calendar events found for this date'
        });
      }
      
      // Find the specific event
      const eventIndex = calendarEvent.events.findIndex(
        event => event.id === eventId
      );
      
      if (eventIndex === -1) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'The event with provided ID does not exist'
        });
      }
      
      // Remove the specific event
      calendarEvent.events.splice(eventIndex, 1);
      await calendarEvent.save();
      
      res.json({
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/calendar-events/stats/user - Get user's calendar statistics
router.get('/stats/user', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const stats = await CalendarEvent.aggregate([
      { $match: dateFilter },
      { $unwind: '$events' },
      {
        $group: {
          _id: {
            category: '$events.category',
            priority: '$events.priority'
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: ['$events.completed', 1, 0] }
          }
        }
      }
    ]);
    
    const totalEvents = await CalendarEvent.aggregate([
      { $match: dateFilter },
      { $project: { eventCount: { $size: '$events' } } },
      { $group: { _id: null, total: { $sum: '$eventCount' } } }
    ]);
    
    const completedEvents = await CalendarEvent.aggregate([
      { $match: dateFilter },
      { $unwind: '$events' },
      { $match: { 'events.completed': true } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    
    res.json({
      totalEvents: totalEvents.length > 0 ? totalEvents[0].total : 0,
      completedEvents: completedEvents.length > 0 ? completedEvents[0].total : 0,
      completionRate: totalEvents.length > 0 && totalEvents[0].total > 0
        ? Math.round((completedEvents[0].total / totalEvents[0].total) * 100)
        : 0,
      categoryBreakdown: stats.reduce((acc, stat) => {
        const key = `${stat._id.category}-${stat._id.priority}`;
        acc[key] = {
          category: stat._id.category,
          priority: stat._id.priority,
          count: stat.count,
          completed: stat.completed
        };
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

export default router;