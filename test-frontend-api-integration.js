// Test script to check if frontend is making API calls or using static data
const fs = require('fs');
const path = require('path');

function checkFileForAPICalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for API-related patterns
    const apiPatterns = [
      /api\./g,
      /fetch\s*\(/g,
      /axios\./g,
      /\/api\//g,
      /x-user-id/g,
      /auth_token/g
    ];
    
    const staticDataPatterns = [
      /from\s+['"]\.\.\/data\//g,
      /import.*from\s+['"]\.\.\/data\//g,
      /localStorage\.getItem/g,
      /localStorage\.setItem/g
    ];
    
    const results = {
      file: filePath,
      apiCalls: [],
      staticDataUsage: [],
      hasAPICalls: false,
      hasStaticData: false
    };
    
    apiPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        results.apiCalls.push({
          pattern: pattern.toString(),
          matches: matches.length,
          type: ['api.', 'fetch(', 'axios.', '/api/', 'x-user-id', 'auth_token'][index]
        });
        results.hasAPICalls = true;
      }
    });
    
    staticDataPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        results.staticDataUsage.push({
          pattern: pattern.toString(),
          matches: matches.length,
          type: ['data import', 'data import', 'localStorage'][index]
        });
        results.hasStaticData = true;
      }
    });
    
    return results;
  } catch (error) {
    return { file: filePath, error: error.message };
  }
}

function analyzeFrontendFiles() {
  const frontendDir = path.join(__dirname, 'frontend/src');
  const criticalFiles = [
    'pages/Library.jsx',
    'pages/Profile.jsx',
    'components/social/SocialPage.jsx',
    'lib/books.js',
    'lib/posts.js',
    'lib/profiles.js',
    'lib/api.js',
    'context/AuthContext.jsx'
  ];
  
  console.log('? Analyzing Frontend Files for API Integration...\n');
  
  const results = [];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(frontendDir, file);
    if (fs.existsSync(filePath)) {
      const result = checkFileForAPICalls(filePath);
      results.push(result);
    }
  });
  
  return results;
}

function checkDataFiles() {
  const dataDir = path.join(__dirname, 'frontend/src/data');
  console.log('\n? Checking static data files...');
  
  try {
    const files = fs.readdirSync(dataDir);
    console.log('Static data files found:', files);
    
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
  } catch (error) {
    console.log('Error reading data directory:', error.message);
  }
}

function analyzeLibraryPageSpecifically() {
  const libraryPath = path.join(__dirname, 'frontend/src/pages/Library.jsx');
  console.log('\n? Detailed Analysis of Library.jsx...');
  
  try {
    const content = fs.readFileSync(libraryPath, 'utf8');
    
    // Check specific imports
    const imports = content.match(/import.*from.*['"](.*)['"]/g) || [];
    console.log('Imports found:');
    imports.forEach(imp => console.log(`  ${imp}`));
    
    // Check function calls
    const functionCalls = content.match(/getAllBooks|createBook|updateBook|api\./g) || [];
    console.log('\nFunction calls found:');
    functionCalls.forEach(call => console.log(`  ${call}`));
    
    // Check data initialization
    const dataInit = content.match(/useState\(.*\)/g) || [];
    console.log('\nState initialization:');
    dataInit.forEach(init => console.log(`  ${init}`));
    
  } catch (error) {
    console.log('Error analyzing Library.jsx:', error.message);
  }
}

function runAnalysis() {
  console.log('? Starting Frontend API Integration Analysis\n');
  
  // Analyze critical files
  const results = analyzeFrontendFiles();
  
  console.log('? Analysis Results:');
  results.forEach(result => {
    if (result.error) {
      console.log(`? ${result.file}: ${result.error}`);
    } else {
      console.log(`\n? ${result.file}:`);
      console.log(`  API Calls: ${result.hasAPICalls ? '? Yes' : '? No'}`);
      if (result.apiCalls.length > 0) {
        result.apiCalls.forEach(call => {
          console.log(`    - ${call.type}: ${call.matches} matches`);
        });
      }
      
      console.log(`  Static Data: ${result.hasStaticData ? '? Yes' : '? No'}`);
      if (result.staticDataUsage.length > 0) {
        result.staticDataUsage.forEach(data => {
          console.log(`    - ${data.type}: ${data.matches} matches`);
        });
      }
    }
  });
  
  // Check data files
  checkDataFiles();
  
  // Detailed library analysis
  analyzeLibraryPageSpecifically();
  
  console.log('\n? Analysis Complete');
}

runAnalysis().catch(console.error);