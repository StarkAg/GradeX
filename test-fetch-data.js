// Test fetch_data.php endpoint manually
async function testFetchData() {
  try {
    console.log('Testing fetch_data.php endpoint...');
    console.log('URL: https://examcell.srmist.edu.in/tp2/seating/bench/fetch_data.php');
    console.log('');
    
    // Test with a date and session (like the code does)
    const testDate = '24/11/2025'; // Format: DD/MM/YYYY
    const testSession = 'FN'; // Forenoon
    
    console.log(`Testing with date: ${testDate}, session: ${testSession}`);
    console.log('');
    
    // Create form data (like the code does)
    const formData = new URLSearchParams();
    formData.append('dated', testDate);
    formData.append('session', testSession);
    formData.append('submit', 'Submit');
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    
    const response = await fetch('https://examcell.srmist.edu.in/tp2/seating/bench/fetch_data.php', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString(),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Status:', response.status, response.statusText);
    console.log('');
    
    const html = await response.text();
    console.log('Response length:', html.length, 'bytes');
    console.log('Has RA pattern:', /RA\d{10,}/i.test(html));
    console.log('Has table rows:', /<tr/i.test(html));
    
    // Count RA numbers
    const raMatches = html.match(/RA\d{10,}/gi);
    const raCount = raMatches ? raMatches.length : 0;
    console.log('RA numbers found:', raCount);
    
    // Check for specific RA
    const testRA = 'RA2311003012253';
    const containsTestRA = html.includes(testRA);
    console.log(`Contains ${testRA}:`, containsTestRA);
    
    if (containsTestRA) {
      // Find context around the RA
      const raIndex = html.indexOf(testRA);
      const context = html.substring(Math.max(0, raIndex - 100), Math.min(html.length, raIndex + 200));
      console.log('Context around RA:', context.replace(/\s+/g, ' ').substring(0, 150));
    }
    
    // Show first few RA numbers found
    if (raMatches && raMatches.length > 0) {
      console.log('');
      console.log('First 5 RA numbers found:');
      raMatches.slice(0, 5).forEach((ra, i) => console.log(`  ${i + 1}. ${ra}`));
    }
    
    // Check if it's valid data
    if (html.length > 5000 && /RA\d{10,}/i.test(html)) {
      console.log('');
      console.log('✅ fetch_data.php is VALID - contains seating data');
    } else {
      console.log('');
      console.log('❌ fetch_data.php is INVALID - missing data or too small');
      console.log('');
      console.log('Actual response content (first 500 chars):');
      console.log(html.substring(0, 500));
      console.log('');
      console.log('Full response length:', html.length);
    }
    
    // Also test Afternoon session
    console.log('');
    console.log('='.repeat(60));
    console.log('Testing Afternoon session...');
    console.log('');
    
    const formDataAN = new URLSearchParams();
    formDataAN.append('dated', testDate);
    formDataAN.append('session', 'AN');
    formDataAN.append('submit', 'Submit');
    
    const controllerAN = new AbortController();
    const timeoutIdAN = setTimeout(() => controllerAN.abort(), 12000);
    
    const responseAN = await fetch('https://examcell.srmist.edu.in/tp2/seating/bench/fetch_data.php', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formDataAN.toString(),
      signal: controllerAN.signal
    });
    
    clearTimeout(timeoutIdAN);
    
    const htmlAN = await responseAN.text();
    console.log('Afternoon - Response length:', htmlAN.length, 'bytes');
    console.log('Afternoon - Has RA pattern:', /RA\d{10,}/i.test(htmlAN));
    console.log('Afternoon - RA numbers found:', (htmlAN.match(/RA\d{10,}/gi) || []).length);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.name === 'AbortError') {
      console.error('Request timed out after 12 seconds');
    }
  }
}

testFetchData();

