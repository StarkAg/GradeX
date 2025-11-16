/**
 * Vercel Serverless Function: Student Data API
 * GET /api/student-data
 * 
 * Serves the student data JSON file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    res.status(405).json({
      status: 'error',
      error: 'Method not allowed',
    });
    return;
  }
  
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'seat-data.json'),
      path.join(process.cwd(), '..', 'public', 'seat-data.json'),
      path.join(__dirname, '..', 'public', 'seat-data.json'),
    ];
    
    let fileContent = null;
    let filePath = null;
    
    for (const tryPath of possiblePaths) {
      try {
        if (fs.existsSync(tryPath)) {
          fileContent = fs.readFileSync(tryPath, 'utf-8');
          filePath = tryPath;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!fileContent) {
      console.error(`[student-data] Could not find seat-data.json in: ${possiblePaths.join(', ')}`);
      res.status(404).json({
        status: 'error',
        error: 'Student data file not found',
      });
      return;
    }
    
    // Parse to validate JSON
    const data = JSON.parse(fileContent);
    
    // Return the JSON data
    res.status(200).json(data);
  } catch (error) {
    console.error('Student Data API Error:', error);
    
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error.message,
    });
  }
}

