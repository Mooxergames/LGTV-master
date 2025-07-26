
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const hostname = '0.0.0.0';
const port = 5000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Add CORS headers for better browser compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Construct file path
  const filePath = path.join(__dirname, pathname);
  
  // Get file extension for MIME type
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Log the missing file for debugging
      console.log(`File not found: ${pathname}`);
      
      // For missing JS files, try to serve a fallback or empty response
      if (ext === '.js') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/javascript');
        res.end('console.log("File not found: ' + pathname + '");');
        return;
      }
      
      // File not found
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>404 Not Found</h1><p>File: ' + pathname + '</p>');
      return;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file ${pathname}:`, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>500 Internal Server Error</h1>');
        return;
      }
      
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeType);
      res.end(data);
    });
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Serving WebOS TV App - FLIX IPTV`);
});
