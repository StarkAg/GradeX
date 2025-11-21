#!/bin/bash

# Test report.php endpoint manually
echo "Testing report.php endpoint..."
echo "URL: https://examcell.srmist.edu.in/tp2/seating/bench/report.php"
echo ""
echo "Fetching with curl..."
echo ""

curl -s "https://examcell.srmist.edu.in/tp2/seating/bench/report.php" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.9" \
  --max-time 12 \
  -o /tmp/report-php-output.html

echo "Response saved to /tmp/report-php-output.html"
echo ""
echo "Checking response..."
echo ""

# Check file size
FILE_SIZE=$(wc -c < /tmp/report-php-output.html)
echo "File size: $FILE_SIZE bytes"

# Check if contains RA numbers
if grep -q -i "RA[0-9]" /tmp/report-php-output.html; then
  echo "✅ Contains RA numbers"
  RA_COUNT=$(grep -o -i "RA[0-9]\{10,\}" /tmp/report-php-output.html | wc -l)
  echo "   Found approximately $RA_COUNT RA numbers"
else
  echo "❌ No RA numbers found"
fi

# Check if contains table rows
if grep -q "<tr" /tmp/report-php-output.html; then
  echo "✅ Contains HTML table rows"
else
  echo "❌ No table rows found"
fi

# Show first 20 lines
echo ""
echo "First 20 lines of response:"
head -20 /tmp/report-php-output.html

echo ""
echo "To view full output: cat /tmp/report-php-output.html"
echo "To search for specific RA: grep 'RA2311003012253' /tmp/report-php-output.html"

