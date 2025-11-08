#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const scriptDirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(scriptDirname, '../.env') });

// Import helper classes
import DataExtractor from './helpers/dataExtractor.js';
import DataTransformer from './utils/dataTransformer.js';
import UserManager from './helpers/userManager.js';
import MigrationFunctions from './helpers/migrationFunctions.js';
import RollbackManager from './utils/rollbackManager.js';
import Tag from '../src/models/Tag.js';

// Import database config
import connectDB from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main migration script
 */
class DataMigration {
  constructor() {
    this.extractor = new DataExtractor();
    this.transformer = new DataTransformer();
    this.userManager = new UserManager();
    this.migrator = new MigrationFunctions();
    this.rollbackManager = new RollbackManager();
    
    this.migrationStartTime = null;
    this.migrationResults = {
      success: false,
      startTime: null,
      endTime: null,
      duration: null,
      stats: {},
      errors: []
    };
  }

  /**
   * Initialize migration
   */
  async initialize() {
    console.log('='.repeat(60));
    console.log('DATA MIGRATION STARTED');
    console.log('='.repeat(60));
    
    this.migrationStartTime = new Date();
    this.migrationResults.startTime = this.migrationStartTime.toISOString();
    
    // Initialize rollback
    this.rollbackManager.initializeRollback();
    
    try {
      // Connect to database
      await connectDB();
      console.log('? Database connected successfully');
    } catch (error) {
      console.error('? Failed to connect to database:', error.message);
      throw error;
    }
  }

  /**
   * Extract all data from frontend sources
   */
  async extractData() {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 1: EXTRACTING DATA');
    console.log('-'.repeat(40));
    
    try {
      const data = this.extractor.extractAllData();
      console.log('? Data extraction completed');
      return data;
    } catch (error) {
      console.error('? Data extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Create users from profile data
   */
  async createUsers(profiles) {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 2: CREATING USERS');
    console.log('-'.repeat(40));
    
    try {
      // Create default admin user
      await this.userManager.createDefaultAdmin();
      
      // Create users from profiles
      const userMap = await this.userManager.createUsersFromProfiles(profiles);
      
      // Record users for rollback
      this.rollbackManager.recordUsers(this.userManager.getCreatedUsers());
      
      console.log('? User creation completed');
      console.log(`  Created ${this.userManager.getCreatedUsers().length} users`);
      
      return userMap;
    } catch (error) {
      console.error('? User creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate tags first (as they're referenced by other entities)
   */
  async migrateTags(tagsData) {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 3: MIGRATING TAGS');
    console.log('-'.repeat(40));
    
    try {
      const tagMap = await this.migrator.migrateTags(
        tagsData,
        (tagName) => this.transformer.transformTag(tagName)
      );
      
      this.transformer.setTagMap(tagMap);
      
      // Get created tags for rollback
      const createdTags = await Tag.find({ name: { $in: tagsData } });
      this.rollbackManager.recordTags(createdTags.map(tag => tag.toObject()));
      
      console.log('? Tags migration completed');
      return tagMap;
    } catch (error) {
      console.error('? Tags migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate books
   */
  async migrateBooks(booksData, userMap) {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 4: MIGRATING BOOKS');
    console.log('-'.repeat(40));
    
    try {
      this.transformer.setUserMap(userMap);
      const bookMap = await this.migrator.migrateBooks(
        booksData,
        userMap,
        (book, userId) => this.transformer.transformBook(book, userId)
      );
      
      this.transformer.setBookMap(bookMap);
      
      // Get created books for rollback
      const createdBooks = await Book.find({ userId: { $in: Array.from(userMap.values()) } });
      this.rollbackManager.recordBooks(createdBooks.map(book => book.toObject()));
      
      console.log('? Books migration completed');
      return bookMap;
    } catch (error) {
      console.error('? Books migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate posts
   */
  async migratePosts(postsData) {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 5: MIGRATING POSTS');
    console.log('-'.repeat(40));
    
    try {
      await this.migrator.migratePosts(
        postsData,
        this.transformer.getUserMap(),
        (post) => this.transformer.transformPost(post)
      );
      
      // Get created posts for rollback
      const createdPosts = await Post.find({ userId: { $in: Array.from(this.transformer.getUserMap().values()) } });
      this.rollbackManager.recordPosts(createdPosts.map(post => post.toObject()));
      
      console.log('? Posts migration completed');
    } catch (error) {
      console.error('? Posts migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate localStorage data
   */
  async migrateLocalStorageData(localStorageData, userMap) {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 6: MIGRATING LOCALSTORAGE DATA');
    console.log('-'.repeat(40));
    
    try {
      // Migrate goals
      if (localStorageData['smgb-user-goals-v1']) {
        await this.migrator.migrateGoals(
          localStorageData['smgb-user-goals-v1'],
          userMap,
          (goal, userId) => this.transformer.transformGoal(goal, userId)
        );
        
        // Get created goals for rollback
        const createdGoals = await mongoose.connection.db
          .collection('goals')
          .find({ userId: { $in: Array.from(userMap.values()) } })
          .toArray();
        this.rollbackManager.recordGoals(createdGoals);
      }

      // Migrate calendar events
      if (localStorageData['smgb-calendar-events-v1']) {
        await this.migrator.migrateCalendarEvents(
          localStorageData['smgb-calendar-events-v1'],
          userMap,
          (event, userId, date) => this.transformer.transformCalendarEvent(event, userId, date)
        );
        
        // Get created calendar events for rollback
        const createdEvents = await mongoose.connection.db
          .collection('calendarevents')
          .find({ userId: { $in: Array.from(userMap.values()) } })
          .toArray();
        this.rollbackManager.recordCalendarEvents(createdEvents);
      }

      // Migrate flashcard groups
      if (localStorageData['flashcard_groups_v6_data']) {
        await this.migrator.migrateFlashcardGroups(
          localStorageData['flashcard_groups_v6_data'],
          userMap,
          (group, userId) => this.transformer.transformFlashcardGroup(group, userId)
        );
        
        // Get created flashcard groups for rollback
        const createdGroups = await mongoose.connection.db
          .collection('flashcardgroups')
          .find({ userId: { $in: Array.from(userMap.values()) } })
          .toArray();
        this.rollbackManager.recordFlashcardGroups(createdGroups);
      }

      // Migrate flashcard AI settings
      if (localStorageData['flashcard_ai_settings_v1']) {
        await this.migrator.migrateFlashcardAISettings(
          localStorageData['flashcard_ai_settings_v1'],
          userMap,
          (settings, userId) => this.transformer.transformFlashcardAISettings(settings, userId)
        );
        
        // Get created flashcard AI settings for rollback
        const createdSettings = await mongoose.connection.db
          .collection('flashcardaisettings')
          .find({ userId: { $in: Array.from(userMap.values()) } })
          .toArray();
        this.rollbackManager.recordFlashcardAISettings(createdSettings);
      }

      console.log('? LocalStorage data migration completed');
    } catch (error) {
      console.error('? LocalStorage data migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate sessionStorage data
   */
  async migrateSessionStorageData(sessionStorageData, userMap) {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 7: MIGRATING SESSIONSTORAGE DATA');
    console.log('-'.repeat(40));
    
    try {
      // Create sample task plans for flow edges
      const samplePlans = [
        {
          id: 'plan-1',
          title: 'Study Plan for Mathematics',
          description: 'Complete mathematics course',
          tasks: [
            {
              id: 'task-1',
              title: 'Complete Chapter 1',
              status: 'completed'
            },
            {
              id: 'task-2',
              title: 'Complete Chapter 2',
              status: 'in-progress'
            }
          ]
        }
      ];

      // Migrate task plans
      await this.migrator.migrateTaskPlans(
        samplePlans,
        userMap,
        (plan, userId) => this.transformer.transformTaskPlan(plan, userId)
      );

      // Get created task plans for rollback
      const createdPlans = await mongoose.connection.db
        .collection('taskplans')
        .find({ userId: { $in: Array.from(userMap.values()) } })
        .toArray();
      this.rollbackManager.recordTaskPlans(createdPlans);

      // Migrate flow edges
      const planMap = this.migrator.getMappings().planMap;
      await this.migrator.migrateFlowEdges(
        sessionStorageData,
        userMap,
        planMap,
        (edge, userId, planId) => this.transformer.transformFlowEdge(edge, userId, planId)
      );

      // Get created flow edges for rollback
      const createdEdges = await mongoose.connection.db
        .collection('flowedges')
        .find({ userId: { $in: Array.from(userMap.values()) } })
        .toArray();
      this.rollbackManager.recordFlowEdges(createdEdges);

      console.log('? SessionStorage data migration completed');
    } catch (error) {
      console.error('? SessionStorage data migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Complete migration
   */
  async completeMigration() {
    console.log('\n' + '-'.repeat(40));
    console.log('STEP 8: COMPLETING MIGRATION');
    console.log('-'.repeat(40));
    
    try {
      // Save rollback data
      await this.rollbackManager.saveRollbackData();
      
      // Get migration statistics
      const stats = this.migrator.getMigrationStats();
      const userStats = this.userManager.getUserStats();
      const rollbackSummary = this.rollbackManager.getRollbackSummary();
      
      this.migrationResults.stats = {
        migration: stats,
        users: userStats,
        rollback: rollbackSummary
      };
      
      const endTime = new Date();
      this.migrationResults.endTime = endTime.toISOString();
      this.migrationResults.duration = endTime - this.migrationStartTime;
      this.migrationResults.success = true;
      
      console.log('? Migration completed successfully');
      this.printMigrationSummary();
      
    } catch (error) {
      console.error('? Migration completion failed:', error.message);
      throw error;
    }
  }

  /**
   * Print migration summary
   */
  printMigrationSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Duration: ${this.migrationResults.duration}ms`);
    console.log(`Start Time: ${this.migrationResults.startTime}`);
    console.log(`End Time: ${this.migrationResults.endTime}`);
    
    console.log('\nMigration Statistics:');
    const stats = this.migrationResults.stats.migration;
    for (const [type, result] of Object.entries(stats)) {
      console.log(`  ${type}: ${result.success} success, ${result.failed} failed`);
    }
    
    console.log('\nUser Statistics:');
    const userStats = this.migrationResults.stats.users;
    console.log(`  Total Users: ${userStats.totalUsers}`);
    console.log(`  User Mappings: ${userStats.userMappings}`);
    console.log(`  Usernames: ${userStats.usernames.join(', ')}`);
    
    console.log('\nRollback Information:');
    const rollback = this.migrationResults.stats.rollback;
    console.log(`  Timestamp: ${rollback.timestamp}`);
    console.log(`  Total Items: ${rollback.totalItems}`);
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Handle migration errors
   */
  async handleError(error) {
    console.error('\n' + '?'.repeat(20));
    console.error('MIGRATION FAILED');
    console.error('?'.repeat(20));
    console.error('Error:', error.message);
    
    this.migrationResults.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Attempt rollback
    try {
      console.log('\nAttempting rollback...');
      await this.rollbackManager.rollback();
      console.log('? Rollback completed');
    } catch (rollbackError) {
      console.error('? Rollback failed:', rollbackError.message);
    }
    
    throw error;
  }

  /**
   * Run the complete migration process
   */
  async run() {
    try {
      await this.initialize();
      
      // Extract data
      const data = await this.extractData();
      
      // Create users
      const userMap = await this.createUsers(data.jsonFiles.profiles);
      
      // Migrate in dependency order
      await this.migrateTags(data.jsonFiles.tags);
      await this.migrateBooks(data.jsonFiles.books, userMap);
      await this.migratePosts(data.jsonFiles.posts);
      await this.migrateLocalStorageData(data.localStorage, userMap);
      await this.migrateSessionStorageData(data.sessionStorage, userMap);
      
      await this.completeMigration();
      
    } catch (error) {
      await this.handleError(error);
    } finally {
      // Close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('\n? Database connection closed');
      }
    }
  }
}

/**
 * Rollback function for standalone use
 */
async function rollbackMigration() {
  console.log('='.repeat(60));
  console.log('ROLLING BACK MIGRATION');
  console.log('='.repeat(60));
  
  try {
    await connectDB();
    
    const rollbackManager = new RollbackManager();
    const results = await rollbackManager.rollback();
    
    console.log('\nRollback Results:');
    for (const [type, result] of Object.entries(results)) {
      console.log(`  ${type}: ${result.success} success, ${result.failed} failed`);
    }
    
    console.log('\n? Rollback completed successfully');
    
  } catch (error) {
    console.error('? Rollback failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigration().catch(console.error);
} else {
  const migration = new DataMigration();
  migration.run().catch(console.error);
}