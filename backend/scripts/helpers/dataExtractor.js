import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract data from JSON files in the frontend data directory
 */
export class DataExtractor {
  constructor() {
    this.frontendDataPath = path.join(__dirname, '../../../frontend/src/data');
  }

  /**
   * Read and parse JSON file
   * @param {string} filename - Name of the JSON file
   * @returns {Array|Object} Parsed JSON data
   */
  readJsonFile(filename) {
    try {
      const filePath = path.join(this.frontendDataPath, filename);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return null;
      }
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error reading file ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Extract books data from books.json
   * @returns {Array} Array of books
   */
  extractBooks() {
    console.log('Extracting books data...');
    const books = this.readJsonFile('books.json');
    if (!books) {
      console.error('Failed to extract books data');
      return [];
    }
    console.log(`Extracted ${books.length} books`);
    return books;
  }

  /**
   * Extract posts data from posts.json
   * @returns {Array} Array of posts
   */
  extractPosts() {
    console.log('Extracting posts data...');
    const posts = this.readJsonFile('posts.json');
    if (!posts) {
      console.error('Failed to extract posts data');
      return [];
    }
    console.log(`Extracted ${posts.length} posts`);
    return posts;
  }

  /**
   * Extract profiles data from profiles.json
   * @returns {Array} Array of profiles
   */
  extractProfiles() {
    console.log('Extracting profiles data...');
    const profiles = this.readJsonFile('profiles.json');
    if (!profiles) {
      console.error('Failed to extract profiles data');
      return [];
    }
    console.log(`Extracted ${profiles.length} profiles`);
    return profiles;
  }

  /**
   * Extract tags data from tags.json
   * @returns {Array} Array of tags
   */
  extractTags() {
    console.log('Extracting tags data...');
    const tags = this.readJsonFile('tags.json');
    if (!tags) {
      console.error('Failed to extract tags data');
      return [];
    }
    console.log(`Extracted ${tags.length} tags`);
    return tags;
  }

  /**
   * Simulate extraction of localStorage data
   * In a real scenario, this would read from browser localStorage
   * For migration purposes, we'll create sample data
   * @returns {Object} localStorage data
   */
  extractLocalStorageData() {
    console.log('Extracting localStorage data (simulated)...');
    
    // Sample localStorage data structure
    const localStorageData = {
      'study-app-books-v2-json': [
        {
          id: 'local-1',
          title: 'Local Book 1',
          author: 'Local Author',
          year: 2023,
          status: 'reading',
          tags: ['local', 'sample']
        },
        {
          id: 'local-2',
          title: 'Local Book 2',
          author: 'Another Author',
          year: 2022,
          status: 'completed',
          tags: ['local', 'completed']
        }
      ],
      'smgb-user-goals-v1': [
        {
          id: 'goal-1',
          text: 'Complete mathematics course',
          category: 'academic',
          priority: 'high',
          targetDate: '2024-12-31',
          status: 'active'
        },
        {
          id: 'goal-2',
          text: 'Read 20 books this year',
          category: 'personal',
          priority: 'medium',
          targetDate: '2024-12-31',
          status: 'active'
        }
      ],
      'smgb-calendar-events-v1': {
        '2024-01-15': [
          {
            id: 'event-1',
            title: 'Math Study Session',
            startTime: '09:00',
            endTime: '11:00',
            category: 'study',
            priority: 'high'
          }
        ]
      },
      'flashcard_groups_v6_data': [
        {
          id: 'group-1',
          name: 'Mathematics Flashcards',
          description: 'Basic math concepts',
          cards: [
            {
              id: 1,
              question: 'What is 2+2?',
              answer: '4',
              category: 'basic'
            }
          ]
        }
      ],
      'flashcard_ai_settings_v1': {
        language: 'en',
        preferences: {
          defaultCardCount: 10,
          difficulty: 'intermediate',
          includeImages: false
        }
      }
    };

    console.log('Extracted localStorage data structure');
    return localStorageData;
  }

  /**
   * Simulate extraction of sessionStorage data
   * In a real scenario, this would read from browser sessionStorage
   * @returns {Object} sessionStorage data
   */
  extractSessionStorageData() {
    console.log('Extracting sessionStorage data (simulated)...');
    
    const sessionStorageData = {
      'immerse-mode-state': {
        isActive: false,
        startTime: null,
        settings: {
          focusMode: true,
          notifications: false
        }
      },
      'flow-view:plan-1:edges': [
        {
          id: 'edge-1',
          source: 'task-1',
          target: 'task-2',
          type: 'dependency'
        }
      ]
    };

    console.log('Extracted sessionStorage data structure');
    return sessionStorageData;
  }

  /**
   * Extract all data from various sources
   * @returns {Object} All extracted data
   */
  extractAllData() {
    console.log('Starting data extraction from all sources...');
    
    const data = {
      jsonFiles: {
        books: this.extractBooks(),
        posts: this.extractPosts(),
        profiles: this.extractProfiles(),
        tags: this.extractTags()
      },
      localStorage: this.extractLocalStorageData(),
      sessionStorage: this.extractSessionStorageData()
    };

    console.log('Data extraction completed');
    return data;
  }
}

export default DataExtractor;