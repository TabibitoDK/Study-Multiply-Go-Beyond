import { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { Edit3, Globe, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './Profile.css'
import PostCard from '../components/social/PostCard.jsx'
import PostModal from '../components/social/PostModal.jsx'
import ProfileEditModal from '../components/ProfileEditModal.jsx'
import profileService from '../services/profileService.js'
import postService from '../services/postService.js'
import { useI18nFormats } from '../lib/i18n-format.js'
import { useAuth } from '../context/AuthContext.jsx'

const GOALS_STORAGE_KEY = 'smgb-user-goals-v1'

export default function Profile({
  profileId = null,
  currentUserId = null,
  posts: postsProp,
  onCreatePost,
  onSelectProfile,
}) {
  const { t } = useTranslation()
  const { formatDate, formatNumber } = useI18nFormats()
  
  const [resolvedProfile, setResolvedProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState([])
  
  // Determine if this is the current user's profile
  const isCurrentUser = resolvedProfile && currentUserId && resolvedProfile.id === currentUserId
  const joinedDate = resolvedProfile ? dayjs(resolvedProfile.joined) : dayjs()
  const tags = resolvedProfile && Array.isArray(resolvedProfile.tags) ? resolvedProfile.tags : []

  const defaultGoals = useMemo(
    () => [
      { text: t('profile.defaults.goal1', { defaultValue: 'Graduate with honors' }), isPublic: true },
      { text: t('profile.defaults.goal2', { defaultValue: 'Master React' }), isPublic: true },
      { text: t('profile.defaults.goal3', { defaultValue: 'Build 5 projects' }), isPublic: true },
    ],
    [t],
  )
  const joinedLabel = joinedDate.isValid()
    ? formatDate(joinedDate.toDate(), { year: 'numeric', month: 'long' })
    : resolvedProfile.joined

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalType, setEditModalType] = useState(null)
  const [editModalValue, setEditModalValue] = useState(null)

  const [bio, setBio] = useState('')
  const [bioPrivacy, setBioPrivacy] = useState(true)
  const [interests, setInterests] = useState([])
  const [goals, setGoals] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(GOALS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
      // Return default goals if none exist
      return defaultGoals
    } catch {
      return defaultGoals
    }
  })
  const { user: authUser } = useAuth()

  const buildFallbackProfile = () => {
    const fallbackId = profileId || currentUserId || authUser?._id || authUser?.id || null
    const fallbackName =
      authUser?.username ||
      authUser?.name ||
      (authUser?.email ? authUser.email.split('@')[0] : null) ||
      'New Student'

    return {
      id: fallbackId,
      userId: fallbackId,
      username: fallbackName,
      name: fallbackName,
      bio: '',
      bioPrivacy: true,
      profileImage: authUser?.profileImage || '',
      backgroundImage: authUser?.backgroundImage || '',
      location: authUser?.location || '',
      joined: authUser?.createdAt || new Date().toISOString(),
      tags: [],
      stats: { booksRead: 0, studyStreak: 0, totalStudyHours: 0 },
      followers: 0,
      following: 0,
      followerIds: [],
      followingIds: [],
      posts: 0,
    }
  }

  // Fetch profile and posts data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        
        const viewingOwnProfile = !profileId || profileId === currentUserId
        // Determine which profile to fetch
        let profileData
        if (profileId) {
          profileData = await profileService.getProfileById(profileId)
        } else if (currentUserId) {
          profileData = await profileService.getProfileById(currentUserId)
        } else {
          // Fallback to current user's profile
          profileData = await profileService.getCurrentUserProfile()
        }

        if (!profileData) {
          if (viewingOwnProfile) {
            profileData = buildFallbackProfile()
          } else {
            setResolvedProfile(null)
            setPosts([])
            setError('Profile not found. Please check the link and try again.')
            return
          }
        }
        
        setResolvedProfile(profileData)
        
        // Initialize state with profile data
        setBio(profileData.bio || '')
        setBioPrivacy(profileData.bioPrivacy !== false) // Default to true
        setInterests(
          Array.isArray(profileData.tags)
            ? profileData.tags.map(tag => ({ text: tag, isPublic: true }))
            : []
        )
        
        // Fetch posts for this profile
        const postsData = Array.isArray(postsProp)
          ? postsProp
          : profileData?.id
            ? await postService.getPostsByUser(profileData.id)
            : []
        
        setPosts(postsData)
        setError(null)
      } catch (err) {
        console.error('Error fetching profile data:', err)
        setError('Failed to load profile. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [profileId, currentUserId, postsProp, authUser])

  // Refresh posts after creating a new post
  const refreshPosts = async () => {
    if (!resolvedProfile?.id) return
    
    try {
      const postsData = await postService.getPostsByUser(resolvedProfile.id)
      setPosts(postsData)
    } catch (err) {
      console.error('Error refreshing posts:', err)
      setError('Failed to refresh posts. Please try again later.')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
    } catch {}
  }, [goals])

  async function handleSubmit(draft) {
    try {
      if (typeof onCreatePost === "function") {
        onCreatePost(draft)
      } else {
        // Create post via API if no handler provided
        await postService.createPost(draft)
        await refreshPosts()
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post. Please try again.')
    }
  }

  function openEditModal(type, value) {
    setEditModalType(type)
    setEditModalValue(value)
    setEditModalOpen(true)
  }

  async function handleEditSave(data) {
    try {
      if (editModalType === 'bio') {
        setBio(data.text)
        setBioPrivacy(data.isPublic)
        await profileService.updateBio({
          text: data.text,
          isPublic: data.isPublic
        })
      } else if (editModalType === 'interests') {
        setInterests(data)
        await profileService.updateInterests(data)
      } else if (editModalType === 'goals') {
        setGoals(data)
        await profileService.updateGoals(data)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    }
  }

  // Handle loading and error states
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn">Retry</button>
        </div>
      </div>
    )
  }

  if (!resolvedProfile) {
    return (
      <div className="profile-container">
        <div className="error-container">
          <p>Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-header-left">
          <div className="profile-avatar">
            {resolvedProfile.profileImage && (
              <img
                src={resolvedProfile.profileImage}
                alt={`${resolvedProfile.name} avatar`}
                loading="lazy"
              />
            )}
          </div>
          <div className="profile-info">
            <h2>{resolvedProfile.name}</h2>
            <p>@{resolvedProfile.username}</p>
            <div className="profile-meta">
              {resolvedProfile.location && <span>{resolvedProfile.location}</span>}
              {resolvedProfile.joined && (
                <span>
                  {t('profile.header.joined', {
                    defaultValue: 'Joined {{date}}',
                    date: joinedLabel,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-stats-inline">
          <div className="stat-item">
            <span className="profile-stat-value">
              {formatNumber(resolvedProfile.followers ?? 0)}
            </span>
            <span className="profile-stat-label">
              {t('profile.header.stats.followers', { defaultValue: 'Followers' })}
            </span>
          </div>
          <div className="stat-item">
            <span className="profile-stat-value">
              {formatNumber(resolvedProfile.following ?? 0)}
            </span>
            <span className="profile-stat-label">
              {t('profile.header.stats.following', { defaultValue: 'Following' })}
            </span>
          </div>
          <div className="stat-item">
            <span className="profile-stat-value">
              {formatNumber(resolvedProfile.posts ?? posts.length)}
            </span>
            <span className="profile-stat-label">
              {t('profile.header.stats.posts', { defaultValue: 'Posts' })}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="edit-btn"
          onClick={() => {
            if (!isCurrentUser && typeof onSelectProfile === "function") {
              onSelectProfile(currentUserId)
            }
          }}
          disabled={isCurrentUser}
        >
          {isCurrentUser
            ? t('profile.actions.current', { defaultValue: 'Your Profile' })
            : t('profile.actions.viewMine', { defaultValue: 'View My Profile' })}
        </button>
      </div>

      <hr className="divider" />

      <div className="profile-content-3col">
        <div className="profile-left-column">
          <div className="card">
            <div className="card-header">
              <h3>{t('profile.sections.bio', { defaultValue: 'Bio' })}</h3>
              {isCurrentUser && (
                <button
                  type="button"
                  className="edit-icon-btn"
                  title={t('profile.sections.bioEdit', { defaultValue: 'Edit bio' })}
                  onClick={() => openEditModal('bio', bio)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div className="bio-section">
              <p className="profile-about">
                {bio || t('profile.bio.empty', { defaultValue: 'No bio yet.' })}
              </p>
              {isCurrentUser && (
                <span className={`privacy-badge ${bioPrivacy ? 'public' : 'private'}`}>
                  {bioPrivacy ? (
                    <>
                      <Globe size={14} />
                      {t('profile.privacy.public', { defaultValue: 'Public' })}
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      {t('profile.privacy.private', { defaultValue: 'Private' })}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>{t('profile.sections.interests', { defaultValue: 'Interests' })}</h3>
              {isCurrentUser && (
                <button
                  type="button"
                  className="edit-icon-btn"
                  title={t('profile.sections.interestsEdit', { defaultValue: 'Edit interests' })}
                  onClick={() => openEditModal('interests', interests)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div className="profile-tags">
              {interests.filter(i => isCurrentUser || i.isPublic).map((interest, index) => (
                <span key={index} className="profile-tag">
                  {interest.text}
                  {isCurrentUser && (
                    <span
                      className={`privacy-icon ${interest.isPublic ? 'public' : 'private'}`}
                      title={
                        interest.isPublic
                          ? t('profile.privacy.public', { defaultValue: 'Public' })
                          : t('profile.privacy.private', { defaultValue: 'Private' })
                      }
                    >
                      {interest.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    </span>
                  )}
                </span>
              ))}
              {interests.filter(i => isCurrentUser || i.isPublic).length === 0 && (
                <span className="profile-tag">
                  {t('profile.interests.empty', { defaultValue: 'No interests yet' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-middle-column">
          <div className="profile-posts-header">
            <h3>{t('profile.sections.posts', { defaultValue: 'Recent Posts' })}</h3>
          </div>

          <div className="profile-post-list">
            {isCurrentUser && (
              <article className="post create-post-card">
                <h4>{t('profile.posts.shareTitle', { defaultValue: 'Share an update' })}</h4>
                <p>
                  {t('profile.posts.shareSubtitle', {
                    defaultValue: 'Let others know what you are working on.',
                  })}
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  {t('profile.posts.shareButton', { defaultValue: 'Create Post' })}
                </button>
              </article>
            )}
            {posts.length === 0 && (
              <div className="profile-empty">
                {t('profile.posts.empty', { defaultValue: 'No posts yet.' })}
              </div>
            )}
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onSelectProfile={onSelectProfile}
              />
            ))}
          </div>
        </div>

        <div className="profile-right-column">
          <div className="card">
            <div className="card-header">
              <h3>{t('profile.sections.goals', { defaultValue: 'Goals' })}</h3>
              {isCurrentUser && (
                <button
                  type="button"
                  className="edit-icon-btn"
                  title={t('profile.sections.goalsEdit', { defaultValue: 'Edit goals' })}
                  onClick={() => openEditModal('goals', goals)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div className="profile-tags">
              {goals.filter(g => isCurrentUser || g.isPublic).map((goal, index) => (
                <span key={index} className="profile-tag">
                  {goal.text}
                  {isCurrentUser && (
                    <span
                      className={`privacy-icon ${goal.isPublic ? 'public' : 'private'}`}
                      title={
                        goal.isPublic
                          ? t('profile.privacy.public', { defaultValue: 'Public' })
                          : t('profile.privacy.private', { defaultValue: 'Private' })
                      }
                    >
                      {goal.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    </span>
                  )}
                </span>
              ))}
              {goals.filter(g => isCurrentUser || g.isPublic).length === 0 && (
                <span className="profile-tag">
                  {t('profile.goals.empty', { defaultValue: 'No goals yet' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <PostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProfileEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        type={editModalType}
        initialValue={editModalValue}
      />
    </div>
  )
}
