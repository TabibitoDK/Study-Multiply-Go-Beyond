# Database Query Tools

This directory contains command-line tools for inspecting and managing your migrated MongoDB data.

## Available Tools

### 1. list-collections.js

Lists all collections with document counts, sizes, and basic statistics.

**Usage:**

```bash
node list-collections.js
```

**What it shows:**

- Document count for each collection
- Collection size in KB
- Average document size
- Number of indexes
- Field names for each collection
- Total database statistics

### 2. query-by-user.js

Queries all data belonging to a specific user.

**Usage:**

```bash
# Query by user ID
node query-by-user.js 507f1f77bcf86cd799439011

# Query by username
node query-by-user.js johndoe

# Query by email
node query-by-user.js john@example.com

# List all users
node query-by-user.js --list

# Show help
node query-by-user.js --help
```

**What it shows:**

- User information (ID, username, email, creation date)
- Data count for each collection
- Recent items from each collection
- Data distribution visualization
- Total items across all collections

### 3. check-integrity.js

Performs comprehensive data integrity checks.

**Usage:**

```bash
node check-integrity.js
```

**What it checks:**

- **Orphaned Records**: Documents with non-existent user references
- **Duplicate Data**: Duplicate emails and usernames
- **Data Consistency**: Users without profiles, missing required fields
- **Index Health**: Proper indexing for performance

**Output:**

- Console report with detailed findings
- JSON report file saved to `integrity-report-[timestamp].json`

### 4. export-data.js

Exports data in JSON or CSV format.

**Usage:**

```bash
# Export specific collection (JSON format)
node export-data.js users

# Export specific collection (CSV format)
node export-data.js books csv

# Export all data for a specific user
node export-data.js --user 507f1f77bcf86cd799439011

# Export all collections
node export-data.js --all

# Show help
node export-data.js --help
```

**Export locations:**

- Files are saved to `backend/scripts/exports/` directory
- Filenames include timestamps to avoid overwrites
- Supports both JSON and CSV formats

## Setup

1. Make sure you have Node.js installed
2. Navigate to the db-tools directory:
   ```bash
   cd backend/scripts/db-tools
   ```
3. Ensure your `.env` file has the correct MongoDB connection string
4. Run the tools as shown above

## Environment Variables

The tools use the same environment variables as your main application:

- `MONGODB_URI`: MongoDB connection string (defaults to `mongodb://127.0.0.1:27017/study-multiply`)
- `NODE_ENV`: Environment (development/production)

## Examples

### Quick Database Overview

```bash
node list-collections.js
```

### Check User Data Migration

```bash
# First, list all users
node query-by-user.js --list

# Then check specific user
node query-by-user.js johndoe
```

### Verify Migration Integrity

```bash
node check-integrity.js
```

### Export Data for Backup

```bash
# Export everything
node export-data.js --all json

# Export specific collection
node export-data.js users csv
```

## Troubleshooting

### Connection Issues

- Ensure MongoDB is running
- Check your `.env` file for correct `MONGODB_URI`
- Verify network connectivity if using remote MongoDB

### Permission Issues

- Make sure the `exports` directory is writable
- Check file permissions if scripts can't create files

### Memory Issues with Large Datasets

- For very large collections, consider exporting in smaller batches
- Monitor memory usage during export operations

## Integration with Web Interface

These command-line tools complement the web-based database viewer available at:

- `http://localhost:5000/admin/view-data` (after authentication)

The web interface provides:

- Visual data browsing
- Interactive filtering and search
- Real-time integrity checking
- User-friendly data exploration

The command-line tools provide:

- Automated scripting capabilities
- Bulk data export
- Detailed integrity reporting
- Programmatic data access
