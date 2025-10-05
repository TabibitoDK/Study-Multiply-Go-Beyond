import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import PostCard from './PostCard'
import PostModal from './PostModal'
import { Plus } from 'lucide-react'

const KEY = 'smgb-social-posts-v1'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? [] } catch { return [] } }
const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }

export default function SocialPage() {
  const [posts, setPosts] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const s = load()
    if (s.length === 0) {
      const demo = [{
        id: crypto.randomUUID(),
        authorName: 'Nickname',
        authorHandle: 'username',
        text: 'Finished 2 Pomodoros of calculus. Chain rule finally clicked.',
        book: 'Stewart Calculus 8e',
        duration: '50m',
        subject: 'Calculus',
        images: [null, null],
        createdAt: dayjs().subtract(1, 'day').toISOString(),
      }]
      setPosts(demo)
      save(demo)
    } else setPosts(s)
  }, [])

  useEffect(() => { save(posts) }, [posts])

  function addPost(post) {
    setPosts([post, ...posts])
  }

  return (
    <div className="social-wrap">
      <div className="feed">
        {posts.map(p => <PostCard key={p.id} post={p} />)}
      </div>

      <button className="fab" onClick={() => setOpen(true)} title="Add new post">
        <Plus size={28} />
      </button>

      <PostModal open={open} onClose={() => setOpen(false)} onSubmit={addPost} />
    </div>
  )
}
