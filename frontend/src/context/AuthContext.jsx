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
    try {
      setLoading(true)
      setError(null)

      const data = await api.login(email, password)

      // Store user data and token
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      localStorage.setItem('auth_token', data.user._id) // Using user ID as simple token for now
      
      setUser(data.user)
      setIsAuthenticated(true)
      
      return { success: true, user: data.user }
    } catch (error) {
      const errorMessage = error.message || 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, email, password) => {
    try {
      setLoading(true)
      setError(null)

      const data = await api.register(username, email, password)

      // Auto-login after successful registration
      return await login(email, password)
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