import mongoose from 'mongoose';

/**
 * Transform frontend data to match MongoDB schema
 */
export class DataTransformer {
  constructor() {
    this.userMap = new Map(); // Maps old user IDs to new MongoDB ObjectIds
    this.bookMap = new Map(); // Maps old book IDs to new MongoDB ObjectIds
    this.tagMap = new Map(); // Maps tag names to MongoDB ObjectIds
  }

  /**
   * Set the user mapping for transformations
   * @param {Map} userMap - Map of old user IDs to new ObjectIds
   */
  setUserMap(userMap) {
    this.userMap = userMap;
  }

  /**
   * Set the book mapping for transformations
   * @param {Map} bookMap - Map of old book IDs to new ObjectIds
   */
  setBookMap(bookMap) {
    this.bookMap = bookMap;
  }

  /**
   * Set the tag mapping for transformations
   * @param {Map} tagMap - Map of tag names to ObjectIds
   */
  setTagMap(tagMap) {
    this.tagMap = tagMap;
  }

  /**
   * Transform profile data to User schema
   * @param {Object} profile - Profile data from frontend
   * @returns {Object} Transformed user data
   */
  transformProfileToUser(profile) {
    return {
      username: profile.username,
      email: `${profile.username.toLowerCase()}@example.com`, // Generate email from username
      passwordHash: '$2b$10$placeholder.hash.for.migration', // Placeholder hash
      preferences: {
        language: 'ja', // Default to Japanese based on profile data
        theme: 'light',
        timezone: 'Asia/Tokyo'
      },
      isActive: true
    };
  }

  /**
   * Transform profile data to Profile schema
   * @param {Object} profile - Profile data from frontend
   * @param {string} userId - MongoDB ObjectId for the user
   * @returns {Object} Transformed profile data
   */
  transformProfile(profile, userId) {
    return {
      userId: new mongoose.Types.ObjectId(userId),
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      profileImage: profile.profileImage,
      backgroundImage: profile.backgroundImage,
      location: profile.location,
      joined: profile.joined ? new Date(profile.joined) : new Date(),
      followers: [], // Will be populated later if needed
      following: [], // Will be populated later if needed
      posts: profile.posts || 0,
      tags: profile.tags || [],
      stats: {
        booksRead: 0,
        studyStreak: 0,
        totalStudyHours: 0
      },
      privacy: {
        showEmail: false,
        showLocation: true,
        allowFollowers: true
      }
    };
  }

  /**
   * Transform book data to Book schema
   * @param {Object} book - Book data from frontend
   * @param {string} userId - MongoDB ObjectId for the user
   * @returns {Object} Transformed book data
   */
  transformBook(book, userId) {
    return {
      userId: new mongoose.Types.ObjectId(userId),
      title: book.title,
      author: book.author,
      year: book.year,
      cover: book.cover,
      description: book.description,
      tags: book.tags || [],
      rating: book.rating || null,
      status: book.status || 'want-to-read',
      visibility: book.visibility || 'private',
      pages: book.pages,
      publisher: book.publisher,
      // language: book.language, // Temporarily commented out
      progress: 0,
      favorite: false
    };
  }

  /**
   * Transform post data to Post schema
   * @param {Object} post - Post data from frontend
   * @returns {Object} Transformed post data
   */
  transformPost(post) {
    const userId = this.userMap.get(post.userId.toString());
    if (!userId) {
      throw new Error(`User mapping not found for post userId: ${post.userId}`);
    }

    // Transform book references
    const books = (post.books || []).map(bookId => {
      const bookObjectId = this.bookMap.get(bookId.toString());
      if (!bookObjectId) {
        console.warn(`Book mapping not found for bookId: ${bookId}`);
        return null;
      }
      return new mongoose.Types.ObjectId(bookObjectId);
    }).filter(Boolean);

    return {
      userId: new mongoose.Types.ObjectId(userId),
      content: post.content,
      books: books,
      likes: post.likes || 0,
      comments: [], // Comments will be migrated separately if needed
      tags: post.tags || [],
      visibility: 'public',
      isEdited: false,
      createdAt: post.timestamp ? new Date(post.timestamp) : new Date()
    };
  }

  /**
   * Transform tag data to Tag schema
   * @param {string} tagName - Tag name
   * @param {string} category - Tag category
   * @returns {Object} Transformed tag data
   */
  transformTag(tagName, category = 'general') {
    return {
      name: tagName,
      category: category,
      description: `Tag for ${tagName}`,
      color: this.generateTagColor(tagName),
      usageCount: 0,
      isSystem: false
    };
  }

  /**
   * Transform goal data to Goal schema
   * @param {Object} goal - Goal data from localStorage
   * @param {string} userId - MongoDB ObjectId for the user
   * @returns {Object} Transformed goal data
   */
  transformGoal(goal, userId) {
    return {
      userId: new mongoose.Types.ObjectId(userId),
      text: goal.text,
      isPublic: goal.isPublic || false,
      category: goal.category || 'personal',
      priority: goal.priority || 'medium',
      targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
      status: goal.status || 'active',
      progress: goal.progress || 0
    };
  }

  /**
   * Transform calendar event data to CalendarEvent schema
   * @param {Object} eventData - Calendar event data from localStorage
   * @param {string} userId - MongoDB ObjectId for the user
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Transformed calendar event data
   */
  transformCalendarEvent(eventData, userId, date) {
    return {
      userId: new mongoose.Types.ObjectId(userId),
      date: date,
      events: [{
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || '',
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        category: eventData.category || 'study',
        priority: eventData.priority || 'medium',
        completed: eventData.completed || false,
        relatedBookId: eventData.relatedBookId ? new mongoose.Types.ObjectId(eventData.relatedBookId) : null,
        relatedTaskId: eventData.relatedTaskId || null,
        color: eventData.color || '#007bff',
        reminder: {
          enabled: eventData.reminder?.enabled || false,
          minutesBefore: eventData.reminder?.minutesBefore || 15
        },
        createdAt: new Date()
      }]
    };
  }

  /**
   * Transform flashcard group data to FlashcardGroup schema
   * @param {Object} groupData - Flashcard group data from localStorage
   * @param {string} userId - MongoDB ObjectId for the user
   * @returns {Object} Transformed flashcard group data
   */
  transformFlashcardGroup(groupData, userId) {
    const cards = (groupData.cards || []).map(card => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      category: card.category || '',
      easyCount: card.easyCount || 0,
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : null,
      nextReview: card.nextReview ? new Date(card.nextReview) : null,
      difficulty: card.difficulty !== undefined ? card.difficulty : 1,
      reviewCount: card.reviewCount || 0,
      correctCount: card.correctCount || 0
    }));

    return {
      userId: new mongoose.Types.ObjectId(userId),
      name: groupData.name,
      description: groupData.description || '',
      cards: cards,
      nextCardId: (groupData.cards?.length || 0) + 1,
      isPublic: groupData.isPublic || false,
      category: groupData.category || '',
      tags: groupData.tags || [],
      stats: {
        totalCards: cards.length,
        masteredCards: 0,
        reviewingCards: 0,
        newCards: cards.length
      },
      lastStudiedAt: null
    };
  }

  /**
   * Transform flashcard AI settings to FlashcardAISettings schema
   * @param {Object} settingsData - AI settings data from localStorage
   * @param {string} userId - MongoDB ObjectId for the user
   * @returns {Object} Transformed flashcard AI settings data
   */
  transformFlashcardAISettings(settingsData, userId) {
    return {
      userId: new mongoose.Types.ObjectId(userId),
      language: settingsData.language || 'en',
      apiKey: settingsData.apiKey || '',
      preferences: {
        defaultCardCount: settingsData.preferences?.defaultCardCount || 10,
        difficulty: settingsData.preferences?.difficulty || 'intermediate',
        includeImages: settingsData.preferences?.includeImages || false,
        autoTranslate: settingsData.preferences?.autoTranslate || false
      },
      usageStats: {
        totalCardsGenerated: 0,
        lastUsed: null,
        monthlyUsage: []
      }
    };
  }

  /**
   * Transform task plan data to TaskPlan schema
   * @param {Object} planData - Task plan data from context
   * @param {string} userId - MongoDB ObjectId for the user
   * @returns {Object} Transformed task plan data
   */
  transformTaskPlan(planData, userId) {
    const tasks = (planData.tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'not-started',
      priority: task.priority || 'medium',
      startAt: task.startAt ? new Date(task.startAt) : null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours || 0,
      tags: task.tags || [],
      dependencies: task.dependencies || [],
      relatedBookId: task.relatedBookId ? new mongoose.Types.ObjectId(task.relatedBookId) : null,
      subtasks: (task.subtasks || []).map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        completed: subtask.completed || false,
        completedAt: subtask.completedAt ? new Date(subtask.completedAt) : null
      }))
    }));

    return {
      userId: new mongoose.Types.ObjectId(userId),
      title: planData.title,
      description: planData.description || '',
      status: planData.status || 'not-started',
      tasks: tasks,
      dueDate: planData.dueDate ? new Date(planData.dueDate) : null,
      category: planData.category || 'academic',
      tags: planData.tags || [],
      isPublic: planData.isPublic || false,
      collaborators: [],
      completedAt: planData.completedAt ? new Date(planData.completedAt) : null
    };
  }

  /**
   * Transform flow edge data to FlowEdge schema
   * @param {Object} edgeData - Flow edge data from sessionStorage
   * @param {string} userId - MongoDB ObjectId for the user
   * @param {string} planId - MongoDB ObjectId for the task plan
   * @returns {Object} Transformed flow edge data
   */
  transformFlowEdge(edgeData, userId, planId) {
    const edges = (edgeData.edges || []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'dependency',
      style: {
        type: edge.style?.type || 'straight',
        animated: edge.style?.animated || false,
        color: edge.style?.color || '#000000',
        width: edge.style?.width || 2
      },
      label: edge.label || ''
    }));

    return {
      userId: new mongoose.Types.ObjectId(userId),
      planId: new mongoose.Types.ObjectId(planId),
      edges: edges
    };
  }

  /**
   * Generate a consistent color for tags based on their name
   * @param {string} tagName - Name of the tag
   * @returns {string} Hex color code
   */
  generateTagColor(tagName) {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
      '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
    ];
    
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
}

export default DataTransformer;