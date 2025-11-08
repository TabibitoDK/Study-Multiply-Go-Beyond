// Test script to simulate frontend authentication and data flow
// Node.js 18+ has built-in fetch

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:5173';

// Test user credentials
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'testpass123'
};

async function testBackendAPI() {
  console.log('? Testing Backend API...');
  
  try {
    // Test registration
    console.log('\n1. Testing user registration...');
    const registerResponse = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    
    if (registerData.user) {
      console.log('? Registration successful');
      
      // Test login
      console.log('\n2. Testing user login...');
      const loginResponse = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.user) {
        console.log('? Login successful');
        return loginData.user._id; // Return user ID as token
      }
    }
  } catch (error) {
    console.error('? Backend API test failed:', error.message);
  }
  
  return null;
}

async function testDataAPIs(token) {
  console.log('\n? Testing Data APIs...');
  
  if (!token) {
    console.log('? No token available, skipping data API tests');
    return;
  }
  
  try {
    // Test books API
    console.log('\n3. Testing books API...');
    const booksResponse = await fetch(`${API_BASE}/books`, {
      headers: { 'x-user-id': token }
    });
    
    if (booksResponse.ok) {
      const booksData = await booksResponse.json();
      console.log('? Books API response:', booksData);
    } else {
      console.log('? Books API failed:', booksResponse.status);
    }
    
    // Test posts API
    console.log('\n4. Testing posts API...');
    const postsResponse = await fetch(`${API_BASE}/posts`, {
      headers: { 'x-user-id': token }
    });
    
    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      console.log('? Posts API response:', postsData);
    } else {
      console.log('? Posts API failed:', postsResponse.status);
    }
    
    // Test creating a book
    console.log('\n5. Testing book creation...');
    const createBookResponse = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': token
      },
      body: JSON.stringify({
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book for debugging',
        tags: ['test', 'debugging']
      })
    });
    
    if (createBookResponse.ok) {
      const createdBook = await createBookResponse.json();
      console.log('? Book creation successful:', createdBook);
    } else {
      console.log('? Book creation failed:', createBookResponse.status);
      const errorData = await createBookResponse.json();
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.error('? Data API test failed:', error.message);
  }
}

async function testFrontendAccess() {
  console.log('\n? Testing Frontend Access...');
  
  try {
    // Test if frontend is accessible
    const response = await fetch(FRONTEND_BASE);
    console.log('? Frontend accessible, status:', response.status);
    
    // Test login page directly
    const loginPageResponse = await fetch(`${FRONTEND_BASE}/login`);
    console.log('? Login page accessible, status:', loginPageResponse.status);
    
  } catch (error) {
    console.error('? Frontend access test failed:', error.message);
  }
}

async function runTests() {
  console.log('? Starting Complete User Flow Test\n');
  
  // Test frontend access
  await testFrontendAccess();
  
  // Test backend authentication
  const token = await testBackendAPI();
  
  // Test data APIs with authentication
  await testDataAPIs(token);
  
  console.log('\n? Test Complete');
}

runTests().catch(console.error);