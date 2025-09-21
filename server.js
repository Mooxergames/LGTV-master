
const http = require('http');
const https = require('https');
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
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Handle proxy requests to external API
  if (pathname.startsWith('/api/proxy/')) {
    const apiEndpoint = pathname.replace('/api/proxy/', '');
    const targetUrl = `https://flixapp.net/api/${apiEndpoint}`;
    
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const postData = body || '';
      
      const options = {
        method: req.method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        res.statusCode = proxyRes.statusCode;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');  // CORS Solution!
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        let responseData = '';
        proxyRes.on('data', chunk => {
          responseData += chunk;
        });
        
        proxyRes.on('end', () => {
          res.end(responseData);
        });
      });
      
      proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');  // CORS Solution!
        res.end('Proxy request failed');
      });
      
      if (postData) {
        proxyReq.write(postData);
      }
      proxyReq.end();
    });
    
    return;
  }
  
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
      // File not found
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
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
