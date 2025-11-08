# Study-Multiply-Go-Beyond API Documentation

This document provides a comprehensive overview of all API endpoints implemented for the Study-Multiply-Go-Beyond application.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All API endpoints (except for public data) require authentication. Include the user ID in the `x-user-id` header:

```
x-user-id: <user_id>
```

## Response Format

All responses follow this format:

### Success Response

```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Paginated Response

```json
{
  "items": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## API Endpoints

### Users Collection

| Method | Endpoint                  | Description                   | Authentication |
| ------ | ------------------------- | ----------------------------- | -------------- |
| GET    | `/api/users`              | Get all users (admin only)    | Required       |
| GET    | `/api/users/:id`          | Get user by ID                | Required       |
| POST   | `/api/users`              | Create new user (register)    | None           |
| PUT    | `/api/users/:id`          | Update user                   | Required       |
| DELETE | `/api/users/:id`          | Deactivate user (soft delete) | Required       |
| POST   | `/api/users/login`        | User login                    | None           |
| PUT    | `/api/users/:id/password` | Change password               | Required       |

### Books Collection

| Method | Endpoint                  | Description                          | Authentication |
| ------ | ------------------------- | ------------------------------------ | -------------- |
| GET    | `/api/books`              | Get all books for authenticated user | Required       |
| GET    | `/api/books/public`       | Get public books from all users      | None           |
| GET    | `/api/books/:id`          | Get book by ID                       | Required       |
| POST   | `/api/books`              | Create new book                      | Required       |
| PUT    | `/api/books/:id`          | Update book                          | Required       |
| DELETE | `/api/books/:id`          | Delete book                          | Required       |
| POST   | `/api/books/:id/favorite` | Toggle favorite status               | Required       |
| PUT    | `/api/books/:id/progress` | Update reading progress              | Required       |
| GET    | `/api/books/stats/user`   | Get user's book statistics           | Required       |

### Posts Collection

| Method | Endpoint                             | Description                          | Authentication |
| ------ | ------------------------------------ | ------------------------------------ | -------------- |
| GET    | `/api/posts`                         | Get all posts for authenticated user | Required       |
| GET    | `/api/posts/public`                  | Get public posts from all users      | None           |
| GET    | `/api/posts/:id`                     | Get post by ID                       | Required       |
| POST   | `/api/posts`                         | Create new post                      | Required       |
| PUT    | `/api/posts/:id`                     | Update post                          | Required       |
| DELETE | `/api/posts/:id`                     | Delete post                          | Required       |
| POST   | `/api/posts/:id/like`                | Like a post                          | Required       |
| POST   | `/api/posts/:id/comments`            | Add comment to post                  | Required       |
| DELETE | `/api/posts/:id/comments/:commentId` | Delete comment from post             | Required       |
| GET    | `/api/posts/stats/user`              | Get user's post statistics           | Required       |

### Profiles Collection

| Method | Endpoint                      | Description                        | Authentication |
| ------ | ----------------------------- | ---------------------------------- | -------------- |
| GET    | `/api/profiles`               | Get all public profiles            | None           |
| GET    | `/api/profiles/user/:userId`  | Get profile by user ID             | Required       |
| GET    | `/api/profiles/me`            | Get current user's profile         | Required       |
| POST   | `/api/profiles`               | Create new profile                 | Required       |
| PUT    | `/api/profiles/:id`           | Update profile                     | Required       |
| DELETE | `/api/profiles/:id`           | Delete profile                     | Required       |
| POST   | `/api/profiles/:id/follow`    | Follow a user                      | Required       |
| DELETE | `/api/profiles/:id/follow`    | Unfollow a user                    | Required       |
| GET    | `/api/profiles/:id/followers` | Get followers of a user            | Required       |
| GET    | `/api/profiles/:id/following` | Get users that a user is following | Required       |

### Goals Collection

| Method | Endpoint                  | Description                          | Authentication |
| ------ | ------------------------- | ------------------------------------ | -------------- |
| GET    | `/api/goals`              | Get all goals for authenticated user | Required       |
| GET    | `/api/goals/public`       | Get public goals from all users      | None           |
| GET    | `/api/goals/:id`          | Get goal by ID                       | Required       |
| POST   | `/api/goals`              | Create new goal                      | Required       |
| PUT    | `/api/goals/:id`          | Update goal                          | Required       |
| DELETE | `/api/goals/:id`          | Delete goal                          | Required       |
| PUT    | `/api/goals/:id/progress` | Update goal progress                 | Required       |
| POST   | `/api/goals/:id/complete` | Mark goal as completed               | Required       |
| GET    | `/api/goals/stats/user`   | Get user's goal statistics           | Required       |

### Calendar Events Collection

| Method | Endpoint                                         | Description                                    | Authentication |
| ------ | ------------------------------------------------ | ---------------------------------------------- | -------------- |
| GET    | `/api/calendar-events`                           | Get all calendar events for authenticated user | Required       |
| GET    | `/api/calendar-events/date/:date`                | Get events for a specific date                 | Required       |
| GET    | `/api/calendar-events/:id`                       | Get calendar event document by ID              | Required       |
| POST   | `/api/calendar-events`                           | Create new calendar event document             | Required       |
| PUT    | `/api/calendar-events/:id`                       | Update calendar event document                 | Required       |
| DELETE | `/api/calendar-events/:id`                       | Delete calendar event document                 | Required       |
| PUT    | `/api/calendar-events/date/:date/event/:eventId` | Update specific event                          | Required       |
| DELETE | `/api/calendar-events/date/:date/event/:eventId` | Delete specific event                          | Required       |
| GET    | `/api/calendar-events/stats/user`                | Get user's calendar statistics                 | Required       |

### Flashcard Groups Collection

| Method | Endpoint                                  | Description                                     | Authentication |
| ------ | ----------------------------------------- | ----------------------------------------------- | -------------- |
| GET    | `/api/flashcard-groups`                   | Get all flashcard groups for authenticated user | Required       |
| GET    | `/api/flashcard-groups/public`            | Get public flashcard groups from all users      | None           |
| GET    | `/api/flashcard-groups/:id`               | Get flashcard group by ID                       | Required       |
| POST   | `/api/flashcard-groups`                   | Create new flashcard group                      | Required       |
| PUT    | `/api/flashcard-groups/:id`               | Update flashcard group                          | Required       |
| DELETE | `/api/flashcard-groups/:id`               | Delete flashcard group                          | Required       |
| POST   | `/api/flashcard-groups/:id/cards`         | Add card to flashcard group                     | Required       |
| PUT    | `/api/flashcard-groups/:id/cards/:cardId` | Update card in flashcard group                  | Required       |
| DELETE | `/api/flashcard-groups/:id/cards/:cardId` | Delete card from flashcard group                | Required       |
| POST   | `/api/flashcard-groups/:id/review`        | Review a card                                   | Required       |
| GET    | `/api/flashcard-groups/:id/due`           | Get cards due for review                        | Required       |
| GET    | `/api/flashcard-groups/stats/user`        | Get user's flashcard statistics                 | Required       |

### Flashcard AI Settings Collection

| Method | Endpoint                                     | Description                            | Authentication |
| ------ | -------------------------------------------- | -------------------------------------- | -------------- |
| GET    | `/api/flashcard-ai-settings`                 | Get AI settings for authenticated user | Required       |
| GET    | `/api/flashcard-ai-settings/:id`             | Get AI settings by user ID             | Required       |
| POST   | `/api/flashcard-ai-settings`                 | Create new AI settings                 | Required       |
| PUT    | `/api/flashcard-ai-settings/:id`             | Update AI settings                     | Required       |
| DELETE | `/api/flashcard-ai-settings/:id`             | Delete AI settings                     | Required       |
| PUT    | `/api/flashcard-ai-settings/:id/api-key`     | Update API key                         | Required       |
| PUT    | `/api/flashcard-ai-settings/:id/preferences` | Update preferences                     | Required       |
| POST   | `/api/flashcard-ai-settings/:id/usage`       | Record usage                           | Required       |
| GET    | `/api/flashcard-ai-settings/:id/usage`       | Get usage statistics                   | Required       |

### Task Plans Collection

| Method | Endpoint                                                | Description                               | Authentication |
| ------ | ------------------------------------------------------- | ----------------------------------------- | -------------- |
| GET    | `/api/task-plans`                                       | Get all task plans for authenticated user | Required       |
| GET    | `/api/task-plans/public`                                | Get public task plans from all users      | None           |
| GET    | `/api/task-plans/:id`                                   | Get task plan by ID                       | Required       |
| POST   | `/api/task-plans`                                       | Create new task plan                      | Required       |
| PUT    | `/api/task-plans/:id`                                   | Update task plan                          | Required       |
| DELETE | `/api/task-plans/:id`                                   | Delete task plan                          | Required       |
| POST   | `/api/task-plans/:id/tasks`                             | Add task to task plan                     | Required       |
| PUT    | `/api/task-plans/:id/tasks/:taskId`                     | Update task in Task Plan                  | Required       |
| DELETE | `/api/task-plans/:id/tasks/:taskId`                     | Delete task from Task Plan                | Required       |
| POST   | `/api/task-plans/:id/tasks/:taskId/subtasks`            | Add subtask to task                       | Required       |
| PUT    | `/api/task-plans/:id/tasks/:taskId/subtasks/:subtaskId` | Update subtask                            | Required       |
| DELETE | `/api/task-plans/:id/tasks/:taskId/subtasks/:subtaskId` | Delete subtask                            | Required       |
| GET    | `/api/task-plans/stats/user`                            | Get user's task plan statistics           | Required       |

### Flow Edges Collection

| Method | Endpoint                            | Description                               | Authentication |
| ------ | ----------------------------------- | ----------------------------------------- | -------------- |
| GET    | `/api/flow-edges`                   | Get all flow edges for authenticated user | Required       |
| GET    | `/api/flow-edges/plan/:planId`      | Get flow edges for a specific task plan   | Required       |
| GET    | `/api/flow-edges/:id`               | Get flow edge document by ID              | Required       |
| POST   | `/api/flow-edges`                   | Create new flow edge document             | Required       |
| PUT    | `/api/flow-edges/:id`               | Update flow edge document                 | Required       |
| DELETE | `/api/flow-edges/:id`               | Delete flow edge document                 | Required       |
| POST   | `/api/flow-edges/:id/edges`         | Add edge to flow edge document            | Required       |
| PUT    | `/api/flow-edges/:id/edges/:edgeId` | Update edge in flow edge document         | Required       |
| DELETE | `/api/flow-edges/:id/edges/:edgeId` | Delete edge from flow edge document       | Required       |
| GET    | `/api/flow-edges/stats/user`        | Get user's flow edge statistics           | Required       |

### Tags Collection

| Method | Endpoint                              | Description                    | Authentication |
| ------ | ------------------------------------- | ------------------------------ | -------------- |
| GET    | `/api/tags`                           | Get all tags (with pagination) | None           |
| GET    | `/api/tags/popular`                   | Get popular tags               | None           |
| GET    | `/api/tags/system`                    | Get system tags                | None           |
| GET    | `/api/tags/user`                      | Get user-created tags          | None           |
| GET    | `/api/tags/:id`                       | Get tag by ID                  | None           |
| GET    | `/api/tags/name/:name`                | Get tag by name                | None           |
| POST   | `/api/tags`                           | Create new tag                 | Required       |
| PUT    | `/api/tags/:id`                       | Update tag                     | Required       |
| DELETE | `/api/tags/:id`                       | Delete tag                     | Required       |
| POST   | `/api/tags/:id/related`               | Add related tag                | Required       |
| DELETE | `/api/tags/:id/related/:relatedTagId` | Remove related tag             | Required       |
| PUT    | `/api/tags/:id/increment-usage`       | Increment tag usage count      | Required       |
| PUT    | `/api/tags/:id/decrement-usage`       | Decrement tag usage count      | Required       |
| GET    | `/api/tags/stats/overview`            | Get tag statistics overview    | None           |

## Error Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 500  | Internal Server Error |

## Data Models

### User Model

```json
{
  "_id": "ObjectId",
  "username": "String",
  "email": "String",
  "createdAt": "Date",
  "updatedAt": "Date",
  "lastLoginAt": "Date",
  "isActive": "Boolean",
  "preferences": {
    "language": "String",
    "theme": "String",
    "timezone": "String"
  }
}
```

### Book Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "String",
  "author": "String",
  "year": "Number",
  "cover": "String",
  "description": "String",
  "tags": ["String"],
  "rating": "Number",
  "status": "String",
  "visibility": "String",
  "pages": "Number",
  "publisher": "String",
  "language": "String",
  "createdAt": "Date",
  "updatedAt": "Date",
  "isbn": "String",
  "userNotes": "String",
  "startDate": "Date",
  "finishDate": "Date",
  "progress": "Number",
  "favorite": "Boolean"
}
```

### Post Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "content": "String",
  "books": ["ObjectId"],
  "likes": "Number",
  "comments": [
    {
      "userId": "ObjectId",
      "content": "String",
      "createdAt": "Date"
    }
  ],
  "tags": ["String"],
  "visibility": "String",
  "createdAt": "Date",
  "updatedAt": "Date",
  "isEdited": "Boolean",
  "editedAt": "Date"
}
```

### Profile Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "String",
  "username": "String",
  "bio": "String",
  "profileImage": "String",
  "backgroundImage": "String",
  "location": "String",
  "joined": "Date",
  "followers": ["ObjectId"],
  "following": ["ObjectId"],
  "posts": "Number",
  "tags": ["String"],
  "socialLinks": {
    "website": "String",
    "twitter": "String",
    "github": "String"
  },
  "stats": {
    "booksRead": "Number",
    "studyStreak": "Number",
    "totalStudyHours": "Number"
  },
  "privacy": {
    "showEmail": "Boolean",
    "showLocation": "Boolean",
    "allowFollowers": "Boolean"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Goal Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "text": "String",
  "isPublic": "Boolean",
  "category": "String",
  "priority": "String",
  "targetDate": "Date",
  "status": "String",
  "progress": "Number",
  "createdAt": "Date",
  "updatedAt": "Date",
  "completedAt": "Date"
}
```

### Calendar Event Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "date": "String",
  "events": [
    {
      "id": "String",
      "title": "String",
      "description": "String",
      "startTime": "String",
      "endTime": "String",
      "category": "String",
      "priority": "String",
      "completed": "Boolean",
      "relatedBookId": "ObjectId",
      "relatedTaskId": "String",
      "color": "String",
      "reminder": {
        "enabled": "Boolean",
        "minutesBefore": "Number"
      },
      "createdAt": "Date"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Flashcard Group Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "String",
  "description": "String",
  "cards": [
    {
      "id": "Number",
      "question": "String",
      "answer": "String",
      "category": "String",
      "easyCount": "Number",
      "lastReviewed": "Date",
      "nextReview": "Date",
      "difficulty": "Number",
      "reviewCount": "Number",
      "correctCount": "Number",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "nextCardId": "Number",
  "isPublic": "Boolean",
  "category": "String",
  "tags": ["String"],
  "stats": {
    "totalCards": "Number",
    "masteredCards": "Number",
    "reviewingCards": "Number",
    "newCards": "Number"
  },
  "createdAt": "Date",
  "updatedAt": "Date",
  "lastStudiedAt": "Date"
}
```

### Flashcard AI Settings Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "language": "String",
  "apiKey": "String",
  "preferences": {
    "defaultCardCount": "Number",
    "difficulty": "String",
    "includeImages": "Boolean",
    "autoTranslate": "Boolean"
  },
  "usageStats": {
    "totalCardsGenerated": "Number",
    "lastUsed": "Date",
    "monthlyUsage": [
      {
        "month": "String",
        "count": "Number"
      }
    ]
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Task Plan Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "String",
  "description": "String",
  "status": "String",
  "tasks": [
    {
      "id": "String",
      "title": "String",
      "description": "String",
      "status": "String",
      "priority": "String",
      "createdAt": "Date",
      "startAt": "Date",
      "dueDate": "Date",
      "completedAt": "Date",
      "estimatedHours": "Number",
      "actualHours": "Number",
      "tags": ["String"],
      "dependencies": ["String"],
      "relatedBookId": "ObjectId",
      "subtasks": [
        {
          "id": "String",
          "title": "String",
          "completed": "Boolean",
          "completedAt": "Date"
        }
      ]
    }
  ],
  "dueDate": "Date",
  "category": "String",
  "tags": ["String"],
  "isPublic": "Boolean",
  "collaborators": ["ObjectId"],
  "createdAt": "Date",
  "updatedAt": "Date",
  "completedAt": "Date"
}
```

### Flow Edge Model

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "planId": "ObjectId",
  "edges": [
    {
      "id": "String",
      "source": "String",
      "target": "String",
      "type": "String",
      "style": {
        "type": "String",
        "animated": "Boolean",
        "color": "String",
        "width": "Number"
      },
      "label": "String",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Tag Model

```json
{
  "_id": "ObjectId",
  "name": "String",
  "category": "String",
  "description": "String",
  "color": "String",
  "usageCount": "Number",
  "isSystem": "Boolean",
  "relatedTags": ["ObjectId"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Usage Examples

### Register a New User

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student123",
    "email": "student@example.com",
    "password": "securepassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepassword123"
  }'
```

### Create a New Book

```bash
curl -X POST http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "status": "want-to-read",
    "visibility": "public",
    "rating": 5,
    "tags": ["classic", "fiction"]
  }'
```

### Get User's Books

```bash
curl -X GET http://localhost:5000/api/books \
  -H "x-user-id: USER_ID_HERE"
```

### Create a New Goal

```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE" \
  -d '{
    "text": "Complete JavaScript course",
    "category": "academic",
    "priority": "high",
    "targetDate": "2024-12-31T00:00:00.000Z"
  }'
```

### Create a New Flashcard Group

```bash
curl -X POST http://localhost:5000/api/flashcard-groups \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE" \
  -d '{
    "name": "JavaScript Fundamentals",
    "description": "Basic JavaScript concepts and syntax",
    "category": "programming",
    "tags": ["javascript", "programming"]
  }'
```

### Get Public Books (Data Verification Example)

```bash
# Get all public books to verify data migration
curl -X GET http://localhost:5000/api/books/public \
  -H "Content-Type: application/json"

# Response will show books from all users with visibility="public"
# Use this to verify that frontend data was properly migrated
```

### Query Books by User ID

```bash
# Get books for a specific user to verify user separation
curl -X GET "http://localhost:5000/api/books?userId=USER_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

# Add query parameters for filtering
curl -X GET "http://localhost:5000/api/books?status=reading&limit=5" \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"
```

### Verify User Data Separation

```bash
# Test that users can only access their own data
curl -X GET http://localhost:5000/api/profiles/me \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

# Try to access another user's private data (should fail)
curl -X GET http://localhost:5000/api/profiles/OTHER_USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"
# Expected: 403 Forbidden response
```

### Check Data Integrity via API

```bash
# Get user statistics to verify data counts
curl -X GET http://localhost:5000/api/books/stats/user \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/posts/stats/user \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/goals/stats/user \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"
```

### Verify Migration Completeness

```bash
# Check all collections for data presence
curl -X GET http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: ADMIN_USER_ID"

curl -X GET http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/profiles \
  -H "Content-Type: application/json"

curl -X GET http://localhost:5000/api/goals \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/calendar-events \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/flashcard-groups \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/task-plans \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/flow-edges \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"

curl -X GET http://localhost:5000/api/tags \
  -H "Content-Type: application/json"
```

## Database Viewing Tools

### Web Interface

Access the web-based database viewer at:

```
http://localhost:5000/admin/view-data
```

**Features:**

- Visual data browsing with pagination
- Search and filtering capabilities
- User data separation verification
- Real-time integrity checking
- Export functionality

**Authentication:**

- Default password: `admin123` (change in production via `ADMIN_PASSWORD` env variable)

### Command-Line Tools

Navigate to `backend/scripts/db-tools/` directory for powerful CLI tools:

```bash
# List all collections with statistics
cd backend/scripts/db-tools
node list-collections.js

# Query specific user data
node query-by-user.js johndoe
node query-by-user.js --list  # Show all users

# Check data integrity
node check-integrity.js

# Export data for backup
node export-data.js --all json
node export-data.js books csv
node export-data.js --user USER_ID_HERE
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Failures

**Problem:** Getting 401 Unauthorized errors

```bash
# Check if user ID is correctly set in headers
curl -X GET http://localhost:5000/api/books \
  -H "x-user-id: YOUR_ACTUAL_USER_ID" \
  -v  # Verbose mode to see headers
```

**Solution:**

- Verify user ID is valid ObjectId
- Check that user exists in database
- Ensure `x-user-id` header is properly formatted

#### 2. Data Not Found

**Problem:** Getting 404 errors for expected data

```bash
# Check if data exists in database
node query-by-user.js YOUR_USERNAME

# Verify collection has data
node list-collections.js
```

**Solution:**

- Run migration script if data is missing
- Check if data was properly migrated from frontend
- Verify user separation is working correctly

#### 3. User Data Separation Issues

**Problem:** Users can access other users' data

```bash
# Test user isolation
curl -X GET http://localhost:5000/api/books/OTHER_USER_BOOK_ID \
  -H "x-user-id: YOUR_USER_ID"
# Should return 403 Forbidden
```

**Solution:**

- Check authentication middleware is properly implemented
- Verify `userId` field is correctly set on all documents
- Run integrity check to find orphaned records

#### 4. Performance Issues

**Problem:** Slow API responses

```bash
# Check database indexes
node check-integrity.js

# Look for missing userId indexes in output
```

**Solution:**

- Ensure proper indexes exist on `userId` fields
- Consider pagination for large datasets
- Use specific queries instead of fetching all data

#### 5. Migration Verification

**Problem:** Unsure if migration completed successfully

```bash
# Comprehensive verification
node list-collections.js  # Check all collections
node check-integrity.js  # Verify data integrity
node query-by-user.js --list  # Verify users exist

# Compare with original frontend data
node export-data.js --all json > migrated-data.json
# Compare with src/data/ files
```

**Solution:**

- Use web interface for visual verification
- Run command-line tools for detailed analysis
- Check user data distribution in dashboard

#### 6. Export/Backup Issues

**Problem:** Data export fails or incomplete

```bash
# Test export functionality
node export-data.js users json
node export-data.js --user USER_ID_HERE

# Check exports directory
ls -la backend/scripts/exports/
```

**Solution:**

- Ensure write permissions to exports directory
- Check available disk space
- Verify database connection is stable

### Debugging Tips

1. **Use verbose curl output**: Add `-v` flag to see full HTTP request/response
2. **Check response headers**: Look for error messages in response headers
3. **Verify JSON format**: Use JSON validators to check request body format
4. **Test with small datasets**: Start with 1-2 records before testing bulk operations
5. **Monitor logs**: Check backend console for detailed error messages

### Getting Help

If you encounter issues:

1. **Check the logs**: Backend console shows detailed error information
2. **Use the web interface**: `/admin/view-data` provides visual debugging
3. **Run integrity checks**: `node check-integrity.js` identifies common problems
4. **Verify environment**: Ensure `.env` file has correct configuration

## Security Considerations

1. **Authentication**: All user-specific endpoints require authentication via the `x-user-id` header
2. **Authorization**: Users can only access their own data, except for public resources
3. **Input Validation**: All inputs are validated before processing
4. **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
5. **Data Separation**: All user data is properly separated by `userId` field

## Testing

The backend server is running on `http://localhost:5000`. You can test the API endpoints using tools like Postman, curl, or any HTTP client.

For testing with a specific user ID, you'll need to:

1. First register a user using the `/api/users` endpoint
2. Use the returned user ID in the `x-user-id` header for subsequent requests
