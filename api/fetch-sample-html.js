/**
 * Quick script to fetch and analyze HTML structure from SRM exam cell pages
 * Run with: node api/fetch-sample-html.js
 */

const CAMPUS_ENDPOINTS = {
  'Main Campus': 'https://examcell.srmist.edu.in/main/seating/bench/report.php',
  'Tech Park': 'https://examcell.srmist.edu.in/tp/seating/bench/report.php',
  'Biotech & Architecture': 'https://examcell.srmist.edu.in/bio/seating/bench/report.php',
  'University Building': 'https://examcell.srmist.edu.in/ub/seating/bench/report.php',
};

async function fetchAndAnalyze() {
  console.log('🔍 Fetching HTML from SRM exam cell pages...\n');
  
  for (const [campusName, url] of Object.entries(CAMPUS_ENDPOINTS)) {
    try {
      console.log(`📡 Fetching ${campusName}...`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (!response.ok) {
        console.log(`   ❌ Failed: HTTP ${response.status}\n`);
        continue;
      }
      
      const html = await response.text();
      console.log(`   ✅ Success! HTML length: ${html.length} bytes`);
      
      // Look for RA patterns
      const raPattern = /\b(RA\d{2}[A-Z]{2,4}\d{3,4})\b/gi;
      const raMatches = [...html.matchAll(raPattern)];
      console.log(`   📊 Found ${raMatches.length} RA numbers`);
      
      if (raMatches.length > 0) {
        // Get sample context around first RA
        const firstMatch = raMatches[0];
        const start = Math.max(0, firstMatch.index - 200);
        const end = Math.min(html.length, firstMatch.index + firstMatch[0].length + 200);
        const context = html.substring(start, end);
        
        console.log(`   📝 Sample RA: ${firstMatch[0]}`);
        console.log(`   📄 Context (first 300 chars):`);
        console.log(`   ${context.substring(0, 300).replace(/\n/g, ' ')}...\n`);
        
        // Look for table structure
        if (html.includes('<table') || html.includes('<tr')) {
          console.log(`   ✅ Contains table structure`);
        }
        
        // Look for session indicators
        const hasForenoon = /forenoon|fn/i.test(html);
        const hasAfternoon = /afternoon|an/i.test(html);
        console.log(`   🕐 Session indicators: ${hasForenoon ? 'Forenoon ' : ''}${hasAfternoon ? 'Afternoon' : 'None'}\n`);
        
        // Save sample HTML to file
        const fs = await import('fs');
        const filename = `api/sample-${campusName.toLowerCase().replace(/\s+/g, '-')}.html`;
        fs.writeFileSync(filename, html);
        console.log(`   💾 Saved to: ${filename}\n`);
      } else {
        console.log(`   ⚠️  No RA numbers found in HTML\n`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('✅ Analysis complete!');
}

fetchAndAnalyze().catch(console.error);

