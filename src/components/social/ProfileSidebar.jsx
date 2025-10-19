import { User, Settings } from 'lucide-react'
import './ProfileSidebar.css'

export default function ProfileSidebar({ user, onNavigateToProfile }) {
  if (!user) return null

  return (
    <aside className="profile-sidebar">
      <div className="profile-sidebar-card">
        <button
          type="button"
          className="profile-sidebar-link"
          onClick={onNavigateToProfile}
        >
          <div className="profile-sidebar-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className="profile-sidebar-info">
            <h3 className="profile-sidebar-name">{user.name}</h3>
            <p className="profile-sidebar-username">@{user.username}</p>
          </div>
        </button>

        <div className="profile-sidebar-stats">
          <div className="stat-box">
            <span className="stat-value">{user.posts || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{user.followers || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{user.following || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        <button
          type="button"
          className="profile-sidebar-settings"
          onClick={onNavigateToProfile}
        >
          <Settings size={18} />
          View Profile
        </button>
      </div>
    </aside>
  )
}
