// API service for making authenticated requests to the backend

const API_BASE_URL = '/api'

// Get the authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token')
}

async function handleResponse(response) {
  let data = null

  try {
    if (response.status !== 204) {
      data = await response.json()
    }
  } catch (error) {
    if (response.status !== 204) {
      console.error('Failed to parse API response', error)
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`
    const err = new Error(message)
    err.status = response.status
    err.data = data
    throw err
  }

  return data ?? {}
}

// Generic request function with authentication headers
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-user-id': token }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      // Clear invalid authentication data
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      // Redirect to login page
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    return response
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Specific API methods
export const api = {
  // Authentication endpoints
  login: async (email, password) => {
    const response = await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(response)
  },

  register: async (username, email, password) => {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
    return handleResponse(response)
  },

  // User endpoints
  getUser: async (userId) => {
    const response = await apiRequest(`/users/${userId}`)
    return handleResponse(response)
  },

  updateUser: async (userId, data) => {
    const response = await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // Generic CRUD operations
  get: async (endpoint) => {
    const response = await apiRequest(endpoint)
    return handleResponse(response)
  },

  post: async (endpoint, data) => {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  put: async (endpoint, data) => {
    const response = await apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  delete: async (endpoint) => {
    const response = await apiRequest(endpoint, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },
}

export default api
