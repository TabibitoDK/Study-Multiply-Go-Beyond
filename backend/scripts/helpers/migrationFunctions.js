import mongoose from 'mongoose';
import Book from '../../src/models/Book.js';
import Post from '../../src/models/Post.js';
import Tag from '../../src/models/Tag.js';
import Goal from '../../src/models/Goal.js';
import CalendarEvent from '../../src/models/CalendarEvent.js';
import FlashcardGroup from '../../src/models/FlashcardGroup.js';
import FlashcardAISettings from '../../src/models/FlashcardAISettings.js';
import TaskPlan from '../../src/models/TaskPlan.js';
import FlowEdge from '../../src/models/FlowEdge.js';

/**
 * Migration functions for each data type
 */
export class MigrationFunctions {
  constructor() {
    this.bookMap = new Map(); // Maps old book IDs to new ObjectIds
    this.tagMap = new Map(); // Maps tag names to ObjectIds
    this.planMap = new Map(); // Maps plan IDs to ObjectIds
    this.migrationStats = {
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
  }

  /**
   * Migrate books data
   * @param {Array} booksData - Array of books data
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformBook - Function to transform book data
   * @returns {Promise<Map>} Map of old book IDs to new ObjectIds
   */
  async migrateBooks(booksData, userMap, transformBook) {
    console.log(`Migrating ${booksData.length} books...`);
    
    for (const bookData of booksData) {
      try {
        // Assign to a user if not already assigned
        if (!bookData.userId) {
          const userIds = Array.from(userMap.values());
          const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
          bookData.userId = randomUserId;
        }

        const transformedBook = transformBook(bookData, bookData.userId);
        const book = new Book(transformedBook);
        await book.save();

        // Store mapping
        this.bookMap.set(bookData.id.toString(), book._id.toString());
        this.migrationStats.books.success++;

        console.log(`Migrated book: ${bookData.title} (${book._id})`);

      } catch (error) {
        console.error(`Error migrating book ${bookData.title}:`, error.message);
        this.migrationStats.books.failed++;
      }
    }

    console.log(`Books migration completed: ${this.migrationStats.books.success} success, ${this.migrationStats.books.failed} failed`);
    return this.bookMap;
  }

  /**
   * Migrate posts data
   * @param {Array} postsData - Array of posts data
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformPost - Function to transform post data
   * @returns {Promise<void>}
   */
  async migratePosts(postsData, userMap, transformPost) {
    console.log(`Migrating ${postsData.length} posts...`);
    
    for (const postData of postsData) {
      try {
        const transformedPost = transformPost(postData);
        const post = new Post(transformedPost);
        await post.save();

        this.migrationStats.posts.success++;
        console.log(`Migrated post: ${postData.id} (${post._id})`);

      } catch (error) {
        console.error(`Error migrating post ${postData.id}:`, error.message);
        this.migrationStats.posts.failed++;
      }
    }

    console.log(`Posts migration completed: ${this.migrationStats.posts.success} success, ${this.migrationStats.posts.failed} failed`);
  }

  /**
   * Migrate tags data
   * @param {Array} tagsData - Array of tags data
   * @param {Function} transformTag - Function to transform tag data
   * @returns {Promise<Map>} Map of tag names to ObjectIds
   */
  async migrateTags(tagsData, transformTag) {
    console.log(`Migrating ${tagsData.length} tags...`);
    
    for (const tagName of tagsData) {
      try {
        // Check if tag already exists
        const existingTag = await Tag.findOne({ name: tagName });
        if (existingTag) {
          this.tagMap.set(tagName, existingTag._id.toString());
          console.log(`Tag already exists: ${tagName}`);
          continue;
        }

        const transformedTag = transformTag(tagName);
        const tag = new Tag(transformedTag);
        await tag.save();

        // Store mapping
        this.tagMap.set(tagName, tag._id.toString());
        this.migrationStats.tags.success++;

        console.log(`Migrated tag: ${tagName} (${tag._id})`);

      } catch (error) {
        console.error(`Error migrating tag ${tagName}:`, error.message);
        this.migrationStats.tags.failed++;
      }
    }

    console.log(`Tags migration completed: ${this.migrationStats.tags.success} success, ${this.migrationStats.tags.failed} failed`);
    return this.tagMap;
  }

  /**
   * Migrate goals data
   * @param {Array} goalsData - Array of goals data
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformGoal - Function to transform goal data
   * @returns {Promise<void>}
   */
  async migrateGoals(goalsData, userMap, transformGoal) {
    console.log(`Migrating ${goalsData.length} goals...`);
    
    for (const goalData of goalsData) {
      try {
        // Assign to a user
        const userIds = Array.from(userMap.values());
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        
        const transformedGoal = transformGoal(goalData, randomUserId);
        const goal = new Goal(transformedGoal);
        await goal.save();

        this.migrationStats.goals.success++;
        console.log(`Migrated goal: ${goalData.text} (${goal._id})`);

      } catch (error) {
        console.error(`Error migrating goal ${goalData.text}:`, error.message);
        this.migrationStats.goals.failed++;
      }
    }

    console.log(`Goals migration completed: ${this.migrationStats.goals.success} success, ${this.migrationStats.goals.failed} failed`);
  }

  /**
   * Migrate calendar events data
   * @param {Object} calendarData - Calendar events data by date
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformCalendarEvent - Function to transform calendar event data
   * @returns {Promise<void>}
   */
  async migrateCalendarEvents(calendarData, userMap, transformCalendarEvent) {
    console.log('Migrating calendar events...');
    
    let totalEvents = 0;
    for (const [date, events] of Object.entries(calendarData)) {
      for (const eventData of events) {
        try {
          // Assign to a user
          const userIds = Array.from(userMap.values());
          const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
          
          const transformedEvent = transformCalendarEvent(eventData, randomUserId, date);
          const calendarEvent = new CalendarEvent(transformedEvent);
          await calendarEvent.save();

          this.migrationStats.calendarEvents.success++;
          totalEvents++;

        } catch (error) {
          console.error(`Error migrating calendar event ${eventData.id}:`, error.message);
          this.migrationStats.calendarEvents.failed++;
        }
      }
    }

    console.log(`Calendar events migration completed: ${totalEvents} events migrated, ${this.migrationStats.calendarEvents.success} success, ${this.migrationStats.calendarEvents.failed} failed`);
  }

  /**
   * Migrate flashcard groups data
   * @param {Array} groupsData - Array of flashcard groups data
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformFlashcardGroup - Function to transform flashcard group data
   * @returns {Promise<void>}
   */
  async migrateFlashcardGroups(groupsData, userMap, transformFlashcardGroup) {
    console.log(`Migrating ${groupsData.length} flashcard groups...`);
    
    for (const groupData of groupsData) {
      try {
        // Assign to a user
        const userIds = Array.from(userMap.values());
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        
        const transformedGroup = transformFlashcardGroup(groupData, randomUserId);
        const flashcardGroup = new FlashcardGroup(transformedGroup);
        await flashcardGroup.save();

        this.migrationStats.flashcardGroups.success++;
        console.log(`Migrated flashcard group: ${groupData.name} (${flashcardGroup._id})`);

      } catch (error) {
        console.error(`Error migrating flashcard group ${groupData.name}:`, error.message);
        this.migrationStats.flashcardGroups.failed++;
      }
    }

    console.log(`Flashcard groups migration completed: ${this.migrationStats.flashcardGroups.success} success, ${this.migrationStats.flashcardGroups.failed} failed`);
  }

  /**
   * Migrate flashcard AI settings
   * @param {Object} settingsData - Flashcard AI settings data
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformFlashcardAISettings - Function to transform AI settings data
   * @returns {Promise<void>}
   */
  async migrateFlashcardAISettings(settingsData, userMap, transformFlashcardAISettings) {
    console.log('Migrating flashcard AI settings...');
    
    // Create settings for each user
    for (const [oldUserId, newUserId] of userMap) {
      try {
        const transformedSettings = transformFlashcardAISettings(settingsData, newUserId);
        const settings = new FlashcardAISettings(transformedSettings);
        await settings.save();

        this.migrationStats.flashcardAISettings.success++;
        console.log(`Migrated flashcard AI settings for user: ${newUserId}`);

      } catch (error) {
        console.error(`Error migrating flashcard AI settings for user ${newUserId}:`, error.message);
        this.migrationStats.flashcardAISettings.failed++;
      }
    }

    console.log(`Flashcard AI settings migration completed: ${this.migrationStats.flashcardAISettings.success} success, ${this.migrationStats.flashcardAISettings.failed} failed`);
  }

  /**
   * Migrate task plans
   * @param {Array} plansData - Array of task plans data
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Function} transformTaskPlan - Function to transform task plan data
   * @returns {Promise<Map>} Map of plan IDs to ObjectIds
   */
  async migrateTaskPlans(plansData, userMap, transformTaskPlan) {
    console.log(`Migrating ${plansData.length} task plans...`);
    
    for (const planData of plansData) {
      try {
        // Assign to a user
        const userIds = Array.from(userMap.values());
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        
        const transformedPlan = transformTaskPlan(planData, randomUserId);
        const taskPlan = new TaskPlan(transformedPlan);
        await taskPlan.save();

        // Store mapping
        this.planMap.set(planData.id || planData.title, taskPlan._id.toString());
        this.migrationStats.taskPlans.success++;

        console.log(`Migrated task plan: ${planData.title} (${taskPlan._id})`);

      } catch (error) {
        console.error(`Error migrating task plan ${planData.title}:`, error.message);
        this.migrationStats.taskPlans.failed++;
      }
    }

    console.log(`Task plans migration completed: ${this.migrationStats.taskPlans.success} success, ${this.migrationStats.taskPlans.failed} failed`);
    return this.planMap;
  }

  /**
   * Migrate flow edges
   * @param {Object} flowEdgesData - Flow edges data by plan
   * @param {Map} userMap - Map of user IDs to ObjectIds
   * @param {Map} planMap - Map of plan IDs to ObjectIds
   * @param {Function} transformFlowEdge - Function to transform flow edge data
   * @returns {Promise<void>}
   */
  async migrateFlowEdges(flowEdgesData, userMap, planMap, transformFlowEdge) {
    console.log('Migrating flow edges...');
    
    let totalEdges = 0;
    for (const [planKey, edgeData] of Object.entries(flowEdgesData)) {
      try {
        // Extract plan ID from key
        const planId = planKey.replace('flow-view:', '').replace(':edges', '');
        const newPlanId = planMap.get(planId);
        
        if (!newPlanId) {
          console.warn(`Plan mapping not found for: ${planId}`);
          continue;
        }

        // Assign to a user
        const userIds = Array.from(userMap.values());
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        
        const transformedEdge = transformFlowEdge(edgeData, randomUserId, newPlanId);
        const flowEdge = new FlowEdge(transformedEdge);
        await flowEdge.save();

        this.migrationStats.flowEdges.success++;
        totalEdges++;

      } catch (error) {
        console.error(`Error migrating flow edges for ${planKey}:`, error.message);
        this.migrationStats.flowEdges.failed++;
      }
    }

    console.log(`Flow edges migration completed: ${totalEdges} edge sets migrated, ${this.migrationStats.flowEdges.success} success, ${this.migrationStats.flowEdges.failed} failed`);
  }

  /**
   * Get migration statistics
   * @returns {Object} Migration statistics
   */
  getMigrationStats() {
    return this.migrationStats;
  }

  /**
   * Get mapping objects
   * @returns {Object} All mapping objects
   */
  getMappings() {
    return {
      bookMap: this.bookMap,
      tagMap: this.tagMap,
      planMap: this.planMap
    };
  }

  /**
   * Reset migration statistics
   */
  resetStats() {
    this.migrationStats = {
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
  }
}

export default MigrationFunctions;