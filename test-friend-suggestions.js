const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';

// Test users with unique identifiers
const TEST_USERS = {
  user1: {
    username: `testuser1_${Date.now()}`,
    email: `test1_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User One',
    bio: 'I love reading and studying',
    tags: ['reading', 'studying', 'javascript']
  },
  user2: {
    username: `testuser2_${Date.now()}`,
    email: `test2_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User Two',
    bio: 'Programming enthusiast',
    tags: ['programming', 'javascript', 'react']
  },
  user3: {
    username: `testuser3_${Date.now()}`,
    email: `test3_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User Three',
    bio: 'Book lover and coffee addict',
    tags: ['reading', 'books', 'coffee']
  }
};

// Test results tracking
const testResults = {
  userCreation: { success: false, users: [], error: null },
  profileCreation: { success: false, profiles: [], error: null },
  friendSuggestions: { success: false, data: null, error: null },
  userSearch: { success: false, data: null, error: null },
  postSearch: { success: false, data: null, error: null },
  followUnfollow: { success: false, data: null, error: null }
};

// Utility function to log test results
function logTest(testName, success, details) {
  console.log(`\n=== ${testName} ===`);
  console.log(`Status: ${success ? '? PASS' : '? FAIL'}`);
  if (details) {
    console.log('Details:', details);
  }
}

// Helper function to create a user
async function createUser(userData) {
  try {
    const response = await axios.post(`${BASE_URL}/users`, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      preferences: {
        language: 'en',
        theme: 'light'
      }
    });

    if (response.status === 201) {
      return {
        success: true,
        user: response.data.user,
        error: null
      };
    } else {
      return {
        success: false,
        user: null,
        error: `Unexpected status code: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      user: null,
      error: error.response?.data || error.message
    };
  }
}

// Helper function to create a profile
async function createProfile(userId, profileData, authToken) {
  try {
    const response = await axios.post(`${BASE_URL}/profiles`, {
      userId,
      username: profileData.username,
      name: profileData.name,
      bio: profileData.bio,
      tags: profileData.tags,
      privacy: {
        allowFollowers: true,
        showEmail: false,
        showLocation: false
      }
    }, {
      headers: {
        'x-user-id': authToken
      }
    });

    if (response.status === 201) {
      return {
        success: true,
        profile: response.data.profile,
        error: null
      };
    } else {
      return {
        success: false,
        profile: null,
        error: `Unexpected status code: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      profile: null,
      error: error.response?.data || error.message
    };
  }
}

// Helper function to create a test post
async function createPost(userId, postData, authToken) {
  try {
    const response = await axios.post(`${BASE_URL}/posts`, {
      userId,
      content: postData.content,
      visibility: postData.visibility || 'public',
      tags: postData.tags || []
    }, {
      headers: {
        'x-user-id': authToken
      }
    });

    if (response.status === 201) {
      return {
        success: true,
        post: response.data.post,
        error: null
      };
    } else {
      return {
        success: false,
        post: null,
        error: `Unexpected status code: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      post: null,
      error: error.response?.data || error.message
    };
  }
}

// Test 1: Create test users and profiles
async function setupTestUsers() {
  console.log('\n? Setting up test users and profiles...');
  
  const users = [];
  const profiles = [];
  
  for (const [key, userData] of Object.entries(TEST_USERS)) {
    // Create user
    const userResult = await createUser(userData);
    if (!userResult.success) {
      testResults.userCreation.success = false;
      testResults.userCreation.error = `Failed to create user ${key}: ${userResult.error}`;
      logTest('User Creation', false, { error: testResults.userCreation.error });
      return false;
    }
    
    users.push({ key, ...userResult.user });
    
    // Create profile for the user
    const profileResult = await createProfile(
      userResult.user._id,
      userData,
      userResult.user._id
    );
    
    if (!profileResult.success) {
      testResults.profileCreation.success = false;
      testResults.profileCreation.error = `Failed to create profile for ${key}: ${profileResult.error}`;
      logTest('Profile Creation', false, { error: testResults.profileCreation.error });
      return false;
    }
    
    profiles.push({ key, ...profileResult.profile });
  }
  
  testResults.userCreation.success = true;
  testResults.userCreation.users = users;
  testResults.profileCreation.success = true;
  testResults.profileCreation.profiles = profiles;
  
  logTest('User and Profile Creation', true, {
    usersCreated: users.length,
    profilesCreated: profiles.length
  });
  
  return true;
}

// Test 2: Test friend suggestions endpoint
async function testFriendSuggestions() {
  try {
    console.log('\n? Testing friend suggestions endpoint...');
    
    const mainUser = testResults.userCreation.users[0];
    const response = await axios.get(`${BASE_URL}/users/suggestions`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    if (response.status === 200) {
      testResults.friendSuggestions.success = true;
      testResults.friendSuggestions.data = response.data;
      
      logTest('Friend Suggestions', true, {
        suggestionsCount: response.data.suggestions.length,
        suggestions: response.data.suggestions.map(s => ({
          username: s.username,
          name: s.name,
          tags: s.tags
        }))
      });
      return true;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    testResults.friendSuggestions.success = false;
    testResults.friendSuggestions.error = error.response?.data || error.message;
    
    logTest('Friend Suggestions', false, {
      error: testResults.friendSuggestions.error
    });
    return false;
  }
}

// Test 3: Test user search functionality
async function testUserSearch() {
  try {
    console.log('\n? Testing user search functionality...');
    
    const mainUser = testResults.userCreation.users[0];
    
    // Test search by name
    const searchByName = await axios.get(`${BASE_URL}/users/search?q=Test`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    // Test search by bio
    const searchByBio = await axios.get(`${BASE_URL}/users/search?q=reading`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    // Test search with pagination
    const searchWithPagination = await axios.get(`${BASE_URL}/users/search?q=test&page=1&limit=2`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    if (searchByName.status === 200 && searchByBio.status === 200 && searchWithPagination.status === 200) {
      testResults.userSearch.success = true;
      testResults.userSearch.data = {
        searchByName: searchByName.data,
        searchByBio: searchByBio.data,
        searchWithPagination: searchWithPagination.data
      };
      
      logTest('User Search', true, {
        searchByNameResults: searchByName.data.users.length,
        searchByBioResults: searchByBio.data.users.length,
        paginationResults: searchWithPagination.data.users.length,
        pagination: searchWithPagination.data.pagination
      });
      return true;
    } else {
      throw new Error('One or more search requests failed');
    }
  } catch (error) {
    testResults.userSearch.success = false;
    testResults.userSearch.error = error.response?.data || error.message;
    
    logTest('User Search', false, {
      error: testResults.userSearch.error
    });
    return false;
  }
}

// Test 4: Test post search functionality
async function testPostSearch() {
  try {
    console.log('\n? Testing post search functionality...');
    
    const mainUser = testResults.userCreation.users[0];
    
    // Create some test posts
    const post1 = await createPost(mainUser._id, {
      content: 'Learning JavaScript is fun',
      visibility: 'public',
      tags: ['javascript', 'learning']
    }, mainUser._id);
    
    const post2 = await createPost(mainUser._id, {
      content: 'Just finished a great book',
      visibility: 'public',
      tags: ['books', 'reading']
    }, mainUser._id);
    
    if (!post1.success || !post2.success) {
      throw new Error('Failed to create test posts');
    }
    
    // Test search by content
    const searchByContent = await axios.get(`${BASE_URL}/posts/public?search=JavaScript`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    // Test search by tags
    const searchByTags = await axios.get(`${BASE_URL}/posts/public?tags=books`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    if (searchByContent.status === 200 && searchByTags.status === 200) {
      testResults.postSearch.success = true;
      testResults.postSearch.data = {
        searchByContent: searchByContent.data,
        searchByTags: searchByTags.data
      };
      
      logTest('Post Search', true, {
        searchByContentResults: searchByContent.data.posts.length,
        searchByTagsResults: searchByTags.data.posts.length,
        postsFound: searchByContent.data.posts.map(p => ({
          content: p.content.substring(0, 50) + '...',
          tags: p.tags
        }))
      });
      return true;
    } else {
      throw new Error('One or more post search requests failed');
    }
  } catch (error) {
    testResults.postSearch.success = false;
    testResults.postSearch.error = error.response?.data || error.message;
    
    logTest('Post Search', false, {
      error: testResults.postSearch.error
    });
    return false;
  }
}

// Test 5: Test follow/unfollow functionality
async function testFollowUnfollow() {
  try {
    console.log('\n? Testing follow/unfollow functionality...');
    
    const mainUser = testResults.userCreation.users[0];
    const targetUser = testResults.userCreation.users[1];
    const targetProfile = testResults.profileCreation.profiles.find(p => p.key === 'user2');
    
    // Test follow
    const followResponse = await axios.post(`${BASE_URL}/profiles/follow/${targetUser._id}`, {}, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    // Test unfollow
    const unfollowResponse = await axios.delete(`${BASE_URL}/profiles/unfollow/${targetUser._id}`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    // Test follow again to verify it works after unfollow
    const followAgainResponse = await axios.post(`${BASE_URL}/profiles/follow/${targetUser._id}`, {}, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    if (followResponse.status === 200 && unfollowResponse.status === 200 && followAgainResponse.status === 200) {
      testResults.followUnfollow.success = true;
      testResults.followUnfollow.data = {
        follow: followResponse.data,
        unfollow: unfollowResponse.data,
        followAgain: followAgainResponse.data
      };
      
      logTest('Follow/Unfollow', true, {
        followMessage: followResponse.data.message,
        unfollowMessage: unfollowResponse.data.message,
        followAgainMessage: followAgainResponse.data.message
      });
      return true;
    } else {
      throw new Error('One or more follow/unfollow requests failed');
    }
  } catch (error) {
    testResults.followUnfollow.success = false;
    testResults.followUnfollow.error = error.response?.data || error.message;
    
    logTest('Follow/Unfollow', false, {
      error: testResults.followUnfollow.error
    });
    return false;
  }
}

// Test 6: Test error scenarios
async function testErrorScenarios() {
  console.log('\n?? Testing error scenarios...');
  
  const mainUser = testResults.userCreation.users[0];
  const errorTests = [];
  
  // Test 1: Search with empty query
  try {
    const response = await axios.get(`${BASE_URL}/users/search?q=`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    errorTests.push({
      name: 'Empty search query',
      success: false,
      error: `Expected status 400 but got ${response.status}`
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 400) {
      errorTests.push({
        name: 'Empty search query',
        success: true,
        error: null
      });
    } else {
      errorTests.push({
        name: 'Empty search query',
        success: false,
        error: `Expected status 400 but got ${status}`
      });
    }
  }
  
  // Test 2: Follow yourself
  try {
    const response = await axios.post(`${BASE_URL}/profiles/follow/${mainUser._id}`, {}, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    errorTests.push({
      name: 'Follow yourself',
      success: false,
      error: `Expected status 400 but got ${response.status}`
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 400) {
      errorTests.push({
        name: 'Follow yourself',
        success: true,
        error: null
      });
    } else {
      errorTests.push({
        name: 'Follow yourself',
        success: false,
        error: `Expected status 400 but got ${status}`
      });
    }
  }
  
  // Test 3: Unfollow user you're not following
  try {
    const targetUser = testResults.userCreation.users[2];
    const response = await axios.delete(`${BASE_URL}/profiles/unfollow/${targetUser._id}`, {
      headers: {
        'x-user-id': mainUser._id
      }
    });
    
    errorTests.push({
      name: 'Unfollow non-followed user',
      success: false,
      error: `Expected status 400 but got ${response.status}`
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 400) {
      errorTests.push({
        name: 'Unfollow non-followed user',
        success: true,
        error: null
      });
    } else {
      errorTests.push({
        name: 'Unfollow non-followed user',
        success: false,
        error: `Expected status 400 but got ${status}`
      });
    }
  }
  
  // Log error test results
  errorTests.forEach(test => {
    logTest(`Error Test: ${test.name}`, test.success, {
      error: test.error
    });
  });
  
  return errorTests;
}

// Generate comprehensive test report
function generateTestReport(errorTestResults) {
  console.log('\n' + '='.repeat(60));
  console.log('? COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(60));
  
  // Summary
  const allTests = [
    testResults.userCreation.success,
    testResults.profileCreation.success,
    testResults.friendSuggestions.success,
    testResults.userSearch.success,
    testResults.postSearch.success,
    testResults.followUnfollow.success,
    ...errorTestResults.map(r => r.success)
  ];
  
  const passedTests = allTests.filter(Boolean).length;
  const totalTests = allTests.length;
  
  console.log(`\n? OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\n? DETAILED RESULTS:');
  
  console.log('\n1. User Creation:');
  console.log(`   Status: ${testResults.userCreation.success ? '? PASS' : '? FAIL'}`);
  if (testResults.userCreation.success) {
    console.log(`   Users created: ${testResults.userCreation.users.length}`);
  } else {
    console.log(`   Error: ${testResults.userCreation.error}`);
  }
  
  console.log('\n2. Profile Creation:');
  console.log(`   Status: ${testResults.profileCreation.success ? '? PASS' : '? FAIL'}`);
  if (testResults.profileCreation.success) {
    console.log(`   Profiles created: ${testResults.profileCreation.profiles.length}`);
  } else {
    console.log(`   Error: ${testResults.profileCreation.error}`);
  }
  
  console.log('\n3. Friend Suggestions:');
  console.log(`   Status: ${testResults.friendSuggestions.success ? '? PASS' : '? FAIL'}`);
  if (testResults.friendSuggestions.success) {
    console.log(`   Suggestions returned: ${testResults.friendSuggestions.data.suggestions.length}`);
  } else {
    console.log(`   Error: ${testResults.friendSuggestions.error}`);
  }
  
  console.log('\n4. User Search:');
  console.log(`   Status: ${testResults.userSearch.success ? '? PASS' : '? FAIL'}`);
  if (testResults.userSearch.success) {
    console.log(`   Search by name results: ${testResults.userSearch.data.searchByName.users.length}`);
    console.log(`   Search by bio results: ${testResults.userSearch.data.searchByBio.users.length}`);
  } else {
    console.log(`   Error: ${testResults.userSearch.error}`);
  }
  
  console.log('\n5. Post Search:');
  console.log(`   Status: ${testResults.postSearch.success ? '? PASS' : '? FAIL'}`);
  if (testResults.postSearch.success) {
    console.log(`   Search by content results: ${testResults.postSearch.data.searchByContent.posts.length}`);
    console.log(`   Search by tags results: ${testResults.postSearch.data.searchByTags.posts.length}`);
  } else {
    console.log(`   Error: ${testResults.postSearch.error}`);
  }
  
  console.log('\n6. Follow/Unfollow:');
  console.log(`   Status: ${testResults.followUnfollow.success ? '? PASS' : '? FAIL'}`);
  if (testResults.followUnfollow.success) {
    console.log(`   Follow operation: ${testResults.followUnfollow.data.follow.message}`);
    console.log(`   Unfollow operation: ${testResults.followUnfollow.data.unfollow.message}`);
  } else {
    console.log(`   Error: ${testResults.followUnfollow.error}`);
  }
  
  console.log('\n7. Error Scenarios:');
  errorTestResults.forEach(result => {
    console.log(`   ${result.name}: ${result.success ? '? PASS' : '? FAIL'}`);
    if (!result.success) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  // Issues found
  console.log('\n?? ISSUES FOUND:');
  const issues = [];
  
  if (!testResults.userCreation.success) {
    issues.push('User creation failed');
  }
  if (!testResults.profileCreation.success) {
    issues.push('Profile creation failed');
  }
  if (!testResults.friendSuggestions.success) {
    issues.push('Friend suggestions failed');
  }
  if (!testResults.userSearch.success) {
    issues.push('User search failed');
  }
  if (!testResults.postSearch.success) {
    issues.push('Post search failed');
  }
  if (!testResults.followUnfollow.success) {
    issues.push('Follow/unfollow functionality failed');
  }
  
  const failedErrorTests = errorTestResults.filter(r => !r.success);
  if (failedErrorTests.length > 0) {
    issues.push(`${failedErrorTests.length} error scenario test(s) failed`);
  }
  
  if (issues.length === 0) {
    console.log('   No issues found! ?');
  } else {
    issues.forEach(issue => console.log(`   ?? ${issue}`));
  }
  
  // Recommendations
  console.log('\n? RECOMMENDATIONS:');
  if (passedTests === totalTests) {
    console.log('   ? All tests passed! Friend suggestions and search functionality is working correctly.');
    console.log('   ? User creation and profile management is properly implemented.');
    console.log('   ? Follow/unfollow functionality is working as expected.');
    console.log('   ? Error handling is properly implemented.');
  } else {
    console.log('   ? Review failed tests and fix identified issues.');
    console.log('   ? Ensure proper error handling for edge cases.');
    console.log('   ? Verify search algorithms are returning relevant results.');
    console.log('   ? Check friend suggestions logic for accuracy.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('END OF TEST REPORT');
  console.log('='.repeat(60));
}

// Main test execution function
async function runFriendSuggestionsTests() {
  console.log('? Starting Friend Suggestions and Search Functionality Tests...');
  console.log('Backend URL:', BASE_URL);
  
  try {
    // Run setup and core tests
    const setupSuccess = await setupTestUsers();
    if (!setupSuccess) {
      console.error('? Setup failed. Cannot continue with tests.');
      return;
    }
    
    await testFriendSuggestions();
    await testUserSearch();
    await testPostSearch();
    await testFollowUnfollow();
    
    // Run error scenario tests
    const errorTestResults = await testErrorScenarios();
    
    // Generate comprehensive report
    generateTestReport(errorTestResults);
    
  } catch (error) {
    console.error('\n? CRITICAL ERROR DURING TESTING:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
runFriendSuggestionsTests();