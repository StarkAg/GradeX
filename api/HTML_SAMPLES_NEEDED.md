# HTML Samples Needed for Testing

## What I Need

To ensure the scraping logic works correctly with the actual SRM exam cell websites, I need sample HTML from the pages. This will help me:

1. **Verify the parsing logic** matches the actual HTML structure
2. **Adjust regex patterns** if needed
3. **Test edge cases** and different data formats
4. **Ensure reliability** across all campuses

## What to Provide

### Option 1: Full HTML Sample (Best)
- Copy the full HTML source from one of the exam cell pages
- Save it as a file (e.g., `sample-main-campus.html`)
- Include a page that has actual seating data visible

### Option 2: Key HTML Snippets (Good)
Copy just the relevant sections showing:
- How RA numbers appear in table rows
- How hall/room information is displayed
- How bench numbers are shown
- How session (Forenoon/Afternoon) is indicated
- The table structure

### Option 3: Screenshot + HTML (Also Good)
- Screenshot of the page showing the data
- HTML snippet of the table/row structure

## What to Look For

When you visit: `https://examcell.srmist.edu.in/main/seating/bench/report.php`

Look for HTML that contains:
```html
<!-- Example of what I'm looking for -->
<table>
  <tr>
    <td>RA23XXXX</td>
    <td>S45</td>  <!-- Hall/Room -->
    <td>A12</td>  <!-- Bench -->
    <td>Forenoon</td>  <!-- Session -->
  </tr>
</table>
```

## Current Parsing Logic

The code currently looks for:
1. **RA Pattern**: `RA\d{2}[A-Z]{2,4}\d{3,4}` (e.g., RA23XXXX, RA23CSE123)
2. **Table Rows**: `<tr>` tags containing seating data
3. **Session Keywords**: "Forenoon", "Afternoon", "FN", "AN"
4. **Hall/Room**: Patterns like "S45", "TP603", "UB101"
5. **Bench**: Patterns like "A12", "B5"

## If You Can't Provide HTML

That's okay! I can:
1. Make the parsing more flexible and robust
2. Add multiple fallback strategies
3. Test with the actual websites once deployed
4. Adjust based on error logs

## How to Get HTML

1. **Visit the exam cell page** when it has data
2. **Right-click → View Page Source** (or `Cmd+Option+U` on Mac)
3. **Copy the HTML** (or just the table section)
4. **Save it** or paste it in a file

## Alternative: Test URLs

If you can provide:
- A test URL that has sample data
- Or a date when data is available
- I can try to fetch and analyze it directly

---

**Note**: Even without HTML samples, the code should work. But having samples will help me:
- Make it more accurate
- Handle edge cases
- Ensure it works across all campus formats

