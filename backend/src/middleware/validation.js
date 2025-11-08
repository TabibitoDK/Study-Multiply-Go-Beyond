// Validation middleware for common request patterns

// Validate ObjectId
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: `The ${paramName} parameter must be a valid ObjectId`
      });
    }
    
    next();
  };
};

// Validate pagination parameters
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      error: 'Invalid page',
      message: 'Page number must be greater than 0'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: 'Invalid limit',
      message: 'Limit must be between 1 and 100'
    });
  }
  
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  
  next();
};

// Validate date format (YYYY-MM-DD)
export const validateDateFormat = (paramName = 'date') => {
  return (req, res, next) => {
    const date = req.params[paramName] || req.query[paramName] || req.body[paramName];
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (date && !dateFormatRegex.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: `${paramName} must be in YYYY-MM-DD format`
      });
    }
    
    next();
  };
};

// Validate time format (HH:MM)
export const validateTimeFormat = (paramName = 'time') => {
  return (req, res, next) => {
    const time = req.params[paramName] || req.query[paramName] || req.body[paramName];
    const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (time && !timeFormatRegex.test(time)) {
      return res.status(400).json({
        error: 'Invalid time format',
        message: `${paramName} must be in HH:MM format (24-hour)`
      });
    }
    
    next();
  };
};

// Validate email format
export const validateEmail = (req, res, next) => {
  const email = req.body.email;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address'
    });
  }
  
  next();
};

// Validate username format
export const validateUsername = (req, res, next) => {
  const username = req.body.username;
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  
  if (username && !usernameRegex.test(username)) {
    return res.status(400).json({
      error: 'Invalid username',
      message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores'
    });
  }
  
  next();
};

// Validate password strength
export const validatePassword = (req, res, next) => {
  const password = req.body.password;
  
  if (password && password.length < 8) {
    return res.status(400).json({
      error: 'Weak password',
      message: 'Password must be at least 8 characters long'
    });
  }
  
  next();
};

// Validate rating (1-5)
export const validateRating = (req, res, next) => {
  const rating = req.body.rating;
  
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      error: 'Invalid rating',
      message: 'Rating must be between 1 and 5'
    });
  }
  
  next();
};

// Validate progress (0-100)
export const validateProgress = (req, res, next) => {
  const progress = req.body.progress;
  
  if (progress !== undefined && (progress < 0 || progress > 100)) {
    return res.status(400).json({
      error: 'Invalid progress',
      message: 'Progress must be between 0 and 100'
    });
  }
  
  next();
};

// Validate status enum values
export const validateStatus = (allowedValues, paramName = 'status') => {
  return (req, res, next) => {
    const status = req.body[paramName] || req.query[paramName];
    
    if (status && !allowedValues.includes(status)) {
      return res.status(400).json({
        error: `Invalid ${paramName}`,
        message: `${paramName} must be one of: ${allowedValues.join(', ')}`
      });
    }
    
    next();
  };
};

// Validate priority enum values
export const validatePriority = (req, res, next) => {
  const priority = req.body.priority;
  const allowedPriorities = ['low', 'medium', 'high'];
  
  if (priority && !allowedPriorities.includes(priority)) {
    return res.status(400).json({
      error: 'Invalid priority',
      message: `Priority must be one of: ${allowedPriorities.join(', ')}`
    });
  }
  
  next();
};

// Validate visibility enum values
export const validateVisibility = (req, res, next) => {
  const visibility = req.body.visibility;
  const allowedVisibilities = ['public', 'private'];
  
  if (visibility && !allowedVisibilities.includes(visibility)) {
    return res.status(400).json({
      error: 'Invalid visibility',
      message: `Visibility must be one of: ${allowedVisibilities.join(', ')}`
    });
  }
  
  next();
};

// Validate category enum values
export const validateCategory = (allowedValues, paramName = 'category') => {
  return (req, res, next) => {
    const category = req.body[paramName] || req.query[paramName];
    
    if (category && !allowedValues.includes(category)) {
      return res.status(400).json({
        error: `Invalid ${paramName}`,
        message: `${paramName} must be one of: ${allowedValues.join(', ')}`
      });
    }
    
    next();
  };
};

// Validate hex color code
export const validateHexColor = (paramName = 'color') => {
  return (req, res, next) => {
    const color = req.body[paramName];
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (color && !hexColorRegex.test(color)) {
      return res.status(400).json({
        error: 'Invalid color',
        message: `${paramName} must be a valid hex color code (e.g., #FF0000 or #F00)`
      });
    }
    
    next();
  };
};

// Validate ISBN format
export const validateISBN = (req, res, next) => {
  const isbn = req.body.isbn;
  
  if (isbn) {
    // Basic ISBN validation (ISBN-10 or ISBN-13)
    const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
    
    if (!isbnRegex.test(isbn)) {
      return res.status(400).json({
        error: 'Invalid ISBN',
        message: 'Please provide a valid ISBN-10 or ISBN-13 format'
      });
    }
  }
  
  next();
};

// Validate URL format
export const validateURL = (paramName = 'url') => {
  return (req, res, next) => {
    const url = req.body[paramName];
    const urlRegex = /^https?:\/\/.+/;
    
    if (url && !urlRegex.test(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: `${paramName} must be a valid URL starting with http:// or https://`
      });
    }
    
    next();
  };
};