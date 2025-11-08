# Data Migration Scripts

This directory contains comprehensive migration scripts to move all frontend data into the MongoDB backend.

## Overview

The migration system consists of:

1. **Main Migration Script** (`migrate-data.js`) - Orchestrates the entire migration process
2. **Data Extractor** (`helpers/dataExtractor.js`) - Extracts data from various frontend sources
3. **Data Transformer** (`utils/dataTransformer.js`) - Transforms data to match MongoDB schema
4. **User Manager** (`helpers/userManager.js`) - Handles user creation and assignment
5. **Migration Functions** (`helpers/migrationFunctions.js`) - Handles migration for each data type
6. **Rollback Manager** (`utils/rollbackManager.js`) - Provides rollback functionality

## Data Sources

### JSON Files (frontend/src/data/)

- `books.json` - Books data with user assignment
- `posts.json` - Posts data with userId references
- `profiles.json` - Profile data with user references
- `tags.json` - Global tags data

### localStorage Data (Simulated)

- `study-app-books-v2-json` - Books data
- `smgb-user-goals-v1` - User goals
- `smgb-calendar-events-v1` - Calendar events
- `flashcard_groups_v6_data` - Flashcard groups
- `flashcard_ai_settings_v1` - Flashcard AI settings

### sessionStorage Data (Simulated)

- `immerse-mode-state` - Immerse mode state
- `flow-view:{planId}:edges` - Flow view edges

## Installation

```bash
cd backend/scripts
npm install
```

## Usage

### Run Migration

```bash
# From the backend/scripts directory
npm run migrate

# Or directly with node
node migrate-data.js
```

### Rollback Migration

```bash
# From the backend/scripts directory
npm run rollback

# Or directly with node
node migrate-data.js rollback
```

## Migration Process

The migration follows these steps:

1. **Initialize** - Connect to database and initialize rollback system
2. **Extract Data** - Read all data from frontend sources
3. **Create Users** - Create users from profile data
4. **Migrate Tags** - Migrate global tags first (referenced by other entities)
5. **Migrate Books** - Migrate books with user assignments
6. **Migrate Posts** - Migrate posts with proper userId references
7. **Migrate LocalStorage Data** - Migrate goals, calendar events, flashcards
8. **Migrate SessionStorage Data** - Migrate task plans and flow edges
9. **Complete Migration** - Save rollback data and show summary

## Data Transformation

### User Creation

- Creates users from profile data
- Generates email from username (username@example.com)
- Sets default password hash (Migration123!)
- Creates corresponding profile records

### Data Assignment

- Books without users are assigned randomly to created users
- LocalStorage data is distributed among users
- Maintains relationships between different data types

### Schema Mapping

- Maps old string IDs to MongoDB ObjectIds
- Transforms data structures to match backend schemas
- Handles date conversions and data validation

## Error Handling

The migration system includes comprehensive error handling:

- **Database Connection Errors** - Handles MongoDB connection issues
- **Data Validation Errors** - Validates data before insertion
- **Transformation Errors** - Handles data transformation failures
- **Rollback on Failure** - Automatically rolls back on critical errors

## Rollback System

The rollback system provides:

- **Complete Rollback** - Removes all migrated data
- **Referential Integrity** - Deletes in correct order to maintain constraints
- **Rollback Data** - Saves migration data for rollback operations
- **Selective Rollback** - Can rollback specific data types

## Logging and Progress

The migration provides detailed logging:

- **Step-by-Step Progress** - Shows current migration step
- **Success/Failure Counts** - Tracks migration statistics
- **Error Messages** - Detailed error information
- **Migration Summary** - Complete migration report

## Sample Output

```
============================================================
DATA MIGRATION STARTED
============================================================
? Database connected successfully

----------------------------------------
STEP 1: EXTRACTING DATA
----------------------------------------
Extracting books data...
Extracted 7 books
Extracting posts data...
Extracted 10 posts
Extracting profiles data...
Extracted 5 profiles
Extracting tags data...
Extracted 15 tags
? Data extraction completed

----------------------------------------
STEP 2: CREATING USERS
----------------------------------------
Created user: aiko_hennyu (507f1f77bcf86cd799439011)
Created user: haruto_study (507f1f77bcf86cd799439012)
? User creation completed
  Created 5 users

----------------------------------------
STEP 3: MIGRATING TAGS
----------------------------------------
Migrating 15 tags...
Migrated tag: ‰»Šw (507f1f77bcf86cd799439020)
? Tags migration completed: 15 success, 0 failed

============================================================
MIGRATION SUMMARY
============================================================
Duration: 2500ms
Migration Statistics:
  books: 7 success, 0 failed
  posts: 10 success, 0 failed
  tags: 15 success, 0 failed
User Statistics:
  Total Users: 5
  User Mappings: 5
============================================================
```

## Configuration

### Environment Variables

The migration uses the same database configuration as the backend API:

- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)

### Customization

You can customize the migration by modifying:

- **User Assignment Strategy** - Round-robin or random assignment
- **Default Password** - Change the default migration password
- **Data Filtering** - Filter data during extraction
- **Transformation Rules** - Modify data transformation logic

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Ensure MongoDB is running
   - Check connection string in .env file

2. **Duplicate Key Errors**

   - Users with same username/email already exist
   - Tags with same name already exist

3. **Validation Errors**
   - Data doesn't match schema requirements
   - Missing required fields

### Debug Mode

Add debug logging by setting environment variable:

```bash
DEBUG=migration* npm run migrate
```

## Security Considerations

- **Default Passwords** - Change default passwords after migration
- **Data Privacy** - Review migrated data for sensitive information
- **Access Control** - Set appropriate user permissions

## Performance

- **Batch Processing** - Processes data in batches for large datasets
- **Memory Management** - Efficient memory usage for large files
- **Index Optimization** - Uses database indexes for faster operations

## Maintenance

- **Regular Backups** - Backup database before migrations
- **Rollback Testing** - Test rollback functionality
- **Log Review** - Review migration logs for issues
