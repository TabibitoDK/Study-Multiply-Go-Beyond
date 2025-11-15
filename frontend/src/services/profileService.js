import api from '../lib/api.js'

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const normalizeId = value => {
  if (!value) return null

  const checkId = candidate => (candidate && OBJECT_ID_REGEX.test(candidate) ? candidate : null)

  if (typeof value === 'string') {
    return checkId(value)
  }

  if (typeof value === 'object') {
    if (value._id) return checkId(value._id.toString())
    if (value.id) return checkId(value.id.toString())
    if (typeof value.toString === 'function') return checkId(value.toString())
  }

  return null
}

const ensureValidObjectId = id => {
  if (!id) return null
  if (typeof id === 'string') {
    return OBJECT_ID_REGEX.test(id) ? id : null
  }

  if (typeof id === 'object') {
    const fromObject = id._id || id.id
    if (typeof fromObject === 'string') {
      return OBJECT_ID_REGEX.test(fromObject) ? fromObject : null
    }
  }

  return null
}

const normalizeProfile = profile => {
  if (!profile) return null

  const userRef = profile.userId
  const userId = normalizeId(userRef) || normalizeId(profile._id) || normalizeId(profile.id)
  const followerIds = Array.isArray(profile.followers)
    ? profile.followers.map(normalizeId).filter(Boolean)
    : []
  const followersCount = Array.isArray(profile.followers)
    ? followerIds.length
    : typeof profile.followers === 'number'
      ? profile.followers
      : followerIds.length

  const followingIds = Array.isArray(profile.following)
    ? profile.following.map(normalizeId).filter(Boolean)
    : []
  const followingCount = Array.isArray(profile.following)
    ? followingIds.length
    : typeof profile.following === 'number'
      ? profile.following
      : followingIds.length

  return {
    ...profile,
    profileId: normalizeId(profile._id) || normalizeId(profile.id),
    id: userId,
    userId,
    username: profile.username || userRef?.username || profile.name || '',
    name: profile.name || userRef?.username || profile.username || '',
    bio: profile.bio || '',
    profileImage: profile.profileImage || '',
    backgroundImage: profile.backgroundImage || '',
    location: profile.location || '',
    joined: profile.joined || new Date().toISOString(),
    posts: typeof profile.posts === 'number' ? profile.posts : 0,
    tags: Array.isArray(profile.tags) ? profile.tags : [],
    stats: profile.stats || { booksRead: 0, studyStreak: 0, totalStudyHours: 0 },
    followers: followersCount,
    following: followingCount,
    followerIds,
    followingIds,
  }
}

const normalizeProfileList = list => {
  if (!Array.isArray(list)) return []
  return list.map(normalizeProfile).filter(Boolean)
}

// Profile service for handling all profile-related API calls
export const profileService = {
  // Get all profiles
  getAllProfiles: async () => {
    try {
      const response = await api.get('/profiles')
      return normalizeProfileList(response?.profiles ?? response)
    } catch (error) {
      console.error('Error fetching profiles:', error)
      throw error
    }
  },

  // Get a profile by ID
  getProfileById: async (id) => {
    try {
      const safeId = ensureValidObjectId(id)
      if (!safeId) {
        return null
      }
      const response = await api.get(`/profiles/user/${safeId}`)
      return normalizeProfile(response)
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  // Get current user's profile
  getCurrentUserProfile: async () => {
    try {
      const response = await api.get('/profiles/me')
      return normalizeProfile(response)
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      console.error('Error fetching current user profile:', error)
      throw error
    }
  },

  // Create or update a profile
  upsertProfile: async (profileData) => {
    try {
      const response = await api.post('/profiles', profileData)
      return response
    } catch (error) {
      console.error('Error creating/updating profile:', error)
      throw error
    }
  },

  // Update an existing profile
  updateProfile: async (id, profileData) => {
    try {
      const response = await api.put(`/profiles/${id}`, profileData)
      return response
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  // Get profiles except the current user
  getProfilesExcept: async (currentUserId) => {
    try {
      const response = await api.get(`/profiles/exclude/${currentUserId}`)
      return normalizeProfileList(response?.profiles ?? response)
    } catch (error) {
      console.error('Error fetching other profiles:', error)
      throw error
    }
  },

  // Follow a user
  followUser: async (userId) => {
    try {
      // Validate userId before making the API call
      const normalizedId = normalizeId(userId)
      if (!normalizedId) {
        throw new Error('Invalid user ID format. Please try again.')
      }
      
      console.log('Following user with ID:', normalizedId)
      const response = await api.post(`/profiles/follow/${normalizedId}`)
      return response
    } catch (error) {
      console.error('Error following user:', error)
      // Enhance error with more context
      if (error.status === 404) {
        error.message = 'User profile not found. The user may not have created a profile yet.'
      } else if (error.status === 403) {
        error.message = 'Unable to follow this user. They may have restricted who can follow them.'
      } else if (error.status === 400) {
        error.message = error.message || 'Invalid follow operation. You may already be following this user.'
      }
      throw error
    }
  },

  // Unfollow a user
  unfollowUser: async (userId) => {
    try {
      // Validate userId before making the API call
      const normalizedId = normalizeId(userId)
      if (!normalizedId) {
        throw new Error('Invalid user ID format. Please try again.')
      }
      
      console.log('Unfollowing user with ID:', normalizedId)
      const response = await api.delete(`/profiles/unfollow/${normalizedId}`)
      return response
    } catch (error) {
      console.error('Error unfollowing user:', error)
      // Enhance error with more context
      if (error.status === 404) {
        error.message = 'User profile not found. The user may not have created a profile yet.'
      } else if (error.status === 400) {
        error.message = error.message || 'Invalid unfollow operation. You may not be following this user.'
      }
      throw error
    }
  },

  // Get suggested users to follow
  getSuggestedUsers: async () => {
    try {
      const response = await api.get('/users/suggestions')
      // Normalize the response data to handle _id vs id mismatch
      const suggestions = response?.suggestions || []
      return suggestions.map(user => ({
        _id: user._id || user.id,
        id: user._id || user.id,
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        avatar: user.avatar || user.profileImage || '',
        profileImage: user.avatar || user.profileImage || '',
        tags: user.tags || [],
        isFollowing: user.isFollowing || false
      }))
    } catch (error) {
      console.error('Error fetching suggested users:', error)
      throw error
    }
  },

  // Get followers of a user
  getFollowers: async (userId) => {
    try {
      const response = await api.get(`/profiles/${userId}/followers`)
      return response
    } catch (error) {
      console.error('Error fetching followers:', error)
      throw error
    }
  },

  // Get users that a user is following
  getFollowing: async (userId) => {
    try {
      const response = await api.get(`/profiles/${userId}/following`)
      return response
    } catch (error) {
      console.error('Error fetching following:', error)
      throw error
    }
  },

  // Update profile bio
  updateBio: async (bioData) => {
    try {
      const response = await api.put('/profiles/bio', bioData)
      return response
    } catch (error) {
      console.error('Error updating bio:', error)
      throw error
    }
  },

  // Update profile interests/tags
  updateInterests: async (interestsData) => {
    try {
      const response = await api.put('/profiles/interests', interestsData)
      return response
    } catch (error) {
      console.error('Error updating interests:', error)
      throw error
    }
  },

  // Update profile goals
  updateGoals: async (goalsData) => {
    try {
      const response = await api.put('/profiles/goals', goalsData)
      return response
    } catch (error) {
      console.error('Error updating goals:', error)
      throw error
    }
  },

  // Upload profile image
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const response = await fetch('/api/profiles/image', {
        method: 'POST',
        headers: {
          'x-user-id': localStorage.getItem('auth_token')
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      return response.json()
    } catch (error) {
      console.error('Error uploading profile image:', error)
      throw error
    }
  },

  // Search profiles by query with pagination
  searchProfiles: async (query, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/profiles?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
      return {
        profiles: normalizeProfileList(response?.profiles ?? response),
        pagination: response?.pagination || {
          page,
          limit,
          total: 0,
          pages: 0
        }
      }
    } catch (error) {
      console.error('Error searching profiles:', error)
      // If profiles search fails, try users search as fallback
      try {
        const usersResponse = await api.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
        return {
          profiles: normalizeProfileList(usersResponse?.users ?? usersResponse),
          pagination: usersResponse?.pagination || {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError)
        throw error
      }
    }
  }
}

export default profileService
