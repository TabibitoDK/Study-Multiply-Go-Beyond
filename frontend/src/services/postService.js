import api from '../lib/api.js'

// Post service for handling all post-related API calls
export const postService = {
  // Get all posts
  getAllPosts: async () => {
    try {
      const response = await api.get('/posts')
      return response
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  },

  // Get posts by user ID
  getPostsByUser: async (userId) => {
    try {
      const response = await api.get(`/posts/user/${userId}`)
      return response
    } catch (error) {
      console.error('Error fetching user posts:', error)
      throw error
    }
  },

  // Get a single post by ID
  getPostById: async (id) => {
    try {
      const response = await api.get(`/posts/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching post:', error)
      throw error
    }
  },

  // Create a new post
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData)
      return response
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  },

  // Update an existing post
  updatePost: async (id, postData) => {
    try {
      const response = await api.put(`/posts/${id}`, postData)
      return response
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