// Test script for RightPanel component
const puppeteer = require('puppeteer');

async function testRightPanel() {
  console.log('Starting RightPanel component tests...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.container', { timeout: 10000 });
    console.log('? Application loaded successfully');
    
    // Check if RightPanel is present
    const rightPanelExists = await page.$('.friends-panel') !== null;
    if (rightPanelExists) {
      console.log('? RightPanel component is present');
    } else {
      console.log('? RightPanel component not found');
      return;
    }
    
    // Check if the panel is collapsed by default
    const isCollapsed = await page.$eval('.container', el => 
      el.classList.contains('has-sidebar-collapsed')
    );
    console.log(isCollapsed ? '? RightPanel is collapsed by default' : '? RightPanel is expanded by default');
    
    // Expand the panel if it's collapsed
    if (isCollapsed) {
      await page.click('.panel-toggle-btn');
      await page.waitForTimeout(500);
      console.log('? RightPanel expanded successfully');
    }
    
    // Test expanding friends section
    const friendsHeader = await page.$('[aria-controls="friends-section-content"]');
    if (friendsHeader) {
      await friendsHeader.click();
      await page.waitForTimeout(300);
      console.log('? Friends section header clicked');
      
      // Check if friends content is expanded
      const friendsExpanded = await page.$eval('#friends-section-content', el => 
        el.classList.contains('friends-panel__collapsible-content--expanded')
      );
      console.log(friendsExpanded ? '? Friends section expanded' : '? Friends section not expanded');
    }
    
    // Test expanding groups section
    const groupsHeader = await page.$('[aria-controls="groups-section-content"]');
    if (groupsHeader) {
      await groupsHeader.click();
      await page.waitForTimeout(300);
      console.log('? Groups section header clicked');
      
      // Check if groups content is expanded
      const groupsExpanded = await page.$eval('#groups-section-content', el => 
        el.classList.contains('friends-panel__collapsible-content--expanded')
      );
      console.log(groupsExpanded ? '? Groups section expanded' : '? Groups section not expanded');
    }
    
    // Test scrolling functionality in friends section
    const friendsScrollableWrapper = await page.$('#friends-section-content .friends-panel__scrollable-wrapper');
    if (friendsScrollableWrapper) {
      // Get the initial scroll height
      const initialHeight = await page.$eval('#friends-section-content .friends-panel__scrollable-wrapper', el => el.scrollHeight);
      console.log(`? Friends section initial scroll height: ${initialHeight}px`);
      
      // Try to scroll down
      await page.evaluate(() => {
        const wrapper = document.querySelector('#friends-section-content .friends-panel__scrollable-wrapper');
        if (wrapper) wrapper.scrollTop = 100;
      });
      await page.waitForTimeout(300);
      
      // Check if scroll position changed
      const scrollPosition = await page.$eval('#friends-section-content .friends-panel__scrollable-wrapper', el => el.scrollTop);
      console.log(scrollPosition > 0 ? '? Friends section scrolling works' : '? Friends section scrolling not working');
      
      // Check if both online and offline lists are within the same scrollable wrapper
      const onlineList = await page.$('#friends-section-content .friends-panel__subsection:first-child .friends-panel__list');
      const offlineList = await page.$('#friends-section-content .friends-panel__subsection:last-child .friends-panel__list');
      
      if (onlineList && offlineList) {
        // Check if both lists are contained within the same scrollable wrapper
        const onlineListParent = await page.evaluate(el => el.parentElement.parentElement, onlineList);
        const offlineListParent = await page.evaluate(el => el.parentElement.parentElement, offlineList);
        
        const sameWrapper = await page.evaluate((onlineParent, offlineParent) => {
          return onlineParent === offlineParent &&
                 onlineParent.classList.contains('friends-panel__scrollable-wrapper');
        }, onlineListParent, offlineListParent);
        
        console.log(sameWrapper ? '? Online and offline lists share the same scrollable wrapper' : '? Online and offline lists have different wrappers');
        
        // Check if individual lists have overflow: visible (no individual scrollbars)
        const onlineListOverflow = await page.$eval('#friends-section-content .friends-panel__subsection:first-child .friends-panel__list', el =>
          getComputedStyle(el).overflow
        );
        const offlineListOverflow = await page.$eval('#friends-section-content .friends-panel__subsection:last-child .friends-panel__list', el =>
          getComputedStyle(el).overflow
        );
        
        console.log(`? Online list overflow: ${onlineListOverflow}`);
        console.log(`? Offline list overflow: ${offlineListOverflow}`);
        
        const noIndividualScrollbars = onlineListOverflow === 'visible' && offlineListOverflow === 'visible';
        console.log(noIndividualScrollbars ? '? No individual scrollbars on lists' : '? Individual scrollbars detected');
      }
    }
    
    // Check for overlapping elements
    const overlappingElements = await page.evaluate(() => {
      const friendsSection = document.querySelector('#friends-section-content');
      const groupsSection = document.querySelector('#groups-section-content');
      
      if (!friendsSection || !groupsSection) return false;
      
      const friendsRect = friendsSection.getBoundingClientRect();
      const groupsRect = groupsSection.getBoundingClientRect();
      
      // Check if sections overlap
      return !(friendsRect.bottom <= groupsRect.top || groupsRect.bottom <= friendsRect.top);
    });
    
    console.log(overlappingElements ? '? Sections are overlapping' : '? No overlapping detected');
    
    // Check for any console errors
    if (consoleErrors.length > 0) {
      console.log('? Console errors detected:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('? No console errors detected');
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRightPanel();