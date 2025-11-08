// Test script to verify API endpoints and authentication
const { fetch } = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials (adjust as needed)
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

async function testAPI() {
  console.log('? Testing API Connection and Data Flow...\n');

  // 1. Test user registration/login
  console.log('1. Testing authentication...');
  try {
    // Try to login first
    const loginResponse = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('? Login successful');
      console.log('User data:', loginData.user);
      
      // Test authenticated requests with the user ID as token
      const userId = loginData.user._id;
      
      // 2. Test books API
      console.log('\n2. Testing books API...');
      const booksResponse = await fetch(`${API_BASE_URL}/books`, {
        headers: { 'x-user-id': userId }
      });
      
      if (booksResponse.ok) {
        const booksData = await booksResponse.json();
        console.log('? Books API working');
        console.log(`Found ${booksData.books.length} books for user`);
      } else {
        console.log('? Books API failed:', booksResponse.status);
      }
      
      // 3. Test posts API
      console.log('\n3. Testing posts API...');
      const postsResponse = await fetch(`${API_BASE_URL}/posts`, {
        headers: { 'x-user-id': userId }
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        console.log('? Posts API working');
        console.log(`Found ${postsData.posts.length} posts for user`);
      } else {
        console.log('? Posts API failed:', postsResponse.status);
      }
      
      // 4. Test profiles API
      console.log('\n4. Testing profiles API...');
      const profileResponse = await fetch(`${API_BASE_URL}/profiles/me`, {
        headers: { 'x-user-id': userId }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('? Profiles API working');
        console.log('Profile data:', profileData);
      } else {
        console.log('? Profiles API failed:', profileResponse.status);
      }
      
      // 5. Test public endpoints
      console.log('\n5. Testing public endpoints...');
      const publicBooksResponse = await fetch(`${API_BASE_URL}/books/public`);
      if (publicBooksResponse.ok) {
        const publicBooksData = await publicBooksResponse.json();
        console.log('? Public books API working');
        console.log(`Found ${publicBooksData.books.length} public books`);
      } else {
        console.log('? Public books API failed:', publicBooksResponse.status);
      }
      
      const publicPostsResponse = await fetch(`${API_BASE_URL}/posts/public`);
      if (publicPostsResponse.ok) {
        const publicPostsData = await publicPostsResponse.json();
        console.log('? Public posts API working');
        console.log(`Found ${publicPostsData.posts.length} public posts`);
      } else {
        console.log('? Public posts API failed:', publicPostsResponse.status);
      }
      
    } else {
      console.log('? Login failed:', loginResponse.status);
      const errorData = await loginResponse.json();
      console.log('Error:', errorData);
    }
  } catch (error) {
    console.error('? API test failed:', error.message);
  }
}

// Run the test
testAPI();