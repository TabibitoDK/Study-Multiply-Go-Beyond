import api from '../lib/api.js'

const normalizeId = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (value._id) return value._id.toString()
    if (value.id) return value.id.toString()
    if (typeof value.toString === 'function') return value.toString()
  }
  return null
}

const normalizePost = post => {
  if (!post) return null

  const userRef = post.userId
  const userId = normalizeId(userRef) || normalizeId(post.user) || null

  const commentCount = Array.isArray(post.comments)
    ? post.comments.length
    : typeof post.comments === 'number'
      ? post.comments
      : 0

  const books = Array.isArray(post.books)
    ? post.books
        .map(book => (typeof book === 'string' ? book : normalizeId(book)))
        .filter(Boolean)
    : []

  const author =
    post.author ||
    (userRef && typeof userRef === 'object'
      ? {
          id: userId,
          username: userRef.username || '',
          name: userRef.username || '',
          profileImage: userRef.profileImage || '',
        }
      : null)

  return {
    ...post,
    id: normalizeId(post._id) || normalizeId(post.id) || userId || post.id,
    userId,
    content: post.content || '',
    books,
    likes: typeof post.likes === 'number' ? post.likes : 0,
    comments: commentCount,
    tags: Array.isArray(post.tags) ? post.tags : [],
    timestamp: post.createdAt || post.updatedAt || post.timestamp || new Date().toISOString(),
    visibility: post.visibility || 'public',
    author: author
      ? {
          id: author.id || userId,
          name: author.name || author.username || '',
          username: author.username || author.name || '',
          profileImage: author.profileImage || '',
        }
      : null,
  }
}

const normalizePostList = list => {
  if (!Array.isArray(list)) return []
  return list.map(normalizePost).filter(Boolean)
}

// Post service for handling all post-related API calls
export const postService = {
  // Get all posts
  getAllPosts: async () => {
    try {
      const response = await api.get('/posts/public')
      return normalizePostList(response?.posts ?? response)
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  },

  // Get posts by user ID
  getPostsByUser: async (userId) => {
    try {
      const response = await api.get(`/posts/user/${userId}`)
      return normalizePostList(response?.posts ?? response)
    } catch (error) {
      console.error('Error fetching user posts:', error)
      throw error
    }
  },

  // Get a single post by ID
  getPostById: async (id) => {
    try {
      const response = await api.get(`/posts/${id}`)
      return normalizePost(response)
    } catch (error) {
      console.error('Error fetching post:', error)
      throw error
    }
  },

  // Create a new post
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData)
      return normalizePost(response?.post ?? response)
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  },

  // Update an existing post
  updatePost: async (id, postData) => {
    try {
      const response = await api.put(`/posts/${id}`, postData)
      return normalizePost(response?.post ?? response)
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    }
  },

  // Delete a post
  deletePost: async (id) => {
    try {
      const response = await api.delete(`/posts/${id}`)
      return response
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  },

  // Like a post
  likePost: async (id) => {
    try {
      const response = await api.post(`/posts/${id}/like`)
      return response
    } catch (error) {
      console.error('Error liking post:', error)
      throw error
    }
  },

  // Unlike a post
  unlikePost: async (id) => {
    try {
      const response = await api.delete(`/posts/${id}/like`)
      return response
    } catch (error) {
      console.error('Error unliking post:', error)
      throw error
    }
  },

  // Add a comment to a post
  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, commentData)
      return response
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  },

  // Get comments for a post
  getComments: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`)
      return response
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw error
    }
  },

  // Sort posts by criteria
  sortPosts: async (sortBy = 'latest') => {
    try {
      const response = await api.get(`/posts/sort?by=${sortBy}`)
      return response
    } catch (error) {
      console.error('Error sorting posts:', error)
      throw error
    }
  },

  // Get trending posts
  getTrendingPosts: async () => {
    try {
      const response = await api.get('/posts/trending')
      return response
    } catch (error) {
      console.error('Error fetching trending posts:', error)
      throw error
    }
  }
}

export default postService
