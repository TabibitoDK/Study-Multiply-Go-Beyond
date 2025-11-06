// Simple test script to verify RightPanel functionality
// This would be run in the browser console

// Test 1: Check if RightPanel is rendered
const rightPanel = document.querySelector('.friends-panel');
if (rightPanel) {
  console.log('? RightPanel is rendered');
} else {
  console.error('? RightPanel not found');
}

// Test 2: Check if both sections exist
const friendsSection = document.querySelector('#friends-section-content');
const groupsSection = document.querySelector('#groups-section-content');

if (friendsSection && groupsSection) {
  console.log('? Both friends and groups sections exist');
} else {
  console.error('? One or both sections not found');
}

// Test 3: Check if sections are initially expanded
const isFriendsExpanded = friendsSection.classList.contains('friends-panel__collapsible-content--expanded');
const isGroupsExpanded = groupsSection.classList.contains('friends-panel__collapsible-content--expanded');

if (isFriendsExpanded && isGroupsExpanded) {
  console.log('? Both sections are initially expanded');
} else {
  console.log('? One or both sections are not initially expanded');
}

// Test 4: Test clicking on section headers
const friendsHeader = document.querySelector('[aria-controls="friends-section-content"]');
const groupsHeader = document.querySelector('[aria-controls="groups-section-content"]');

if (friendsHeader && groupsHeader) {
  console.log('? Section headers found');
  
  // Simulate clicking friends header
  friendsHeader.click();
  setTimeout(() => {
    const friendsCollapsed = friendsSection.classList.contains('friends-panel__collapsible-content--collapsed');
    if (friendsCollapsed) {
      console.log('? Friends section can be collapsed');
    } else {
      console.error('? Friends section cannot be collapsed');
    }
    
    // Simulate clicking groups header
    groupsHeader.click();
    setTimeout(() => {
      const groupsCollapsed = groupsSection.classList.contains('friends-panel__collapsible-content--collapsed');
      if (groupsCollapsed) {
        console.log('? Groups section can be collapsed');
      } else {
        console.error('? Groups section cannot be collapsed');
      }
      
      // Test 5: Check if both can be expanded independently
      friendsHeader.click();
      groupsHeader.click();
      setTimeout(() => {
        const bothExpanded = friendsSection.classList.contains('friends-panel__collapsible-content--expanded') && 
                           groupsSection.classList.contains('friends-panel__collapsible-content--expanded');
        if (bothExpanded) {
          console.log('? Both sections can be expanded independently');
        } else {
          console.error('? Sections cannot be expanded independently');
        }
      }, 300);
    }, 300);
  }, 300);
} else {
  console.error('? Section headers not found');
}