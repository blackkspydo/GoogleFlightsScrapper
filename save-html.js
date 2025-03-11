import fs from 'fs';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Simplified version of protobuf encoding
function encodeFlightSearch(originCode, destinationCode, date) {
  const search = {
    field1: 28,
    field2: 2,
    flightInfo: {
      date,
      filterStops: 0,
      origin: {
        field1: 1,
        code: originCode,
      },
      destination: {
        field1: 1,
        code: destinationCode,
      },
    },
    field8: 1,
    field9: 1,
    field14: 1,
    field16: {
      field1: Number.MAX_SAFE_INTEGER, // Use this instead of BigInt for simplicity
    },
    field19: 2,
  };

  // Convert to base64url
  const data = Buffer.from(JSON.stringify(search)).toString('base64url');
  return data;
}

async function saveHtml() {
  const originCode = 'MAD';
  const destinationCode = 'PMI';
  const date = '2025-06-15';

  try {
    // Use the simplified encoding
    const encoded = encodeFlightSearch(originCode, destinationCode, date);

    // Build URL
    const url = `https://www.google.com/travel/flights/search?tfs=${encoded}&tfu=EgYIAxAAGAA&hl=en`;
    console.log('Generated URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cookie': 'CONSENT=YES+GB.en+202510+170+666'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    fs.writeFileSync('response.html', html);
    console.log('HTML saved to response.html');

    // Also save a prettified version for easier analysis
    const pretty = html
      .replace(/></g, '>\n<')
      .replace(/\n\s+/g, '\n')
      .trim();
    fs.writeFileSync('response-pretty.html', pretty);
    console.log('Prettified HTML saved to response-pretty.html');

    // Log some useful info for analysis
    console.log('\nHTML Analysis:');
    console.log('Total length:', html.length);
    console.log('Contains flight list:', html.includes('li.pIav2d'));
    console.log('Sample selectors found:');
    [
      'li.pIav2d',
      '.JMc5Xc',
      '.QylvBf',
      '.gvkrdb',
      '.sSHqwe',
      '.EbY4Pc',
      '.NZRfve',
      '.YMlIz'
    ].forEach(selector => {
      console.log(`- ${selector}: ${html.includes(selector)}`);
    });

  } catch (error) {
    console.error('Failed to fetch HTML:', error);
  }
}

saveHtml();