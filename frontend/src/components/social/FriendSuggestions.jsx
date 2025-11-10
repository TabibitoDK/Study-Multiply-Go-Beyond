import { useState, useEffect } from 'react'
import { Search, Users, FileText, UserPlus, UserCheck, Loader, AlertCircle } from 'lucide-react'
import api from '../../lib/api.js'
import profileService from '../../services/profileService.js'
import postService from '../../services/postService.js'
import './FriendSuggestions.css'

export default function FriendSuggestions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  const [suggestions, setSuggestions] = useState([])
  const [searchResults, setSearchResults] = useState({ friends: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [following, setFollowing] = useState(new Set())

  // Fetch suggested friends on component mount
  useEffect(() => {
    fetchFriendSuggestions()
  }, [])

  // Fetch friend suggestions from API
  const fetchFriendSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use profileService to get suggested users
      const suggestions = await profileService.getSuggestedUsers()
      console.log('Raw suggestions from API:', suggestions)
      
      // Normalize the response data to handle _id vs id mismatch
      const normalizedSuggestions = suggestions.map(user => {
        const userId = user._id || user.id || user.userId
        console.log('Processing user:', user.name, 'with ID:', userId, 'type:', typeof userId)
        
        return {
          id: userId,
          name: user.name,
          username: user.username,
          bio: user.bio || '',
          profileImage: user.avatar || user.profileImage || '',
          isFollowing: user.isFollowing || false
        }
      }).filter(user => user.id) // Filter out users without valid IDs
      
      console.log('Normalized suggestions:', normalizedSuggestions)
      setSuggestions(normalizedSuggestions)
      
      // Initialize following state
      const followingIds = new Set()
      normalizedSuggestions.forEach(user => {
        if (user.isFollowing) {
          followingIds.add(user.id)
        }
      })
      setFollowing(followingIds)
    } catch (err) {
      console.error('Error fetching friend suggestions:', err)
      setError('Failed to load friend suggestions. Please try again later.')
      
      // Fallback to mock data when API fails
      const mockSuggestions = [
        {
          id: '1',
          name: 'Alex Chen',
          username: 'alexchen',
          bio: 'Computer Science student passionate about machine learning and coffee.',
          profileImage: '',
          isFollowing: false
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          username: 'sarahj',
          bio: 'Medical student sharing study tips and productivity hacks.',
          profileImage: '',
          isFollowing: false
        },
        {
          id: '3',
          name: 'Michael Park',
          username: 'mpark',
          bio: 'Physics enthusiast exploring quantum computing and mathematics.',
          profileImage: '',
          isFollowing: false
        }
      ]
      setSuggestions(mockSuggestions)
    } finally {
      setLoading(false)
    }
  }

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ friends: [], posts: [] })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use profileService for user search
      const friendsResponse = await profileService.searchProfiles(searchQuery)
      
      // Normalize the response data to handle _id vs id mismatch
      const normalizedFriends = friendsResponse.profiles.map(user => ({
        id: user._id || user.id,
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        profileImage: user.profileImage || '',
        isFollowing: user.isFollowing || false
      }))
      
      // For posts, use the postService searchPosts function
      let postsResponse = { posts: [] }
      try {
        postsResponse = await postService.searchPosts(searchQuery, 1, 10)
      } catch (postErr) {
        console.warn('Posts search failed, using empty results:', postErr)
      }

      setSearchResults({
        friends: normalizedFriends,
        posts: postsResponse.posts || []
      })
    } catch (err) {
      console.error('Error searching:', err)
      setError('Failed to search. Please try again later.')
      
      // Fallback to mock data when API fails
      setSearchResults({
        friends: searchQuery ? [
          {
            id: '4',
            name: 'Search Result User',
            username: 'searchuser',
            bio: 'This is a mock search result',
            profileImage: '',
            isFollowing: false
          }
        ] : [],
        posts: searchQuery ? [
          {
            id: '1',
            content: `Mock post containing "${searchQuery}"`,
            author: {
              name: 'Mock Author',
              username: 'mockauthor'
            },
            timestamp: new Date().toISOString()
          }
        ] : []
      })
    } finally {
      setLoading(false)
    }
  }

  // Trigger search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle follow/unfollow functionality
  const handleFollowToggle = async (userId) => {
    const isCurrentlyFollowing = following.has(userId)
    
    // Validate userId before proceeding
    if (!userId) {
      console.error('Invalid userId provided to handleFollowToggle:', userId)
      setError('Invalid user ID. Please try again.')
      return
    }
    
    // Log the ID format for debugging
    console.log('handleFollowToggle called with userId:', userId, 'type:', typeof userId)
    
    try {
      // Use profileService with correct endpoints
      if (isCurrentlyFollowing) {
        await profileService.unfollowUser(userId)
      } else {
        await profileService.followUser(userId)
      }

      // Update local state
      setFollowing(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyFollowing) {
          newSet.delete(userId)
        } else {
          newSet.add(userId)
        }
        return newSet
      })

      // Update suggestions if the user is in the suggestions list
      setSuggestions(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        )
      )

      // Update search results if the user is in the search results
      setSearchResults(prev => ({
        ...prev,
        friends: prev.friends.map(user =>
          user.id === userId
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        )
      }))
    } catch (err) {
      console.error('Error toggling follow:', err)
      
      // Provide more descriptive error messages
      if (err.status === 404) {
        setError('User profile not found. The user may not have created a profile yet.')
      } else if (err.status === 403) {
        setError('Unable to follow this user. They may have restricted who can follow them.')
      } else if (err.status === 400) {
        setError(err.message || 'Invalid follow operation. You may already be following this user.')
      } else if (err.message && err.message.includes('Invalid user ID format')) {
        setError('Invalid user ID format. Please refresh the page and try again.')
      } else {
        setError('Failed to update follow status. Please check your connection and try again.')
      }
    }
  }

  return (
    <aside className="friend-suggestions">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search friends or posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {searchQuery ? (
        // Search results view
        <div className="search-results">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <Users size={16} />
              Friends
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FileText size={16} />
              Posts
            </button>
          </div>

          <div className="tab-content">
            {loading ? (
              <div className="loading-state">
                <Loader size={20} className="spinner" />
                <span>Searching...</span>
              </div>
            ) : error ? (
              <div className="error-state">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            ) : activeTab === 'friends' ? (
              <div className="results-list">
                {searchResults.friends.length === 0 ? (
                  <div className="empty-state">
                    <Users size={24} />
                    <span>No friends found</span>
                  </div>
                ) : (
                  searchResults.friends.map(user => (
                    <FriendSuggestionItem
                      key={user.id}
                      user={user}
                      isFollowing={following.has(user.id)}
                      onFollowToggle={() => handleFollowToggle(user.id)}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="results-list">
                {searchResults.posts.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={24} />
                    <span>No posts found</span>
                  </div>
                ) : (
                  searchResults.posts.map(post => (
                    <PostSearchResult key={post.id} post={post} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Friend suggestions view
        <div className="suggestions-section">
          <div className="section-header">
            <Users size={20} />
            <h3>Suggested Friends</h3>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <Loader size={20} className="spinner" />
              <span>Loading suggestions...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : (
            <div className="suggestions-list">
              {suggestions.length === 0 ? (
                <div className="empty-state">
                  <Users size={24} />
                  <span>No suggestions available</span>
                </div>
              ) : (
                suggestions.map(user => (
                  <FriendSuggestionItem
                    key={user.id}
                    user={user}
                    isFollowing={following.has(user.id)}
                    onFollowToggle={() => handleFollowToggle(user.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

// Friend suggestion item component
function FriendSuggestionItem({ user, isFollowing, onFollowToggle }) {
  return (
    <div className="friend-suggestion-item">
      <div className="friend-info">
        <div 
          className="friend-avatar"
          style={user.profileImage ? { backgroundImage: `url(${user.profileImage})` } : undefined}
        />
        <div className="friend-details">
          <div className="friend-name">{user.name}</div>
          <div className="friend-username">@{user.username}</div>
          {user.bio && <div className="friend-bio">{user.bio}</div>}
        </div>
      </div>
      <button
        type="button"
        className={`follow-button ${isFollowing ? 'following' : ''}`}
        onClick={onFollowToggle}
        aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      >
        {isFollowing ? (
          <>
            <UserCheck size={16} />
            Following
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Follow
          </>
        )}
      </button>
    </div>
  )
}

// Post search result component
function PostSearchResult({ post }) {
  return (
    <div className="post-search-result">
      <div className="post-content">
        <div className="post-author">{post.author?.name}</div>
        <div className="post-text">{post.content}</div>
        <div className="post-time">
          {new Date(post.timestamp).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}