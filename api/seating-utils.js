/**
 * Seating Arrangement Fetch System - Core Utilities
 * Fetches exam seating details from SRM exam cell endpoints
 */

// Campus endpoints configuration
// Each campus has a base URL and a fetch_data.php endpoint for POST requests
const CAMPUS_ENDPOINTS = {
  'Main Campus': {
    base: 'https://examcell.srmist.edu.in/main/seating/bench',
    fetchData: 'https://examcell.srmist.edu.in/main/seating/bench/fetch_data.php'
  },
  'Tech Park': {
    base: 'https://examcell.srmist.edu.in/tp/seating/bench',
    fetchData: 'https://examcell.srmist.edu.in/tp/seating/bench/fetch_data.php'
  },
  'Tech Park 2': {
    base: 'https://examcell.srmist.edu.in/tp2/seating/bench',
    fetchData: 'https://examcell.srmist.edu.in/tp2/seating/bench/fetch_data.php',
    report: 'https://examcell.srmist.edu.in/tp2/seating/bench/report.php'
  },
  'Biotech & Architecture': {
    base: 'https://examcell.srmist.edu.in/bio/seating/bench',
    fetchData: 'https://examcell.srmist.edu.in/bio/seating/bench/fetch_data.php'
  },
  'University Building': {
    base: 'https://examcell.srmist.edu.in/ub/seating/bench',
    fetchData: 'https://examcell.srmist.edu.in/ub/seating/bench/fetch_data.php'
  },
};

// Cache storage (in-memory, resets on serverless function restart)
const cache = new Map();

// Student data cache (loaded once per serverless function instance)
let studentDataCache = null;
let studentDataLoadPromise = null;

/**
 * Normalize RA number
 * @param {string} ra - Register number
 * @returns {string} - Normalized RA (uppercase, trimmed)
 */
export function normalizeRA(ra) {
  if (!ra) return '';
  return ra.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Generate date variants for matching
 * @param {string} date - Date string (YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
 * @returns {string[]} - Array of date format variants
 */
export function generateDateVariants(date) {
  if (!date) return [];
  
  const variants = new Set();
  
  // Original format
  variants.add(date);
  
  // Try to parse and generate variants
  let parsedDate = null;
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-');
    variants.add(`${day}-${month}-${year}`); // DD-MM-YYYY
    variants.add(`${day}/${month}/${year}`); // DD/MM/YYYY
    parsedDate = { day, month, year };
  }
  // Try DD-MM-YYYY or DD/MM/YYYY (4-digit year)
  else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(date)) {
    const parts = date.split(/[-\/]/);
    const [day, month, year] = parts;
    variants.add(`${year}-${month}-${day}`); // YYYY-MM-DD
    variants.add(`${day}-${month}-${year}`); // DD-MM-YYYY
    variants.add(`${day}/${month}/${year}`); // DD/MM/YYYY
    parsedDate = { day, month, year };
  }
  // Try DD-MM-YY or DD/MM/YY (2-digit year) - assume 20XX
  else if (/^\d{2}[-\/]\d{2}[-\/]\d{2}$/.test(date)) {
    const parts = date.split(/[-\/]/);
    let [day, month, yearShort] = parts;
    // Convert 2-digit year to 4-digit (assume 2000-2099)
    const year = yearShort.length === 2 ? `20${yearShort}` : yearShort;
    variants.add(`${day}-${month}-${year}`); // DD-MM-YYYY
    variants.add(`${day}/${month}/${year}`); // DD/MM/YYYY
    variants.add(`${year}-${month}-${day}`); // YYYY-MM-DD
    parsedDate = { day, month, year };
  }
  
  // Add common text formats
  if (parsedDate) {
    const { day, month, year } = parsedDate;
    // Remove leading zeros for some variants
    const dayNoZero = String(parseInt(day, 10));
    const monthNoZero = String(parseInt(month, 10));
    variants.add(`${dayNoZero}-${monthNoZero}-${year}`);
    variants.add(`${dayNoZero}/${monthNoZero}/${year}`);
  }
  
  return Array.from(variants);
}

/**
 * Fetch HTML page with timeout and retry
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds (default: 12000)
 * @param {number} retries - Number of retries (default: 1)
 * @param {Object} options - Additional options (method, body, headers)
 * @returns {Promise<string>} - HTML content
 */
export async function fetchPage(url, timeout = 12000, retries = 1, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    
    // For POST requests, add form content type
    if (options.method === 'POST') {
      defaultHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    
    const response = await fetch(url, {
      signal: controller.signal,
      method: options.method || 'GET',
      body: options.body || null,
      headers: { ...defaultHeaders, ...(options.headers || {}) },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    return html;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && error.name !== 'AbortError') {
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchPage(url, timeout, retries - 1, options);
    }
    
    throw error;
  }
}

/**
 * Guess session from context text
 * @param {string} text - Context text around RA
 * @returns {string|null} - Session name or null
 */
export function guessSessionFromContext(text) {
  if (!text) return null;
  
  const upperText = text.toUpperCase();
  
  // Check for explicit session indicators
  if (upperText.includes('FORENOON') || upperText.includes('FN')) {
    return 'Forenoon';
  }
  if (upperText.includes('AFTERNOON') || upperText.includes('AN')) {
    return 'Afternoon';
  }
  
  return null;
}

/**
 * Parse hall and bench from text context
 * @param {string} text - Text containing hall/bench info
 * @returns {{hall: string|null, bench: string|null}} - Extracted hall and bench
 */
export function parseHallAndBench(text) {
  if (!text) return { hall: null, bench: null };
  
  // Common patterns:
  // "Hall: S45", "Room: TP603", "Hall S45", "S45", "TP603", "H216", "H301B"
  // "Bench: A12", "Bench A12", "A12", "12", "SEAT NO: 1"
  
  let hall = null;
  let bench = null;
  
  // Try to find hall/room patterns (SRM uses formats like H216, H301B, TP603, etc.)
  const hallPatterns = [
    /ROOM\s+NO[:\s]+([A-Z0-9]+)/i,
    /(?:Hall|Room)[\s:]*([A-Z]?\d+[A-Z]?)/i,
    /\b([A-Z]{1,3}\d{2,4}[A-Z]?)\b/, // TP603, S45, UB101, H216, H301B
    /\b(Hall\s+[A-Z]?\d+)/i,
  ];
  
  for (const pattern of hallPatterns) {
    const match = text.match(pattern);
    if (match) {
      hall = match[1] || match[0];
      break;
    }
  }
  
  // Try to find bench/seat patterns
  const benchPatterns = [
    /SEAT\s+NO[:\s]*(\d+)/i,
    /(?:Bench|Seat)[\s:]*([A-Z]?\d+)/i,
    /\b([A-Z]\d{1,3})\b/, // A12, B5
    /\b(Bench\s+[A-Z]?\d+)/i,
  ];
  
  for (const pattern of benchPatterns) {
    const match = text.match(pattern);
    if (match) {
      bench = match[1] || match[0];
      break;
    }
  }
  
  return { hall, bench };
}

/**
 * Extract seating rows from HTML (table-based or text-based)
 * @param {string} html - HTML content
 * @param {string} targetRA - Optional: specific RA to search for (if provided, only extract rows for this RA)
 * @returns {Array<{ra: string, session: string, hall: string, bench: string, context: string}>} - Extracted rows
 */
export function extractSeatingRows(html, targetRA = null) {
  const rows = [];
  
  if (!html) return rows;
  
  // Extract room/hall information from headers
  // Pattern: ROOM NO:H216, ROOM NO:H301B, or ROOM NO:TPTP-201
  const roomPattern = /ROOM\s+NO[:\s]+([A-Z0-9\-]+)/gi;
  const roomMatches = [...html.matchAll(roomPattern)];
  
  // Extract session from headers
  // Pattern: SESSION : FN or SESSION : AN
  const sessionPattern = /SESSION\s*[:\s]+(FN|AN)/gi;
  const sessionMatches = [...html.matchAll(sessionPattern)];
  
  // Current room and session (will be updated as we parse)
  let currentRoom = null;
  let currentSession = null;
  
  // Method 1: Simple approach - Find RA, then look above for "ROOM NO:"
  // If targetRA is provided, only search for that specific RA
  let allRAMatches = [];
  if (targetRA) {
    // Search for the specific RA (case-insensitive)
    const escapedRA = targetRA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const raPattern = new RegExp(`(${escapedRA})`, 'gi');
    allRAMatches = [...html.matchAll(raPattern)];
  } else {
    // Search for all RAs
    const raPattern = /(RA\d{10,15})/gi;
    allRAMatches = [...html.matchAll(raPattern)];
  }
  
  console.log(`[DEBUG extractSeatingRows] targetRA: ${targetRA}, found ${allRAMatches.length} RA matches`);
  
  for (const raMatch of allRAMatches) {
    const ra = raMatch[0].toUpperCase();
    const raIndex = raMatch.index;
    
    // Look backwards (above) for the nearest "ROOM NO:" header
    // First, replace HTML entities to make matching easier
    const beforeRA = html.substring(0, raIndex).replace(/&nbsp;/gi, ' ');
    // Match ROOM NO: followed by room name (handle spaces and colons)
    const roomMatch = beforeRA.match(/ROOM\s+NO\s*[: ]+\s*([A-Z0-9\-]+)/gi);
    
    console.log(`[DEBUG extractSeatingRows] RA: ${ra}, roomMatch: ${roomMatch ? roomMatch.length : 0} matches`);
    
    if (!roomMatch || roomMatch.length === 0) {
      console.log(`[DEBUG extractSeatingRows] No room found for RA ${ra}`);
      continue;
    }
    
    // Get the last (nearest) room match and extract room name
    const lastRoomMatch = roomMatch[roomMatch.length - 1];
    // Extract room name: everything after "ROOM NO:" or "ROOM NO "
    const roomNameMatch = lastRoomMatch.match(/ROOM\s+NO\s*[: ]+\s*([A-Z0-9\-]+)/i);
    const roomName = roomNameMatch ? roomNameMatch[1] : lastRoomMatch.replace(/ROOM\s+NO\s*[: ]+\s*/i, '').trim();
    
    console.log(`[DEBUG extractSeatingRows] RA: ${ra}, extracted room: ${roomName}, lastRoomMatch: ${lastRoomMatch}`);
    
    // Find session (look backwards for SESSION header)
    let session = 'Unknown';
    const sessionMatch = beforeRA.match(/SESSION\s*[: ]\s*(FN|AN|FORENOON|AFTERNOON)/i);
    if (sessionMatch) {
      const sessionValue = sessionMatch[1].toUpperCase();
      if (sessionValue === 'FN' || sessionValue === 'FORENOON') {
        session = 'Forenoon';
      } else if (sessionValue === 'AN' || sessionValue === 'AFTERNOON') {
        session = 'Afternoon';
      }
    }
    
    // Find the table row containing this RA
    let trStart = html.lastIndexOf('<tr', raIndex);
    if (trStart === -1) continue;
    
    let trEnd = html.indexOf('</tr>', raIndex);
    if (trEnd === -1) continue;
    trEnd += 5;
    
    const rowHtml = html.substring(trStart, trEnd);
    
    // Extract data from table cells
    const tdMatches = rowHtml.match(/<td[^>]*>([^<]*)<\/td>/gi);
    let seatNumber = null;
    let department = null;
    let subjectCode = null;
    
    if (tdMatches) {
      // Find all non-empty cells
      const nonEmptyCells = tdMatches
        .map(cell => cell.replace(/<[^>]+>/g, '').trim())
        .filter(cell => cell.length > 0);
      
      // Look for seat number (numeric value)
      for (const cell of nonEmptyCells) {
        if (/^\d+$/.test(cell)) {
          seatNumber = cell;
          break;
        }
      }
      
      // Look for department (contains "/" like "CSE/21MAB201T")
      for (const cell of nonEmptyCells) {
        if (cell.includes('/') && !cell.match(/^\d+$/)) {
          // Split department and subject code
          const parts = cell.split('/');
          if (parts.length >= 2) {
            department = parts[0].trim();
            subjectCode = parts[1].trim();
            console.log(`[DEBUG extractSeatingRows] Split "${cell}" into department="${department}", subjectCode="${subjectCode}"`);
          } else {
            department = cell;
          }
          break;
        }
      }
      
      console.log(`[DEBUG extractSeatingRows] Final values - department: ${department}, subjectCode: ${subjectCode}, seatNumber: ${seatNumber}`);
      
      // If no department found with "/", take first non-empty non-numeric cell
      if (!department && nonEmptyCells.length > 0) {
        for (const cell of nonEmptyCells) {
          if (!/^\d+$/.test(cell) && cell.length > 2) {
            department = cell;
            break;
          }
        }
      }
    }
    
    // Extract text content for context
    const textContent = rowHtml
      .replace(/<[^>]+>/g, '|')
      .replace(/\s+/g, ' ')
      .trim();
    
    rows.push({
      ra,
      session: session,
      hall: roomName,
      bench: seatNumber || 'N/A',
      department: department || 'N/A',
      subjectCode: subjectCode || null,
      context: textContent.substring(0, 150),
    });
  }
  
  // Method 2: If no table rows found, do regex text scanning
  if (rows.length === 0) {
    // Look for RA patterns in the entire HTML (longer format)
    // Use flexible pattern that works in HTML context
    const raPattern = /(?:>|"|'|\b)(RA\d{10,15})(?:<|"|'|\s|\b)/gi;
    let raMatches = [...html.matchAll(raPattern)];
    
    // If no matches with boundaries, try without boundaries
    if (raMatches.length === 0) {
      const flexiblePattern = /(RA\d{10,15})/gi;
      raMatches = [...html.matchAll(flexiblePattern)];
    }
    
    for (const match of raMatches) {
      // Extract the RA from the match (group 1 is the captured RA)
      const ra = (match[1] || match[0]).toUpperCase();
      const matchIndex = match.index;
      
      // Find nearest room and session
      let nearestRoom = null;
      let nearestSession = null;
      
      for (const roomMatch of roomMatches) {
        if (roomMatch.index < matchIndex && (!nearestRoom || roomMatch.index > roomMatches.find(r => r[1] === nearestRoom)?.index)) {
          nearestRoom = roomMatch[1];
        }
      }
      
      for (const sessionMatch of sessionMatches) {
        if (sessionMatch.index < matchIndex) {
          nearestSession = sessionMatch[1] === 'FN' ? 'Forenoon' : 'Afternoon';
        }
      }
      
      // Extract context window
      const start = Math.max(0, matchIndex - 100);
      const end = Math.min(html.length, matchIndex + match[0].length + 100);
      const context = html.substring(start, end)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      rows.push({
        ra,
        session: nearestSession || 'Unknown',
        hall: nearestRoom || 'N/A',
        bench: 'N/A',
        department: 'N/A',
        subjectCode: null,
        context: context.substring(0, 150),
      });
    }
  }
  
  // Debug: Log extraction results
  if (rows.length > 0) {
    console.log(`[DEBUG extractSeatingRows] Final rows extracted: ${rows.length}`);
  }
  
  return rows;
}

/**
 * Find matches in HTML for given RA and date variants
 * @param {string} html - HTML content
 * @param {string} ra - Normalized RA number
 * @param {string[]} dateVariants - Array of date format variants
 * @returns {Array} - Matching seating information
 */
export function findMatchesInHTML(html, ra, dateVariants) {
  const matches = [];
  
  if (!html || !ra) return matches;
  
  // Extract seating rows for the specific RA (more efficient)
  const rows = extractSeatingRows(html, ra);
  
  // All returned rows should match the RA, but filter to be safe
  const raMatches = rows.filter(row => 
    row.ra.toUpperCase() === ra.toUpperCase()
  );
  
  if (raMatches.length === 0) return matches;
  
  // Check if any date variant appears in the HTML or context
  const htmlLower = html.toLowerCase();
  const hasDateMatch = dateVariants.some(dateVariant => {
    const normalized = dateVariant.toLowerCase().replace(/[-\/]/g, '[-\/]?');
    return htmlLower.includes(dateVariant.toLowerCase());
  });
  
  // If date variants provided but none match, still return RA matches
  // (date might be in a different part of the page)
  if (dateVariants.length > 0 && !hasDateMatch) {
    // Still return matches but mark as potential
    return raMatches.map(row => ({
      ...row,
      matched: true,
      dateMatched: false,
    }));
  }
  
  // Return matches with date confirmation
  return raMatches.map(row => ({
    ...row,
    matched: true,
    dateMatched: hasDateMatch,
  }));
}

/**
 * Parse RA range (e.g., "RA2411042010001-RA2411042010027")
 * @param {string} rangeStr - RA range string
 * @param {string} ra - RA number to check
 * @returns {boolean} - True if RA is in range
 */
function isRAInRange(rangeStr, ra) {
  if (!rangeStr || !ra) return false;
  
  // Match pattern: RA2411042010001-RA2411042010027
  const rangeMatch = rangeStr.match(/RA(\d+)-RA(\d+)/i);
  if (!rangeMatch) return false;
  
  const startRA = BigInt(rangeMatch[1]);
  const endRA = BigInt(rangeMatch[2]);
  const raNum = BigInt(ra.replace(/^RA/i, ''));
  
  // Compare as BigInt to handle large RA numbers
  return raNum >= startRA && raNum <= endRA;
}

/**
 * Parse consolidated report HTML for RA ranges
 * @param {string} html - HTML content from consolidated report
 * @param {string} ra - Normalized RA number
 * @param {string[]} dateVariants - Date format variants
 * @returns {Array} - Array of matches
 */
function parseConsolidatedReport(html, ra, dateVariants) {
  const matches = [];
  
  if (!html || !ra) return matches;
  
  // For consolidated reports, we already filtered by date when fetching via POST
  // So we can be lenient with date matching - just check if HTML contains date-like patterns
  const htmlLower = html.toLowerCase();
  let hasDateMatch = true; // Default to true for consolidated reports
  
  // Only do strict date matching if we want to verify, but since we POSTed with the date,
  // the response should already be filtered. Just check if HTML has date-like content
  if (dateVariants && dateVariants.length > 0 && html.length > 0) {
    // Check if HTML contains any date-like pattern (day/month/year or month name)
    const hasDatePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(html) || 
                          /\d{1,2}[-\/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\/]\d{2,4}/i.test(html);
    
    // If HTML has date patterns and RA numbers, assume it's valid
    if (hasDatePattern && /\bRA\d{2}/i.test(html)) {
      hasDateMatch = true;
    } else {
      // Try to match date variants
      hasDateMatch = dateVariants.some(dateVariant => {
        const normalized = dateVariant.toLowerCase();
        return htmlLower.includes(normalized);
      });
      
      // Also check for month name format (e.g., "17/NOV/2025")
      if (!hasDateMatch) {
        const monthNames = {
          '01': ['jan', 'january'], '02': ['feb', 'february'], '03': ['mar', 'march'],
          '04': ['apr', 'april'], '05': ['may'], '06': ['jun', 'june'],
          '07': ['jul', 'july'], '08': ['aug', 'august'], '09': ['sep', 'september'],
          '10': ['oct', 'october'], '11': ['nov', 'november'], '12': ['dec', 'december']
        };
        
        for (const dateVariant of dateVariants) {
          const parts = dateVariant.split(/[-\/]/);
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const monthVariants = monthNames[month];
            if (monthVariants) {
              for (const monthName of monthVariants) {
                const variants = [
                  `${day}/${monthName}/${year}`,
                  `${day}-${monthName}-${year}`,
                  `${day} ${monthName} ${year}`,
                  `${day}/${monthName.toUpperCase()}/${year}`,
                  `${day}-${monthName.toUpperCase()}-${year}`,
                  `${day} ${monthName.toUpperCase()} ${year}`
                ];
                
                hasDateMatch = variants.some(variant => 
                  htmlLower.includes(variant.toLowerCase())
                );
                
                if (hasDateMatch) break;
              }
              if (hasDateMatch) break;
            }
          }
        }
      }
    }
  }
  
  // Parse table rows - format: <tr><td>DEGREE</td><td>DEPARTMENT</td><td>SUBCODE</td><td>REGISTER NO.</td><td>ROOM NO.</td><td>TOTAL NO.</td></tr>
  const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowPattern) || [];
  
  for (const rowHtml of rows) {
    // Extract cells - handle both <td>content</td> and <td >content</td>
    // Use a more robust pattern that captures content between tags
    const cellPattern = /<td[^>]*>([^<]*)<\/td>/gi;
    const cells = [];
    let match;
    while ((match = cellPattern.exec(rowHtml)) !== null) {
      cells.push(match[1].trim());
    }
    
    if (!cells || cells.length < 5) continue;
    
    // Skip header row (contains "DEGREE", "DEPARTMENT", "REGISTER NO.", etc.)
    if (cells[0] && (cells[0].toUpperCase().includes('DEGREE') || 
        cells[1]?.toUpperCase().includes('DEPARTMENT') ||
        cells[3]?.toUpperCase().includes('REGISTER'))) {
      continue;
    }
    
    // Get register number (4th cell, index 3) and room (5th cell, index 4)
    const registerCell = cells[3];
    const roomCell = cells[4];
    const departmentCell = cells[1];
    const subcodeCell = cells[2];
    
    if (!registerCell || !roomCell) continue;
    
    // Skip if register cell doesn't contain RA pattern
    if (!/RA\d+/i.test(registerCell)) continue;
    
    // Check if RA is in the range
    if (isRAInRange(registerCell, ra)) {
      // Extract session from HTML context
      let session = 'Unknown';
      if (htmlLower.includes('session : an') || htmlLower.includes('session: an')) {
        session = 'Afternoon';
      } else if (htmlLower.includes('session : fn') || htmlLower.includes('session: fn')) {
        session = 'Forenoon';
      }
      
      matches.push({
        ra: ra.toUpperCase(),
        session,
        hall: roomCell,
        bench: 'N/A', // Consolidated report doesn't have individual seat numbers
        department: departmentCell || 'N/A',
        context: `${departmentCell || ''} ${subcodeCell || ''} ${registerCell}`.trim(),
        matched: true,
        dateMatched: hasDateMatch,
        source: 'consolidated'
      });
    }
  }
  
  return matches;
}

/**
 * Fetch seating info for a single campus
 * @param {string} campusName - Campus name
 * @param {string} ra - Normalized RA number
 * @param {string[]} dateVariants - Date format variants
 * @returns {Promise<Array>} - Array of matches for this campus
 */
export async function fetchCampusSeating(campusName, ra, dateVariants) {
  const campusConfig = CAMPUS_ENDPOINTS[campusName];
  if (!campusConfig) return [];
  
  try {
    // Polite delay between campus fetches (300-700ms)
    const delay = 300 + Math.random() * 400;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    let html = '';
    let fetchUrl = campusConfig.fetchData;
    
    // Try POST request to fetch_data.php with date and session (room-wise data only)
    if (dateVariants && dateVariants.length > 0) {
      const dateParam = dateVariants[0];
      
      // Try both Forenoon and Afternoon sessions
      const sessions = ['FN', 'AN'];
      
      for (const session of sessions) {
        try {
          // Format date for POST (usually DD/MM/YYYY or DD-MM-YYYY)
          // Convert to DD/MM/YYYY format which is common for date pickers
          let formattedDate = dateParam;
          if (dateParam.includes('-')) {
            formattedDate = dateParam.replace(/-/g, '/');
          }
          
          // Create form data
          const formData = new URLSearchParams();
          formData.append('dated', formattedDate);
          formData.append('session', session);
          formData.append('submit', 'Submit');
          
          // Fetch room-wise data from fetch_data.php
          const postHtml = await fetchPage(
            campusConfig.fetchData,
            12000,
            1,
            {
              method: 'POST',
              body: formData.toString(),
            }
          );
          
          // Check if we got actual data with RA numbers
          // Use flexible pattern that works in HTML context
          const hasRAPattern = /(?:>|"|'|\b)(RA\d{2,})/i.test(postHtml);
          // Also check if the target RA is in the HTML (if provided)
          const hasTargetRA = ra ? new RegExp(ra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(postHtml) : true;
          
          if (postHtml.length > 5000 && (hasRAPattern || hasTargetRA)) {
            html = postHtml;
            fetchUrl = `${campusConfig.fetchData}?dated=${encodeURIComponent(formattedDate)}&session=${session}`;
            console.log(`[DEBUG ${campusName}] Using HTML from ${session} session, length: ${html.length}, hasTargetRA: ${hasTargetRA}`);
            break; // Found room-wise data, no need to try other sessions
          }
        } catch (e) {
          console.error(`Error POSTing to ${campusName} (${session}):`, e.message);
          continue;
        }
      }
    }
    
    // Fallback: Try GET request to report.php (prioritize explicit report endpoint if available)
    if (!html || html.length < 5000) {
      try {
        // Use explicit report endpoint if available, otherwise construct from base
        const reportUrl = campusConfig.report || `${campusConfig.base}/report.php`;
        html = await fetchPage(reportUrl, 12000, 1);
        fetchUrl = reportUrl;
      } catch (e) {
        // 404 errors are expected for some campuses - log as warning, not error
        if (e.message && e.message.includes('404')) {
          console.log(`[${campusName}] Base URL not available (404) - this is expected for some campuses`);
        } else {
          console.warn(`[${campusName}] Error fetching base URL:`, e.message);
        }
      }
    }
    
    // Debug: Check HTML structure
    const debugInfo = {
      htmlLength: html.length,
      hasTableRows: html.length > 0 ? /<tr[^>]*>/i.test(html) : false,
      hasRAs: html.length > 0 ? /(?:>|"|'|\b)(RA\d{2,})/i.test(html) : false,
      hasTargetRA: html.length > 0 ? new RegExp(ra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(html) : false,
    };
    
    if (html.length > 0) {
      console.log(`[DEBUG ${campusName}] HTML length: ${html.length}, Has table rows: ${debugInfo.hasTableRows}, Has RAs: ${debugInfo.hasRAs}, Has target RA ${ra}: ${debugInfo.hasTargetRA}`);
    } else {
      console.log(`[DEBUG ${campusName}] HTML is empty!`);
    }
    
    // Get matches from room-wise report only
    const matches = findMatchesInHTML(html, ra, dateVariants);
    
    // Debug: Log match results
    console.log(`[DEBUG ${campusName}] Found ${matches.length} matches for RA ${ra}`);
    
    // Store debug info in matches for API response
    if (matches.length === 0 && debugInfo.hasTargetRA) {
      console.log(`[DEBUG ${campusName}] RA found in HTML but no matches returned - extraction issue!`);
    }
    
    // Use only room-wise matches
    const allMatches = matches;
    
    return allMatches.map(match => ({
      ...match,
      url: fetchUrl,
      campus: campusName,
    }));
  } catch (error) {
    console.error(`Error fetching ${campusName}:`, error.message);
    return [];
  }
}

/**
 * Get cache key for RA + date combination
 * @param {string} ra - RA number
 * @param {string} date - Date string
 * @returns {string} - Cache key
 */
function getCacheKey(ra, date) {
  return `seating_${ra}_${date || 'any'}`;
}

/**
 * Get cached result if available and not expired
 * @param {string} ra - RA number
 * @param {string} date - Date string
 * @returns {Object|null} - Cached result or null
 */
export function getCachedResult(ra, date) {
  const key = getCacheKey(ra, date);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  // Check if cache is still valid (5 minutes TTL - ideal for exam seating data)
  const now = Date.now();
  const age = now - cached.timestamp;
  const ttl = 5 * 60 * 1000; // 5 minutes - ideal balance between freshness and efficiency
  
  if (age > ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Set cache result
 * @param {string} ra - RA number
 * @param {string} date - Date string
 * @param {Object} data - Data to cache
 */
export function setCachedResult(ra, date, data) {
  const key = getCacheKey(ra, date);
  cache.set(key, {
    timestamp: Date.now(),
    data,
  });
}

/**
 * Load student data from Supabase (primary) or seat-data.json (fallback)
 * @returns {Promise<Map>} - Map of RA -> {name}
 */
async function loadStudentData() {
  // Return cached data if already loaded and valid (not empty)
  if (studentDataCache && studentDataCache.size > 0) {
    console.log(`[loadStudentData] Using cached data: ${studentDataCache.size} records`);
    return studentDataCache;
  }
  
  // If cache exists but is empty, clear it and reload
  if (studentDataCache && studentDataCache.size === 0) {
    console.log(`[loadStudentData] Cache is empty, clearing and reloading...`);
    studentDataCache = null;
    studentDataLoadPromise = null;
  }
  
  // If already loading, wait for that promise
  if (studentDataLoadPromise) {
    return studentDataLoadPromise;
  }
  
  // Start loading
  studentDataLoadPromise = (async () => {
    let studentData = null;
    let loadMethod = 'unknown';
    
    try {
      // STRATEGY 0: Try Supabase first (most reliable)
      try {
        console.log(`[loadStudentData] Attempting to load from Supabase...`);
        const { supabase, isSupabaseConfigured } = await import('./supabase-client.js');
        
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('students')
            .select('register_number, name');
          
          if (error) {
            console.log(`[loadStudentData] Supabase error: ${error.message}`);
          } else if (data && data.length > 0) {
            // Convert to Map
            const lookup = new Map();
            data.forEach(entry => {
              if (entry.register_number && entry.name) {
                const ra = normalizeRA(entry.register_number);
                if (ra) {
                  lookup.set(ra, {
                    name: entry.name || null,
                  });
                }
              }
            });
            
            studentData = lookup;
            loadMethod = 'Supabase';
            console.log(`[loadStudentData] ✓ Successfully loaded ${lookup.size} records from Supabase`);
          } else {
            console.log(`[loadStudentData] Supabase returned no data`);
          }
        } else {
          console.log(`[loadStudentData] Supabase not configured, trying fallback...`);
        }
      } catch (supabaseError) {
        console.log(`[loadStudentData] Supabase failed: ${supabaseError.message}`);
      }
      
      // STRATEGY 1: Fallback to JSON file if Supabase failed
      if (!studentData || studentData.size === 0) {
        console.log(`[loadStudentData] Falling back to JSON file...`);
        let fileContent = null;
        
        // Try createRequire (works in Node.js serverless functions)
      try {
        console.log(`[loadStudentData] Attempting createRequire...`);
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        // Get current file directory
        const currentFileUrl = import.meta.url;
        const currentFilePath = fileURLToPath(currentFileUrl);
        const currentDir = path.dirname(currentFilePath);
        
        // Try multiple paths
        const possibleRequirePaths = [
          path.join(currentDir, 'data', 'seat-data.json'),
          path.join(currentDir, '..', 'data', 'seat-data.json'),
          './data/seat-data.json',
          '../data/seat-data.json',
        ];
        
        for (const requirePath of possibleRequirePaths) {
          try {
            console.log(`[loadStudentData] Trying require: ${requirePath}`);
            const data = require(requirePath);
            fileContent = JSON.stringify(data);
            loadMethod = `createRequire: ${requirePath}`;
            console.log(`[loadStudentData] ✓ Successfully loaded via createRequire (${fileContent.length} bytes)`);
            break;
          } catch (reqError) {
            console.log(`[loadStudentData] require failed for ${requirePath}: ${reqError.message}`);
            continue;
          }
        }
      } catch (requireError) {
        console.log(`[loadStudentData] createRequire approach failed: ${requireError.message}`);
      }
      
      // STRATEGY 1: Try file system (if direct import failed)
      if (!fileContent) {
        console.log(`[loadStudentData] Attempting to load from file system...`);
        const fs = await import('fs');
        const path = await import('path');
        
        console.log(`[loadStudentData] process.cwd(): ${process.cwd()}`);
        
        // Try to get __dirname equivalent for ES modules first
        let currentDir = null;
        try {
          const { fileURLToPath } = await import('url');
          const currentFileUrl = import.meta.url;
          const currentFilePath = fileURLToPath(currentFileUrl);
          currentDir = path.dirname(currentFilePath);
          console.log(`[loadStudentData] __dirname: ${currentDir}`);
        } catch (e) {
          console.log(`[loadStudentData] Could not get __dirname: ${e.message}`);
        }
        
        // Try multiple possible paths for Vercel serverless functions
        // NOTE: api/data/seat-data.json will be included in the serverless function bundle
        const possiblePaths = [];
        
        // Add paths relative to current file location (most reliable)
        if (currentDir) {
          possiblePaths.push(path.join(currentDir, 'data', 'seat-data.json')); // api/data/seat-data.json
          possiblePaths.push(path.join(currentDir, '..', 'public', 'seat-data.json'));
        }
        
        // Add paths relative to process.cwd()
        possiblePaths.push(
          path.join(process.cwd(), 'api', 'data', 'seat-data.json'),
          path.join(process.cwd(), 'data', 'seat-data.json'),
          path.join(process.cwd(), 'public', 'seat-data.json'),
          path.join(process.cwd(), '..', 'public', 'seat-data.json'),
          path.join(process.cwd(), 'seat-data.json')
        );
        
        // Add absolute paths for Vercel
        possiblePaths.push(
          '/var/task/api/data/seat-data.json',
          '/var/task/data/seat-data.json',
          '/var/task/public/seat-data.json',
          '/var/task/seat-data.json'
        );
        
        console.log(`[loadStudentData] Trying paths:`, possiblePaths);
        
        for (const tryPath of possiblePaths) {
          try {
            console.log(`[loadStudentData] Checking: ${tryPath}`);
            if (fs.existsSync(tryPath)) {
              console.log(`[loadStudentData] ✓ Found file at: ${tryPath}`);
              fileContent = fs.readFileSync(tryPath, 'utf-8');
              loadMethod = `File: ${tryPath}`;
              console.log(`[loadStudentData] ✓ Successfully loaded from file system: ${tryPath} (${fileContent.length} bytes)`);
              break;
            } else {
              console.log(`[loadStudentData] ✗ File does not exist: ${tryPath}`);
            }
          } catch (e) {
            console.log(`[loadStudentData] ✗ File system error for ${tryPath}: ${e.message}`);
            continue;
          }
        }
      }
      
      // STRATEGY 2: Try API endpoint if file system failed
      if (!fileContent) {
        console.log(`[loadStudentData] File system failed, trying API endpoint...`);
        const possibleUrls = [];
        
        // Get the correct base URL
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.VERCEL 
            ? 'https://gradex.vercel.app'
            : 'https://gradex.vercel.app';
        
        possibleUrls.push(`${baseUrl}/api/student-data`);
        possibleUrls.push('https://gradex.vercel.app/api/student-data');
        
        // Try fetching from API endpoint
        for (const url of possibleUrls) {
          try {
            console.log(`[loadStudentData] Attempting to fetch from API: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'GradeX-SeatFinder/1.0',
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              fileContent = JSON.stringify(await response.json());
              loadMethod = `API: ${url}`;
              console.log(`[loadStudentData] ✓ Successfully loaded from API ${url} (${fileContent.length} bytes)`);
              break;
            } else {
              console.log(`[loadStudentData] API ${url} returned status ${response.status}`);
            }
          } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
              console.log(`[loadStudentData] Timeout fetching from ${url}`);
            } else {
              console.log(`[loadStudentData] Error fetching from ${url}: ${fetchError.message}`);
            }
            continue;
          }
        }
      }
      
      // STRATEGY 3: Last resort - try public URL
      if (!fileContent) {
        console.log(`[loadStudentData] API failed, trying public URL as last resort...`);
        const possibleUrls = [
          'https://gradex.vercel.app/seat-data.json',
        ];
        
        for (const url of possibleUrls) {
          try {
            console.log(`[loadStudentData] Attempting to fetch from public URL: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'GradeX-SeatFinder/1.0',
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              fileContent = await response.text();
              loadMethod = `Public URL: ${url}`;
              console.log(`[loadStudentData] ✓ Successfully loaded from public URL ${url} (${fileContent.length} bytes)`);
              break;
            } else {
              console.log(`[loadStudentData] Public URL ${url} returned status ${response.status}`);
            }
          } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
              console.log(`[loadStudentData] Timeout fetching from ${url}`);
            } else {
              console.log(`[loadStudentData] Error fetching from ${url}: ${fetchError.message}`);
            }
            continue;
          }
        }
      }
      
      // Process JSON file content if we got it
      if (!fileContent) {
        const errorMsg = `[loadStudentData] ✗ Failed to load seat-data.json from any source`;
        console.error(errorMsg);
        // Don't throw - return empty map if both Supabase and JSON fail
        studentData = new Map();
        loadMethod = 'Failed - no data source';
      } else {
        // Read and parse the JSON file
        let seatData;
        try {
          seatData = JSON.parse(fileContent);
        } catch (parseError) {
          console.error(`[loadStudentData] JSON parse error: ${parseError.message}`);
          studentData = new Map();
          loadMethod = 'JSON parse error';
        }
        
        if (seatData && Array.isArray(seatData)) {
          console.log(`[loadStudentData] ✓ Parsed JSON successfully: ${seatData.length} entries (loaded via ${loadMethod})`);
          
          // Create a lookup map: RA -> {name} (only name from JSON, department comes from API)
          const lookup = new Map();
          let entriesWithNames = 0;
          
          seatData.forEach((entry, index) => {
            if (!entry || typeof entry !== 'object') {
              console.log(`[loadStudentData] Skipping invalid entry at index ${index}`);
              return;
            }
            
            if (entry.registerNumber && entry.name) {
              const ra = normalizeRA(entry.registerNumber);
              if (ra) {
                // Store the first occurrence or update if we have better data
                if (!lookup.has(ra) || (entry.name && !lookup.get(ra).name)) {
                  lookup.set(ra, {
                    name: entry.name || null,
                    // Department removed - comes from API only
                  });
                  if (entry.name) entriesWithNames++;
                }
              }
            }
          });
          
          studentData = lookup;
          loadMethod = `JSON: ${loadMethod}`;
          console.log(`[loadStudentData] ✓ Created lookup map: ${lookup.size} unique RAs`);
          console.log(`[loadStudentData]   - Entries with names: ${entriesWithNames}`);
        } else {
          console.error(`[loadStudentData] JSON is not an array or invalid`);
          studentData = new Map();
        }
      }
    }
    
    // Test lookup with a known RA
    if (studentData && studentData.size > 0) {
      const testRA = 'RA2311003012124';
      const testResult = studentData.get(normalizeRA(testRA));
      if (testResult) {
        console.log(`[loadStudentData] ✓ Test lookup for ${testRA}: Name=${testResult.name || 'N/A'}`);
      } else {
        console.log(`[loadStudentData] ⚠ Test lookup for ${testRA}: NOT FOUND`);
      }
    }
    
    // Only cache if we have valid data
    if (studentData && studentData.size > 0) {
      studentDataCache = studentData;
      console.log(`[loadStudentData] ✓ Cached ${studentData.size} student records (loaded via ${loadMethod})`);
    } else {
      console.error(`[loadStudentData] ⚠ No valid student data found - not caching empty map`);
      studentDataCache = null; // Don't cache empty data
      studentData = new Map(); // Return empty map instead of null
    }
    
    return studentData || new Map();
    } catch (error) {
      console.error('[loadStudentData] Error loading student data:', error);
      // Don't cache empty map on error - set to null so we retry next time
      studentDataCache = null;
      studentDataLoadPromise = null; // Reset promise so we can retry
      // Return empty map for this request, but don't cache it
      return new Map();
    }
  })();
  
  return studentDataLoadPromise;
}

/**
 * Clear student data cache (useful for debugging or forced reload)
 */
export function clearStudentDataCache() {
  console.log('[clearStudentDataCache] Clearing student data cache');
  studentDataCache = null;
  studentDataLoadPromise = null;
}

/**
 * Lookup student name by RA number (department comes from API)
 * @param {string} ra - Register number
 * @returns {Promise<Object>} - {name} or {name: null}
 */
async function lookupStudentInfo(ra) {
  const normalizedRA = normalizeRA(ra);
  if (!normalizedRA) {
    console.log(`[lookupStudentInfo] Invalid RA: ${ra}`);
    return { name: null };
  }
  
  try {
    const studentData = await loadStudentData();
    const result = studentData.get(normalizedRA) || { name: null };
    console.log(`[lookupStudentInfo] RA: ${normalizedRA}, Found: ${result.name ? 'YES' : 'NO'}, Name: ${result.name || 'N/A'}`);
    return result;
  } catch (error) {
    console.error('Error looking up student info:', error);
    return { name: null };
  }
}

/**
 * Enhance matches with student information
 * @param {Array} matches - Array of match objects
 * @param {string} ra - Register number
 * @returns {Promise<Array>} - Enhanced matches with name and department
 */
async function enhanceMatchesWithStudentInfo(matches, ra) {
  if (!matches || matches.length === 0) {
    return matches;
  }
  
  // Lookup student info once
  const studentInfo = await lookupStudentInfo(ra);
  
  // Add name from JSON, department comes from API (match.department)
  return matches.map(match => ({
    ...match,
    name: studentInfo.name || match.name || null, // Name from JSON
    // Department comes from API (match.department from exam seating data)
    // Keep all other API fields: hall, bench, session, subjectCode, etc.
  }));
}

/**
 * Enhance matches with pre-loaded student information (from JSON)
 * Only name comes from JSON, everything else (department, venue details) comes from API
 * @param {Array} matches - Array of match objects
 * @param {Object} studentInfo - Pre-loaded student info {name} (department removed)
 * @returns {Array} - Enhanced matches with name from JSON, all else from API
 */
function enhanceMatchesWithPreloadedStudentInfo(matches, studentInfo) {
  if (!matches || matches.length === 0) {
    return matches;
  }
  
  console.log(`[enhanceMatchesWithPreloadedStudentInfo] Called with ${matches.length} matches`);
  console.log(`[enhanceMatchesWithPreloadedStudentInfo] studentInfo:`, JSON.stringify(studentInfo));
  
  if (!studentInfo) {
    studentInfo = { name: null };
    console.log(`[enhanceMatchesWithPreloadedStudentInfo] No student info provided, using null values`);
  } else {
    console.log(`[enhanceMatchesWithPreloadedStudentInfo] Enhancing ${matches.length} matches with Name="${studentInfo.name || 'N/A'}"`);
    console.log(`[enhanceMatchesWithPreloadedStudentInfo] studentInfo.name type: ${typeof studentInfo.name}, value: ${studentInfo.name}`);
  }
  
  // Add name from Supabase/JSON, use API for everything else (department, venue details)
  // Ensure both name and venue details are preserved
  const enhanced = matches.map(match => {
    // Use studentInfo.name from Supabase/JSON if it exists
    // Only fall back to match.name if studentInfo.name is null/undefined
    const finalName = (studentInfo && studentInfo.name !== null && studentInfo.name !== undefined && studentInfo.name !== '-')
      ? studentInfo.name
      : (match.name || null);
    
    console.log(`[enhanceMatchesWithPreloadedStudentInfo] Match enhancement:`, {
      originalName: match.name,
      studentInfoName: studentInfo?.name,
      finalName: finalName,
      hasStudentInfo: !!studentInfo,
    });
    
    // Use API department (from match.department) - this comes from exam seating data
    // This is the department from the exam (e.g., "CSE" from "CSE/21MAB201T")
    const finalDept = match.department || null;
    
    // Preserve all venue details from API
    return {
      ...match, // This includes all venue details: hall, bench, session, subjectCode, department, etc.
      name: finalName, // Name from JSON only
      department: finalDept, // Department from API (exam department)
      // Keep all other API fields: hall, bench, session, subjectCode, context, url, etc.
    };
  });
  
  // Log first match for debugging
  if (enhanced.length > 0) {
    const firstMatch = enhanced[0];
    console.log(`[enhanceMatchesWithPreloadedStudentInfo] First match enhanced: Name=${firstMatch.name || 'N/A'}, Dept=${firstMatch.department || 'N/A'}, Hall=${firstMatch.hall || 'N/A'}, Bench=${firstMatch.bench || 'N/A'}, Session=${firstMatch.session || 'N/A'}`);
  }
  
  return enhanced;
}

/**
 * Main function to get seating information
 * @param {string} ra - Register number
 * @param {string} date - Date string (YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY)
 * @returns {Promise<Object>} - Seating information response
 */
export async function getSeatingInfo(ra, date) {
  // Normalize inputs
  const normalizedRA = normalizeRA(ra);
  if (!normalizedRA) {
    return {
      status: 'error',
      error: 'RA number is required',
      lastUpdated: new Date().toISOString(),
      results: {},
    };
  }
  
  // STEP 1: Load student name from Supabase/JSON FIRST (before API fetch)
  // Only name comes from Supabase/JSON, department and venue details come from API
  console.log(`[getSeatingInfo] Pre-loading student name for RA: ${normalizedRA}`);
  console.log(`[getSeatingInfo] Environment check - SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'NOT SET'}, SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
  let studentInfo = { name: null };
  
  // Try multiple times with different strategies
  let studentData = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts && !studentData) {
    attempts++;
    try {
      console.log(`[getSeatingInfo] Attempt ${attempts}/${maxAttempts} to load student data...`);
      studentData = await loadStudentData();
      
      if (studentData && studentData.size > 0) {
        console.log(`[getSeatingInfo] ✓ Student data map loaded: ${studentData.size} records`);
        break;
      } else {
        console.log(`[getSeatingInfo] ⚠ Student data map is empty, clearing cache and retrying...`);
        // Clear cache and retry
        studentDataCache = null;
        studentDataLoadPromise = null;
        studentData = null;
        if (attempts < maxAttempts) {
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error(`[getSeatingInfo] Attempt ${attempts} failed:`, error.message);
      studentDataCache = null;
      studentDataLoadPromise = null;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  // Try direct lookup
  if (studentData && studentData.size > 0) {
    console.log(`[getSeatingInfo] Student data map has ${studentData.size} entries`);
    console.log(`[getSeatingInfo] Looking up RA: "${normalizedRA}"`);
    
    // Check if the exact RA exists in the map
    const hasExactKey = studentData.has(normalizedRA);
    console.log(`[getSeatingInfo] Has exact key "${normalizedRA}": ${hasExactKey}`);
    
    const lookupResult = studentData.get(normalizedRA);
    if (lookupResult) {
      studentInfo = lookupResult;
      console.log(`[getSeatingInfo] ✓ Student found in map: Name="${studentInfo.name || 'N/A'}"`);
    } else {
      console.log(`[getSeatingInfo] ⚠ Student NOT found in map for RA: ${normalizedRA}`);
      // Try case-insensitive search
      let found = false;
      for (const [key, value] of studentData.entries()) {
        if (key.toUpperCase() === normalizedRA.toUpperCase()) {
          studentInfo = value;
          found = true;
          console.log(`[getSeatingInfo] ✓ Student found (case-insensitive): Key="${key}", Name="${studentInfo.name || 'N/A'}"`);
          break;
        }
      }
      if (!found && !studentInfo.name) {
        console.log(`[getSeatingInfo] Sample RAs in map (first 10):`, Array.from(studentData.keys()).slice(0, 10));
        // Check if a close match exists (for debugging)
        const closeMatches = Array.from(studentData.keys()).filter(k => k.includes(normalizedRA.substring(0, 10)));
        if (closeMatches.length > 0) {
          console.log(`[getSeatingInfo] Close matches found:`, closeMatches.slice(0, 3));
        }
        console.log(`[getSeatingInfo] No exact match found for RA: ${normalizedRA}`);
      }
    }
  } else {
    console.error(`[getSeatingInfo] ✗ Failed to load student data after ${maxAttempts} attempts`);
    console.error(`[getSeatingInfo] studentData is:`, studentData ? `Map with ${studentData.size} entries` : 'null/undefined');
  }
  
  // Fallback: Direct Supabase lookup if map lookup failed
  if (!studentInfo || !studentInfo.name) {
    try {
      console.log(`[getSeatingInfo] Attempting direct Supabase lookup for RA: ${normalizedRA}`);
      const { supabase: supabaseClient, isSupabaseConfigured } = await import('./supabase-client.js');
      if (isSupabaseConfigured() && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('students')
          .select('name')
          .eq('register_number', normalizedRA)
          .single();
        
        if (!error && data && data.name) {
          studentInfo = { name: data.name };
          console.log(`[getSeatingInfo] ✓ Direct Supabase lookup successful: Name="${studentInfo.name}"`);
        } else if (error) {
          console.log(`[getSeatingInfo] Direct Supabase lookup error: ${error.message}`);
        }
      }
    } catch (fallbackError) {
      console.error(`[getSeatingInfo] Direct Supabase fallback failed:`, fallbackError.message);
    }
  }
  
  // Check cache first
  const cached = getCachedResult(normalizedRA, date);
  if (cached) {
    // Enhance cached results with pre-loaded student information
    const enhancedCachedResults = {};
    for (const [campusName, matches] of Object.entries(cached.results || {})) {
      enhancedCachedResults[campusName] = enhanceMatchesWithPreloadedStudentInfo(matches, studentInfo);
    }
    
    return {
      ...cached,
      results: enhancedCachedResults,
      cached: true,
    };
  }
  
  // Generate date variants
  const dateVariants = date ? generateDateVariants(date) : [];
  
  // STEP 2: Fetch from all campuses in parallel (with delays handled internally)
  const campusNames = Object.keys(CAMPUS_ENDPOINTS);
  const fetchPromises = campusNames.map(campusName =>
    fetchCampusSeating(campusName, normalizedRA, dateVariants)
  );
  
  const campusResults = await Promise.allSettled(fetchPromises);
  
  // Build results object
  const results = {};
  let hasErrors = false;
  
  campusResults.forEach((result, index) => {
    const campusName = campusNames[index];
    
    if (result.status === 'fulfilled') {
      results[campusName] = result.value;
    } else {
      hasErrors = true;
      results[campusName] = [];
      // Log as warning, not error - some campuses may not be available
      const errorMsg = result.reason?.message || String(result.reason);
      if (errorMsg.includes('404')) {
        console.log(`[${campusName}] Not available (404) - skipping`);
      } else {
        console.warn(`[${campusName}] Failed to fetch:`, errorMsg);
      }
    }
  });
  
  // STEP 3: Enhance all matches with pre-loaded student information
  // Use the student info we loaded at the start (from JSON)
  console.log(`[getSeatingInfo] About to enhance results with studentInfo:`, JSON.stringify(studentInfo));
  const enhancedResults = {};
  for (const [campusName, matches] of Object.entries(results)) {
    console.log(`[getSeatingInfo] Enhancing ${matches.length} matches for ${campusName}`);
    const enhanced = enhanceMatchesWithPreloadedStudentInfo(matches, studentInfo);
    enhancedResults[campusName] = enhanced;
    if (enhanced.length > 0) {
      console.log(`[getSeatingInfo] First enhanced match for ${campusName}:`, JSON.stringify(enhanced[0]));
    }
  }
  
  // Build response
  const response = {
    status: hasErrors ? 'partial' : 'ok',
    lastUpdated: new Date().toISOString(),
    results: enhancedResults,
  };
  
  // Cache the result
  setCachedResult(normalizedRA, date, response);
  
  return response;
}

