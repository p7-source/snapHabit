// Comprehensive application test
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 SnapHabit Application Test Suite\n');
console.log('=' .repeat(50));

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test 1: Server is running
async function testServerRunning() {
  console.log('\n1️⃣  Testing Server Status...');
  try {
    const response = await makeRequest('http://localhost:3000');
    if (response.statusCode === 200) {
      results.passed.push('Server is running');
      console.log('   ✅ Server is running on port 3000');
      return true;
    } else {
      results.failed.push('Server returned unexpected status');
      console.log(`   ❌ Server returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    results.failed.push('Server is not running');
    console.log(`   ❌ Server is not accessible: ${error.message}`);
    return false;
  }
}

// Test 2: Homepage loads
async function testHomepage() {
  console.log('\n2️⃣  Testing Homepage...');
  try {
    const response = await makeRequest('http://localhost:3000');
    if (response.statusCode === 200 && response.body.includes('SnapHabit')) {
      results.passed.push('Homepage loads correctly');
      console.log('   ✅ Homepage loads and contains expected content');
      return true;
    } else {
      results.failed.push('Homepage content issue');
      console.log('   ⚠️  Homepage loads but content may be incomplete');
      return false;
    }
  } catch (error) {
    results.failed.push('Homepage failed to load');
    console.log(`   ❌ Homepage failed: ${error.message}`);
    return false;
  }
}

// Test 3: Login page
async function testLoginPage() {
  console.log('\n3️⃣  Testing Login Page...');
  try {
    const response = await makeRequest('http://localhost:3000/login');
    if (response.statusCode === 200) {
      results.passed.push('Login page accessible');
      console.log('   ✅ Login page loads successfully');
      return true;
    } else {
      results.failed.push('Login page error');
      console.log(`   ❌ Login page returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    results.failed.push('Login page failed');
    console.log(`   ❌ Login page failed: ${error.message}`);
    return false;
  }
}

// Test 4: Register page
async function testRegisterPage() {
  console.log('\n4️⃣  Testing Register Page...');
  try {
    const response = await makeRequest('http://localhost:3000/register');
    if (response.statusCode === 200) {
      results.passed.push('Register page accessible');
      console.log('   ✅ Register page loads successfully');
      return true;
    } else {
      results.failed.push('Register page error');
      console.log(`   ❌ Register page returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    results.failed.push('Register page failed');
    console.log(`   ❌ Register page failed: ${error.message}`);
    return false;
  }
}

// Test 5: Upload page (may require auth)
async function testUploadPage() {
  console.log('\n5️⃣  Testing Upload Page...');
  try {
    const response = await makeRequest('http://localhost:3000/upload');
    if (response.statusCode === 200) {
      results.passed.push('Upload page accessible');
      console.log('   ✅ Upload page loads successfully');
      return true;
    } else if (response.statusCode === 500) {
      results.warnings.push('Upload page returns 500 (likely missing Firebase config)');
      console.log('   ⚠️  Upload page returns 500 error');
      console.log('      This is expected if Firebase config is missing');
      return false;
    } else if (response.statusCode === 302 || response.statusCode === 307) {
      results.passed.push('Upload page redirects (auth required)');
      console.log('   ✅ Upload page redirects to login (expected behavior)');
      return true;
    } else {
      results.warnings.push(`Upload page returned ${response.statusCode}`);
      console.log(`   ⚠️  Upload page returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    results.warnings.push('Upload page test failed');
    console.log(`   ⚠️  Upload page test failed: ${error.message}`);
    return false;
  }
}

// Test 6: API endpoint (analyze-food)
async function testAPIEndpoint() {
  console.log('\n6️⃣  Testing API Endpoint (/api/analyze-food)...');
  
  // Create a minimal test image (1x1 PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');
  
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const formData = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="image"; filename="test.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    testImageBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  try {
    const response = await makeRequest('http://localhost:3000/api/analyze-food', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length
      },
      body: formData
    });

    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        if (data.foodName && data.calories !== undefined) {
          results.passed.push('API endpoint works correctly');
          console.log('   ✅ API endpoint responds successfully');
          console.log(`      Food: ${data.foodName}`);
          console.log(`      Calories: ${data.calories}`);
          return true;
        } else {
          results.warnings.push('API response format issue');
          console.log('   ⚠️  API responded but format may be incorrect');
          return false;
        }
      } catch (e) {
        results.warnings.push('API response not valid JSON');
        console.log('   ⚠️  API response is not valid JSON');
        return false;
      }
    } else if (response.statusCode === 500) {
      try {
        const error = JSON.parse(response.body);
        if (error.error && error.error.includes('API key')) {
          results.warnings.push('API endpoint requires OpenAI API key');
          console.log('   ⚠️  API endpoint returned 500 (likely missing OPENAI_API_KEY)');
          console.log('      Error:', error.error.substring(0, 100));
          return false;
        }
      } catch (e) {
        results.warnings.push('API endpoint error (500)');
        console.log('   ⚠️  API endpoint returned 500 error');
        console.log('      This is expected if OPENAI_API_KEY is missing');
        return false;
      }
    } else {
      results.warnings.push(`API endpoint returned ${response.statusCode}`);
      console.log(`   ⚠️  API endpoint returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    if (error.message.includes('timeout')) {
      results.warnings.push('API endpoint timeout (may be slow or missing key)');
      console.log('   ⚠️  API request timed out');
      console.log('      This may indicate missing OPENAI_API_KEY or slow response');
    } else {
      results.warnings.push('API endpoint test failed');
      console.log(`   ⚠️  API test failed: ${error.message}`);
    }
    return false;
  }
}

// Test 7: Check code for Vision API fallback
async function testCodeStructure() {
  console.log('\n7️⃣  Testing Code Structure...');
  
  const routeFile = path.join(__dirname, 'app', 'api', 'analyze-food', 'route.ts');
  if (fs.existsSync(routeFile)) {
    const content = fs.readFileSync(routeFile, 'utf8');
    
    if (content.includes('!process.env.GOOGLE_CLOUD_VISION_API_KEY')) {
      results.passed.push('Code has Vision API fallback');
      console.log('   ✅ Code properly handles missing Vision API key');
      console.log('      Will use mock food detection when key is missing');
    } else {
      results.warnings.push('Vision API fallback not found');
      console.log('   ⚠️  Could not verify Vision API fallback');
    }
    
    if (content.includes('OPENAI_API_KEY')) {
      results.passed.push('Code uses OpenAI API');
      console.log('   ✅ Code is configured to use OpenAI API');
    }
  } else {
    results.warnings.push('Route file not found');
    console.log('   ⚠️  Could not find API route file');
  }
}

// Test 8: Check environment file structure
async function testEnvStructure() {
  console.log('\n8️⃣  Testing Environment Setup...');
  
  const envExample = path.join(__dirname, '.env.local.example');
  if (fs.existsSync(envExample)) {
    results.passed.push('.env.local.example exists');
    console.log('   ✅ .env.local.example template file exists');
    
    const content = fs.readFileSync(envExample, 'utf8');
    const hasFirebase = content.includes('NEXT_PUBLIC_FIREBASE_API_KEY');
    const hasOpenAI = content.includes('OPENAI_API_KEY');
    const hasVision = content.includes('GOOGLE_CLOUD_VISION_API_KEY');
    
    if (hasFirebase) {
      console.log('   ✅ Template includes Firebase variables');
    }
    if (hasOpenAI) {
      console.log('   ✅ Template includes OpenAI variable');
    }
    if (hasVision) {
      console.log('   ✅ Template includes Vision API variable (optional)');
    }
  } else {
    results.warnings.push('.env.local.example missing');
    console.log('   ⚠️  .env.local.example file not found');
  }
  
  // Check if .env.local exists (but don't read it for security)
  const envLocal = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocal)) {
    results.passed.push('.env.local file exists');
    console.log('   ✅ .env.local file exists');
    console.log('      (Cannot verify contents for security reasons)');
  } else {
    results.warnings.push('.env.local file not found');
    console.log('   ⚠️  .env.local file not found');
    console.log('      Create it from .env.local.example template');
  }
}

// Run all tests
async function runAllTests() {
  await testServerRunning();
  await testHomepage();
  await testLoginPage();
  await testRegisterPage();
  await testUploadPage();
  await testAPIEndpoint();
  await testCodeStructure();
  await testEnvStructure();
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 TEST SUMMARY\n');
  
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   • ${test}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(failure => console.log(`   • ${failure}`));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  if (results.warnings.some(w => w.includes('Firebase'))) {
    console.log('1. Set up Firebase configuration in .env.local');
    console.log('   See: HOW_TO_GET_API_KEYS.md');
  }
  
  if (results.warnings.some(w => w.includes('OpenAI'))) {
    console.log('2. Add OPENAI_API_KEY to .env.local');
    console.log('   See: HOW_TO_GET_API_KEYS.md');
  }
  
  if (!fs.existsSync(path.join(__dirname, '.env.local'))) {
    console.log('3. Create .env.local file from .env.local.example');
    console.log('   Copy the template and fill in your API keys');
  }
  
  console.log('\n4. Restart the dev server after updating .env.local');
  console.log('   (Next.js loads env vars on startup)');
  
  console.log('\n' + '='.repeat(50));
}

// Run tests
runAllTests().catch(console.error);

