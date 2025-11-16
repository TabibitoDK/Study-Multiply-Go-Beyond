import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

const AUTH_USER_KEY = 'auth_user'
const AUTH_TOKEN_KEY = 'auth_token'
const GUEST_IDENTITY_KEY = 'nyacademy_guest_id'

const isStorageAvailable = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const safeStorage = {
  get: key => {
    if (!isStorageAvailable()) return null
    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to read ${key} from storage`, error)
      return null
    }
  },
  set: (key, value) => {
    if (!isStorageAvailable()) return
    try {
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.warn(`Failed to write ${key} to storage`, error)
    }
  },
  remove: key => {
    if (!isStorageAvailable()) return
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove ${key} from storage`, error)
    }
  },
}

const parseStoredJson = raw => {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Failed to parse stored JSON payload', error)
    return null
  }
}

const normalizeUserRecord = user => {
  if (!user) return null
  const id = user.id || user._id
  if (!id) return null
  return {
    ...user,
    id,
    _id: user._id || id,
  }
}

const persistAuthState = user => {
  if (!user?.id) return
  safeStorage.set(AUTH_USER_KEY, JSON.stringify(user))
  safeStorage.set(AUTH_TOKEN_KEY, user.id)
}

const clearAuthState = () => {
  safeStorage.remove(AUTH_USER_KEY)
  safeStorage.remove(AUTH_TOKEN_KEY)
}

const buildGuestEmail = username => `${username}@guest.local`

const generateGuestPassword = () => {
  const base = Math.random().toString(36).slice(2, 10)
  const extra = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `G!${base}${extra}`
}

const normalizeGuestIdentityShape = identity => {
  if (!identity) return null
  const username = (identity.username || identity.id || '').trim()
  if (!username) return null
  const id = identity.id || username
  const displayName = identity.displayName || identity.name || `Guest ${username.slice(0, 4).toUpperCase()}`
  const email = (identity.email || buildGuestEmail(username)).toLowerCase()
  const password = identity.password && identity.password.length >= 8
    ? identity.password
    : generateGuestPassword()

  return {
    id,
    username,
    displayName,
    profileImage: identity.profileImage || '',
    email,
    password,
    userId: identity.userId,
  }
}

const parseGuestIdentity = raw => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const normalized = normalizeGuestIdentityShape(parsed)
    if (normalized) {
      return normalized
    }
  } catch (error) {
    // Legacy guest IDs were stored as plain strings
    const sanitized = typeof raw === 'string' ? raw.trim() : ''
    if (sanitized) {
      const suffix = sanitized.replace(/^guest[_-]?/i, '').slice(0, 6)
      const displayName = suffix ? `Guest ${suffix}` : 'Guest'
      return normalizeGuestIdentityShape({
        id: sanitized,
        username: sanitized,
        displayName,
        profileImage: '',
      })
    }
  }
  return null
}

const readGuestIdentity = () => parseGuestIdentity(safeStorage.get(GUEST_IDENTITY_KEY))

const writeGuestIdentity = identity => {
  if (!identity?.id) return
  safeStorage.set(GUEST_IDENTITY_KEY, JSON.stringify(identity))
}

const createGuestIdentity = () => {
  const slug = Math.random().toString(36).slice(2, 10)
  const username = `guest_${slug}`
  const displayName = `Guest ${slug.slice(0, 4).toUpperCase()}`
  return normalizeGuestIdentityShape({
    id: username,
    username,
    displayName,
    profileImage: '',
    email: buildGuestEmail(username),
    password: generateGuestPassword(),
  })
}

const ensureGuestIdentity = () => {
  const existing = normalizeGuestIdentityShape(readGuestIdentity())
  if (existing?.id) {
    writeGuestIdentity(existing)
    return existing
  }
  const created = createGuestIdentity()
  writeGuestIdentity(created)
  return created
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = parseStoredJson(safeStorage.get(AUTH_USER_KEY))
        const storedToken = safeStorage.get(AUTH_TOKEN_KEY)

        if (storedUser) {
          const normalizedUser = normalizeUserRecord(storedUser)
          if (normalizedUser) {
            if (!storedToken) {
              safeStorage.set(AUTH_TOKEN_KEY, normalizedUser.id)
            }
            setUser(normalizedUser)
            setIsAuthenticated(true)
          } else {
            clearAuthState()
          }
        } else if (storedToken) {
          safeStorage.remove(AUTH_TOKEN_KEY)
        }
      } catch (initError) {
        console.error('Failed to initialize authentication:', initError)
        clearAuthState()
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
      const safeUser = normalizeUserRecord(data.user)

      if (!safeUser) {
        throw new Error('Login response missing user id')
      }

      persistAuthState(safeUser)
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
    clearAuthState()
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  const guestLogin = useCallback(async () => {
    const identity = ensureGuestIdentity()
    try {
      setLoading(true)
      setError(null)

      try {
        await api.register(identity.username, identity.email, identity.password)
      } catch (registerError) {
        if (registerError?.status !== 409) {
          throw registerError
        }
      }

      const data = await api.login(identity.email, identity.password)
      const safeUser = normalizeUserRecord(data.user)

      if (!safeUser) {
        throw new Error('Guest login response missing user id')
      }

      const guestUser = {
        ...safeUser,
        name: safeUser.name || safeUser.username || identity.displayName,
        isGuest: true,
      }

      persistAuthState(guestUser)
      setUser(guestUser)
      setIsAuthenticated(true)
      writeGuestIdentity({ ...identity, userId: guestUser.id })

      return { success: true, user: guestUser }
    } catch (guestError) {
      const message = guestError.message || 'Guest login failed'
      console.error('Guest login failed:', guestError)
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStoredUser = useCallback(updater => {
    setUser(prev => {
      if (!prev) return prev
      const nextValue = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      const normalized = normalizeUserRecord(nextValue) || prev
      persistAuthState(normalized)
      return normalized
    })
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
    updateUser: updateStoredUser,
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
