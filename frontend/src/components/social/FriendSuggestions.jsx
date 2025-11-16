import { useState, useEffect } from 'react'
import { Search, Users, FileText, UserPlus, UserCheck, Loader, AlertCircle } from 'lucide-react'
import profileService from '../../services/profileService.js'
import postService from '../../services/postService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './FriendSuggestions.css'
import {
  loadGuestFriends,
  saveGuestFriends,
  loadGuestGroups,
  saveGuestGroups,
} from '../../utils/guestConnections.js'

const GUEST_FALLBACK_SUGGESTIONS = [
  {
    id: 'guest_suggestion_1',
    name: 'Kai Ito',
    username: 'kai_focus',
    bio: 'Sharing focus playlists and weekly study recaps.',
    profileImage: '',
  },
  {
    id: 'guest_suggestion_2',
    name: 'Lena Park',
    username: 'lenapark',
    bio: 'Design student rebuilding fundamentals with sketch challenges.',
    profileImage: '',
  },
  {
    id: 'guest_suggestion_3',
    name: 'Noah W',
    username: 'noah_reads',
    bio: 'Morning book club host + accountability buddy.',
    profileImage: '',
  },
]

const getGuestSuggestions = () =>
  GUEST_FALLBACK_SUGGESTIONS.map(suggestion => ({
    ...suggestion,
    isFollowing: false,
  }))

const GROUP_SUGGESTIONS = [
  {
    id: 'focus-lounge',
    name: 'Focus Lounge Pomodoro',
    description: '50-minute deep work sprints with accountability buddies.',
    topic: 'Productivity',
    memberCount: 28,
    image: '',
  },
  {
    id: 'jlpt-crew',
    name: 'JLPT N2 Night Owls',
    description: 'Late-night reading drills and grammar lightning rounds.',
    topic: 'Language',
    memberCount: 17,
    image: '',
  },
  {
    id: 'datastruct-daily',
    name: 'Data Structures Daily',
    description: 'Interview prep walkthroughs and LeetCode warmups.',
    topic: 'Engineering',
    memberCount: 46,
    image: '',
  },
]

export default function FriendSuggestions({
  onFriendFollow = () => {},
  onFriendUnfollow = () => {},
  onGroupJoin = () => {},
}) {
  const { user } = useAuth()
  const isGuest = Boolean(user?.isGuest)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  const [suggestions, setSuggestions] = useState([])
  const [searchResults, setSearchResults] = useState({ friends: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [following, setFollowing] = useState(new Set())
  const [guestFriendProfiles, setGuestFriendProfiles] = useState(() => loadGuestFriends())
  const [groupSuggestions] = useState(() => GROUP_SUGGESTIONS)
  const [guestGroupProfiles, setGuestGroupProfiles] = useState(() => loadGuestGroups())
  const [joinedGroups, setJoinedGroups] = useState(
    () => new Set(loadGuestGroups().map(group => group.id)),
  )

  // Fetch suggested friends on component mount
  useEffect(() => {
    if (isGuest) {
      const storedFriends = loadGuestFriends()
      setGuestFriendProfiles(storedFriends)
      setFollowing(new Set(storedFriends.map(friend => friend.id)))
      const storedGroups = loadGuestGroups()
      setGuestGroupProfiles(storedGroups)
      setJoinedGroups(new Set(storedGroups.map(group => group.id)))
      setSuggestions(getGuestSuggestions())
      setLoading(false)
      setError(null)
      return
    }
    setGuestFriendProfiles([])
    setGuestGroupProfiles([])
    setJoinedGroups(new Set())
    fetchFriendSuggestions()
  }, [isGuest])

  // Fetch friend suggestions from API
  const fetchFriendSuggestions = async () => {
    if (isGuest) {
      return
    }

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

  const handleJoinGroup = groupId => {
    const targetGroup = groupSuggestions.find(group => group.id === groupId)
    if (!targetGroup || joinedGroups.has(groupId)) {
      return
    }

    const groupPayload = {
      id: targetGroup.id,
      name: targetGroup.name,
      memberCount: targetGroup.memberCount,
      description: targetGroup.description,
      image: targetGroup.image,
      topic: targetGroup.topic,
    }

    if (isGuest) {
      const filtered = guestGroupProfiles.filter(group => group.id !== groupId)
      const nextGroups = [...filtered, groupPayload]
      setGuestGroupProfiles(nextGroups)
      saveGuestGroups(nextGroups)
      setJoinedGroups(new Set(nextGroups.map(group => group.id)))
      onGroupJoin(groupPayload)
      return
    }

    setJoinedGroups(prev => {
      const next = new Set(prev)
      next.add(groupId)
      return next
    })

    onGroupJoin(groupPayload)
  }

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ friends: [], posts: [] })
      return
    }

    if (isGuest) {
      const normalizedQuery = searchQuery.trim().toLowerCase()
      const guestMatches = getGuestSuggestions().filter(user =>
        [user.name, user.username, user.bio].some(field =>
          field?.toLowerCase().includes(normalizedQuery),
        ),
      )
      setSearchResults({
        friends: guestMatches,
        posts: [],
      })
      setError(null)
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
  }, [searchQuery, isGuest])

  // Handle follow/unfollow functionality
  const handleFollowToggle = async userId => {
    const isCurrentlyFollowing = following.has(userId)
    const targetUser =
      suggestions.find(user => user.id === userId) ||
      searchResults.friends.find(user => user.id === userId) ||
      null

    if (!targetUser) {
      setError('Unable to find this learner. Please try again.')
      return
    }

    const updateLocalCollections = () => {
      setFollowing(prev => {
        const next = new Set(prev)
        if (isCurrentlyFollowing) {
          next.delete(userId)
        } else {
          next.add(userId)
        }
        return next
      })

      setSuggestions(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, isFollowing: !isCurrentlyFollowing } : user,
        ),
      )

      setSearchResults(prev => ({
        ...prev,
        friends: prev.friends.map(user =>
          user.id === userId ? { ...user, isFollowing: !isCurrentlyFollowing } : user,
        ),
      }))
    }

    const syncPanels = () => {
      if (isCurrentlyFollowing) {
        onFriendUnfollow(userId)
      } else {
        onFriendFollow({
          id: targetUser.id,
          name: targetUser.name || targetUser.username || 'New friend',
          username: targetUser.username || targetUser.name || '',
          profileImage: targetUser.profileImage || '',
          status: 'online',
          activity: targetUser.bio || 'Ready to study',
        })
      }
    }

    const friendPayload = {
      id: targetUser.id,
      name: targetUser.name || targetUser.username || 'New friend',
      username: targetUser.username || targetUser.name || '',
      profileImage: targetUser.profileImage || '',
      status: 'online',
      activity: targetUser.bio || 'Ready to study',
    }

    if (isGuest) {
      const filtered = guestFriendProfiles.filter(friend => friend.id !== userId)
      const nextProfiles = isCurrentlyFollowing ? filtered : [...filtered, friendPayload]
      setGuestFriendProfiles(nextProfiles)
      saveGuestFriends(nextProfiles)
      updateLocalCollections()
      syncPanels()
      return
    }

    try {
      if (isCurrentlyFollowing) {
        await profileService.unfollowUser(userId)
      } else {
        await profileService.followUser(userId)
      }

      updateLocalCollections()
      syncPanels()
    } catch (err) {
      console.error('Error toggling follow:', err)
      setError(err.message || 'Unable to update follow status. Please try again later.')
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
        <>
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

          <div className="suggestions-section group-suggestions-section">
            <div className="section-header">
              <Users size={20} />
              <h3>Suggested Groups</h3>
            </div>
            <div className="suggestions-list">
              {groupSuggestions.map(group => (
                <GroupSuggestionItem
                  key={group.id}
                  group={group}
                  isJoined={joinedGroups.has(group.id)}
                  onJoin={() => handleJoinGroup(group.id)}
                />
              ))}
            </div>
          </div>
        </>
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

function GroupSuggestionItem({ group, isJoined, onJoin }) {
  const initials = group.name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="group-suggestion-item">
      <div className="group-info">
        <div
          className="group-avatar"
          style={group.image ? { backgroundImage: `url(${group.image})` } : undefined}
        >
          {!group.image && <span>{initials || '?'}</span>}
        </div>
        <div className="group-details">
          <div className="group-name">{group.name}</div>
          <div className="group-topic">{group.topic}</div>
          <div className="group-meta">{group.memberCount} members</div>
          <p className="group-description">{group.description}</p>
        </div>
      </div>
      <button
        type="button"
        className={`join-button ${isJoined ? 'joined' : ''}`}
        onClick={onJoin}
        disabled={isJoined}
      >
        {isJoined ? 'Joined' : 'Join'}
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
