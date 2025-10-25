import postsData from '../data/posts.json'

export const posts = postsData;

export function sortPosts(data = posts) {
  return [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getPosts() {
  return sortPosts();
}

export function getPostsByUser(userId) {
  return sortPosts(posts.filter(post => post.userId === userId));
}
