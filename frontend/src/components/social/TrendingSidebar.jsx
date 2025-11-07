import { useState } from 'react'
import { Search, TrendingUp, Hash } from 'lucide-react'
import './TrendingSidebar.css'

const TRENDING_TAGS = [
  { tag: 'ActiveRecall', posts: 1580 },
  { tag: 'StudyWithMe', posts: 1234 },
  { tag: 'ExamPrep', posts: 997 },
  { tag: 'DeepWorkSessions', posts: 812 },
  { tag: 'FlashcardFriday', posts: 645 },
]

const TRENDING_SEARCHES = [
  'How to build a spaced repetition schedule',
  'Best study planners for college',
  'Techniques to improve active recall',
  'Tips for balancing study and rest',
]

export default function TrendingSidebar() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className="trending-sidebar">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="trending-section">
        <div className="section-header">
          <TrendingUp size={20} />
          <h3>Trending Tags</h3>
        </div>
        <div className="trending-list">
          {TRENDING_TAGS.map((item, index) => (
            <button key={index} type="button" className="trending-item">
              <div className="trending-item-content">
                <Hash size={16} className="hash-icon" />
                <div className="trending-text">
                  <span className="trending-tag">{item.tag}</span>
                  <span className="trending-count">{item.posts.toLocaleString()} posts</span>
                </div>
              </div>
              <span className="trending-rank">#{index + 1}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="trending-section">
        <div className="section-header">
          <Search size={20} />
          <h3>Popular Searches</h3>
        </div>
        <div className="trending-list">
          {TRENDING_SEARCHES.map((search, index) => (
            <button key={index} type="button" className="search-item">
              <Search size={14} className="search-item-icon" />
              <span className="search-text">{search}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
