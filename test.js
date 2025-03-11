const https = require('https');
const { URL } = require('url');
const zlib = require('zlib');
const { promisify } = require('util');
const brotliDecompress = promisify(zlib.brotliDecompress);

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'br, gzip, deflate',
        'Connection': 'keep-alive',
        'Cookie': 'CONSENT=YES+GB.en+202510+170+666',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 10000
    };

    console.log('Making request with options:', {
      hostname: options.hostname,
      path: options.path,
      headers: options.headers
    });

    const req = https.request(options, async (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);

      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) {
          reject(new Error('Too many redirects'));
          return;
        }

        console.log('Following redirect to:', res.headers.location);
        try {
          const result = await fetchUrl(res.headers.location, maxRedirects - 1);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      }

      // Collect response chunks
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          let data;

          // Handle different content encodings
          const encoding = res.headers['content-encoding'];
          if (encoding === 'br') {
            data = await brotliDecompress(buffer);
          } else if (encoding === 'gzip') {
            data = await promisify(zlib.gunzip)(buffer);
          } else if (encoding === 'deflate') {
            data = await promisify(zlib.inflate)(buffer);
          } else {
            data = buffer;
          }

          const text = data.toString('utf-8');
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('Request timeout');
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

async function main() {
  const url = 'https://www.google.com/travel/flights/search?tfs=CBwQAhogEgoyMDI1LTA2LTE1KABqBwgBEgNNQURyBwgBEgNQTUlAAUgBcAGCAQsI____________AZgBAg&tfu=EgYIAxAAGAA&hl=en';
  
  try {
    console.log('Fetching URL:', url);
    const html = await fetchUrl(url);
    console.log('Response length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));

    // Save the response to a file for inspection
    const fs = require('fs');
    fs.writeFileSync('response.html', html);
    console.log('Full response saved to response.html');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();