import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Profile from '../../src/models/Profile.js';
import Book from '../../src/models/Book.js';
import Post from '../../src/models/Post.js';
import Tag from '../../src/models/Tag.js';
import Goal from '../../src/models/Goal.js';
import CalendarEvent from '../../src/models/CalendarEvent.js';
import FlashcardGroup from '../../src/models/FlashcardGroup.js';
import FlashcardAISettings from '../../src/models/FlashcardAISettings.js';
import TaskPlan from '../../src/models/TaskPlan.js';
import FlowEdge from '../../src/models/FlowEdge.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Rollback manager for migration operations
 */
export class RollbackManager {
  constructor() {
    this.rollbackData = {
      timestamp: null,
      users: [],
      profiles: [],
      books: [],
      posts: [],
      tags: [],
      goals: [],
      calendarEvents: [],
      flashcardGroups: [],
      flashcardAISettings: [],
      taskPlans: [],
      flowEdges: []
    };
    this.rollbackFile = path.join(__dirname, '../data/rollback-data.json');
  }

  /**
   * Initialize rollback data with timestamp
   */
  initializeRollback() {
    this.rollbackData.timestamp = new Date().toISOString();
    console.log(`Rollback initialized at ${this.rollbackData.timestamp}`);
  }

  /**
   * Record created users for rollback
   * @param {Array} users - Array of created user objects
   */
  recordUsers(users) {
    this.rollbackData.users = users.map(user => ({
      _id: user.userId,
      username: user.username,
      profileId: user.profileId
    }));
  }

  /**
   * Record created books for rollback
   * @param {Array} books - Array of created book objects
   */
  recordBooks(books) {
    this.rollbackData.books = books.map(book => ({
      _id: book._id,
      title: book.title,
      userId: book.userId
    }));
  }

  /**
   * Record created posts for rollback
   * @param {Array} posts - Array of created post objects
   */
  recordPosts(posts) {
    this.rollbackData.posts = posts.map(post => ({
      _id: post._id,
      userId: post.userId
    }));
  }

  /**
   * Record created tags for rollback
   * @param {Array} tags - Array of created tag objects
   */
  recordTags(tags) {
    this.rollbackData.tags = tags.map(tag => ({
      _id: tag._id,
      name: tag.name
    }));
  }

  /**
   * Record created goals for rollback
   * @param {Array} goals - Array of created goal objects
   */
  recordGoals(goals) {
    this.rollbackData.goals = goals.map(goal => ({
      _id: goal._id,
      userId: goal.userId,
      text: goal.text
    }));
  }

  /**
   * Record created calendar events for rollback
   * @param {Array} events - Array of created calendar event objects
   */
  recordCalendarEvents(events) {
    this.rollbackData.calendarEvents = events.map(event => ({
      _id: event._id,
      userId: event.userId,
      date: event.date
    }));
  }

  /**
   * Record created flashcard groups for rollback
   * @param {Array} groups - Array of created flashcard group objects
   */
  recordFlashcardGroups(groups) {
    this.rollbackData.flashcardGroups = groups.map(group => ({
      _id: group._id,
      userId: group.userId,
      name: group.name
    }));
  }

  /**
   * Record created flashcard AI settings for rollback
   * @param {Array} settings - Array of created flashcard AI settings objects
   */
  recordFlashcardAISettings(settings) {
    this.rollbackData.flashcardAISettings = settings.map(setting => ({
      _id: setting._id,
      userId: setting.userId
    }));
  }

  /**
   * Record created task plans for rollback
   * @param {Array} plans - Array of created task plan objects
   */
  recordTaskPlans(plans) {
    this.rollbackData.taskPlans = plans.map(plan => ({
      _id: plan._id,
      userId: plan.userId,
      title: plan.title
    }));
  }

  /**
   * Record created flow edges for rollback
   * @param {Array} edges - Array of created flow edge objects
   */
  recordFlowEdges(edges) {
    this.rollbackData.flowEdges = edges.map(edge => ({
      _id: edge._id,
      userId: edge.userId,
      planId: edge.planId
    }));
  }

  /**
   * Save rollback data to file
   */
  async saveRollbackData() {
    try {
      // Ensure directory exists
      const dataDir = path.dirname(this.rollbackFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.rollbackFile, JSON.stringify(this.rollbackData, null, 2));
      console.log(`Rollback data saved to ${this.rollbackFile}`);
    } catch (error) {
      console.error('Error saving rollback data:', error.message);
      throw error;
    }
  }

  /**
   * Load rollback data from file
   * @returns {Object|null} Rollback data or null if file doesn't exist
   */
  loadRollbackData() {
    try {
      if (!fs.existsSync(this.rollbackFile)) {
        console.log('No rollback data file found');
        return null;
      }

      const data = fs.readFileSync(this.rollbackFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading rollback data:', error.message);
      return null;
    }
  }

  /**
   * Perform complete rollback of migration
   * @returns {Promise<Object>} Rollback results
   */
  async rollback() {
    console.log('Starting migration rollback...');
    
    const rollbackData = this.loadRollbackData();
    if (!rollbackData) {
      throw new Error('No rollback data available');
    }

    const results = {
      users: { success: 0, failed: 0 },
      profiles: { success: 0, failed: 0 },
      books: { success: 0, failed: 0 },
      posts: { success: 0, failed: 0 },
      tags: { success: 0, failed: 0 },
      goals: { success: 0, failed: 0 },
      calendarEvents: { success: 0, failed: 0 },
      flashcardGroups: { success: 0, failed: 0 },
      flashcardAISettings: { success: 0, failed: 0 },
      taskPlans: { success: 0, failed: 0 },
      flowEdges: { success: 0, failed: 0 }
    };

    try {
      // Rollback in reverse order of creation to maintain referential integrity

      // 1. Rollback flow edges
      for (const edge of rollbackData.flowEdges || []) {
        try {
          await FlowEdge.deleteOne({ _id: edge._id });
          results.flowEdges.success++;
        } catch (error) {
          console.error(`Error deleting flow edge ${edge._id}:`, error.message);
          results.flowEdges.failed++;
        }
      }

      // 2. Rollback task plans
      for (const plan of rollbackData.taskPlans || []) {
        try {
          await TaskPlan.deleteOne({ _id: plan._id });
          results.taskPlans.success++;
        } catch (error) {
          console.error(`Error deleting task plan ${plan._id}:`, error.message);
          results.taskPlans.failed++;
        }
      }

      // 3. Rollback flashcard AI settings
      for (const setting of rollbackData.flashcardAISettings || []) {
        try {
          await FlashcardAISettings.deleteOne({ _id: setting._id });
          results.flashcardAISettings.success++;
        } catch (error) {
          console.error(`Error deleting flashcard AI settings ${setting._id}:`, error.message);
          results.flashcardAISettings.failed++;
        }
      }

      // 4. Rollback flashcard groups
      for (const group of rollbackData.flashcardGroups || []) {
        try {
          await FlashcardGroup.deleteOne({ _id: group._id });
          results.flashcardGroups.success++;
        } catch (error) {
          console.error(`Error deleting flashcard group ${group._id}:`, error.message);
          results.flashcardGroups.failed++;
        }
      }

      // 5. Rollback calendar events
      for (const event of rollbackData.calendarEvents || []) {
        try {
          await CalendarEvent.deleteOne({ _id: event._id });
          results.calendarEvents.success++;
        } catch (error) {
          console.error(`Error deleting calendar event ${event._id}:`, error.message);
          results.calendarEvents.failed++;
        }
      }

      // 6. Rollback goals
      for (const goal of rollbackData.goals || []) {
        try {
          await Goal.deleteOne({ _id: goal._id });
          results.goals.success++;
        } catch (error) {
          console.error(`Error deleting goal ${goal._id}:`, error.message);
          results.goals.failed++;
        }
      }

      // 7. Rollback tags
      for (const tag of rollbackData.tags || []) {
        try {
          await Tag.deleteOne({ _id: tag._id });
          results.tags.success++;
        } catch (error) {
          console.error(`Error deleting tag ${tag._id}:`, error.message);
          results.tags.failed++;
        }
      }

      // 8. Rollback posts
      for (const post of rollbackData.posts || []) {
        try {
          await Post.deleteOne({ _id: post._id });
          results.posts.success++;
        } catch (error) {
          console.error(`Error deleting post ${post._id}:`, error.message);
          results.posts.failed++;
        }
      }

      // 9. Rollback books
      for (const book of rollbackData.books || []) {
        try {
          await Book.deleteOne({ _id: book._id });
          results.books.success++;
        } catch (error) {
          console.error(`Error deleting book ${book._id}:`, error.message);
          results.books.failed++;
        }
      }

      // 10. Rollback profiles
      for (const user of rollbackData.users || []) {
        try {
          await Profile.deleteOne({ userId: user._id });
          results.profiles.success++;
        } catch (error) {
          console.error(`Error deleting profile for user ${user._id}:`, error.message);
          results.profiles.failed++;
        }
      }

      // 11. Rollback users
      for (const user of rollbackData.users || []) {
        try {
          await User.deleteOne({ _id: user._id });
          results.users.success++;
        } catch (error) {
          console.error(`Error deleting user ${user._id}:`, error.message);
          results.users.failed++;
        }
      }

      // Delete rollback file after successful rollback
      fs.unlinkSync(this.rollbackFile);
      console.log('Rollback completed successfully');

    } catch (error) {
      console.error('Error during rollback:', error.message);
      throw error;
    }

    return results;
  }

  /**
   * Get rollback summary
   * @returns {Object} Rollback summary
   */
  getRollbackSummary() {
    const summary = {
      timestamp: this.rollbackData.timestamp,
      totalItems: 0
    };

    for (const [key, value] of Object.entries(this.rollbackData)) {
      if (key !== 'timestamp' && Array.isArray(value)) {
        summary[key] = value.length;
        summary.totalItems += value.length;
      }
    }

    return summary;
  }

  /**
   * Clear rollback data
   */
  clearRollbackData() {
    this.rollbackData = {
      timestamp: null,
      users: [],
      profiles: [],
      books: [],
      posts: [],
      tags: [],
      goals: [],
      calendarEvents: [],
      flashcardGroups: [],
      flashcardAISettings: [],
      taskPlans: [],
      flowEdges: []
    };
  }
}

export default RollbackManager;