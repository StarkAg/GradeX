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
    
    // Fallback: Try GET request to base URL
    if (!html || html.length < 5000) {
      try {
        html = await fetchPage(`${campusConfig.base}/report.php`, 12000, 1);
        fetchUrl = `${campusConfig.base}/report.php`;
      } catch (e) {
        console.error(`Error fetching ${campusName} base URL:`, e.message);
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
 * Load student data from seat-data.json
 * @returns {Promise<Map>} - Map of RA -> {name, department}
 */
async function loadStudentData() {
  // Return cached data if already loaded
  if (studentDataCache) {
    return studentDataCache;
  }
  
  // If already loading, wait for that promise
  if (studentDataLoadPromise) {
    return studentDataLoadPromise;
  }
  
  // Start loading
  studentDataLoadPromise = (async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try multiple possible paths for Vercel serverless functions
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'seat-data.json'),
        path.join(process.cwd(), '..', 'public', 'seat-data.json'),
        path.join(process.cwd(), 'seat-data.json'),
      ];
      
      // Try to get __dirname equivalent for ES modules
      try {
        const { fileURLToPath } = await import('url');
        const currentFileUrl = import.meta.url;
        const currentFilePath = fileURLToPath(currentFileUrl);
        const currentDir = path.dirname(currentFilePath);
        possiblePaths.unshift(path.join(currentDir, '..', 'public', 'seat-data.json'));
      } catch (e) {
        // __dirname not available, continue with other paths
      }
      
      let fileContent = null;
      let publicPath = null;
      
      for (const tryPath of possiblePaths) {
        try {
          if (fs.existsSync(tryPath)) {
            fileContent = fs.readFileSync(tryPath, 'utf-8');
            publicPath = tryPath;
            break;
          }
        } catch (e) {
          // Try next path
          continue;
        }
      }
      
      if (!fileContent) {
        throw new Error(`Could not find seat-data.json in any of the expected paths: ${possiblePaths.join(', ')}`);
      }
      
      // Read and parse the JSON file
      const seatData = JSON.parse(fileContent);
      
      // Create a lookup map: RA -> {name, department}
      const lookup = new Map();
      
      seatData.forEach(entry => {
        if (entry.registerNumber && (entry.name || entry.department)) {
          const ra = normalizeRA(entry.registerNumber);
          if (ra) {
            // Store the first occurrence or update if we have better data
            if (!lookup.has(ra) || (entry.name && !lookup.get(ra).name)) {
              lookup.set(ra, {
                name: entry.name || null,
                department: entry.department || null,
              });
            }
          }
        }
      });
      
      studentDataCache = lookup;
      return lookup;
    } catch (error) {
      console.error('Error loading student data:', error);
      // Return empty map on error
      studentDataCache = new Map();
      return studentDataCache;
    }
  })();
  
  return studentDataLoadPromise;
}

/**
 * Lookup student name and department by RA number
 * @param {string} ra - Register number
 * @returns {Promise<Object>} - {name, department} or {name: null, department: null}
 */
async function lookupStudentInfo(ra) {
  const normalizedRA = normalizeRA(ra);
  if (!normalizedRA) {
    return { name: null, department: null };
  }
  
  try {
    const studentData = await loadStudentData();
    return studentData.get(normalizedRA) || { name: null, department: null };
  } catch (error) {
    console.error('Error looking up student info:', error);
    return { name: null, department: null };
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
  
  // Add name and student department to each match (preserve exam department)
  return matches.map(match => ({
    ...match,
    name: studentInfo.name,
    studentDepartment: studentInfo.department, // Student's department from JSON
    // Keep match.department as the exam department (e.g., "CSE" from "CSE/21MAB201T")
  }));
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
  
  // Check cache first
  const cached = getCachedResult(normalizedRA, date);
  if (cached) {
    // Enhance cached results with student information
    const enhancedCachedResults = {};
    for (const [campusName, matches] of Object.entries(cached.results || {})) {
      enhancedCachedResults[campusName] = await enhanceMatchesWithStudentInfo(matches, normalizedRA);
    }
    
    return {
      ...cached,
      results: enhancedCachedResults,
      cached: true,
    };
  }
  
  // Generate date variants
  const dateVariants = date ? generateDateVariants(date) : [];
  
  // Fetch from all campuses in parallel (with delays handled internally)
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
      console.error(`Failed to fetch ${campusName}:`, result.reason);
    }
  });
  
  // Enhance all matches with student information (name and department)
  const enhancedResults = {};
  for (const [campusName, matches] of Object.entries(results)) {
    enhancedResults[campusName] = await enhanceMatchesWithStudentInfo(matches, normalizedRA);
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

