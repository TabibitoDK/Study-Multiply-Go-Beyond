import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('auth_user')
        const storedToken = localStorage.getItem('auth_token')
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error)
        // Clear corrupted data
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const trimmedEmail = (email || '').trim().toLowerCase()
    const trimmedPassword = password || ''

    if (!trimmedEmail || !trimmedPassword) {
      const message = 'Email and password are required'
      setError(message)
      return { success: false, error: message }
    }

    try {
      setLoading(true)
      setError(null)

      const data = await api.login(trimmedEmail, trimmedPassword)
      const safeUser = {
        ...data.user,
        id: data.user?._id || data.user?.id,
      }

      if (!safeUser.id) {
        throw new Error('Login response missing user id')
      }

      localStorage.setItem('auth_user', JSON.stringify(safeUser))
      localStorage.setItem('auth_token', safeUser.id)
      
      setUser(safeUser)
      setIsAuthenticated(true)
      
      return { success: true, user: safeUser }
    } catch (error) {
      const errorMessage = error.message || 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, email, password) => {
    const trimmedUsername = (username || '').trim()
    const trimmedEmail = (email || '').trim().toLowerCase()
    const trimmedPassword = password || ''

    const normalizedUsername = trimmedUsername.replace(/\s+/g, '_').toLowerCase()
    const usernamePattern = /^[a-z0-9_]{3,30}$/i

    if (!usernamePattern.test(normalizedUsername)) {
      const message = 'Username must be 3-30 characters and only use letters, numbers, or underscores'
      setError(message)
      return { success: false, error: message }
    }

    if (!trimmedEmail) {
      const message = 'A valid email is required'
      setError(message)
      return { success: false, error: message }
    }

    if (trimmedPassword.length < 8) {
      const message = 'Password must be at least 8 characters long'
      setError(message)
      return { success: false, error: message }
    }

    try {
      setLoading(true)
      setError(null)

      await api.register(normalizedUsername, trimmedEmail, trimmedPassword)

      return await login(trimmedEmail, trimmedPassword)
    } catch (error) {
      const errorMessage = error.message || 'Registration failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  const guestLogin = useCallback(() => {
    const guestUser = {
      _id: `guest_${Date.now()}`,
      username: `Guest_${Math.random().toString(36).slice(2, 9)}`,
      email: 'guest@example.com',
      isGuest: true,
    }

    localStorage.setItem('auth_user', JSON.stringify(guestUser))
    localStorage.setItem('auth_token', guestUser._id)
    
    setUser(guestUser)
    setIsAuthenticated(true)
    
    return { success: true, user: guestUser }
  }, [])

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    guestLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
