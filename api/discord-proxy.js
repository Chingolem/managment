export default async function handler(req, res) {
  // Set CORS headers for local development if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url, method, headers, body, isMultipart, fileContent, fileName } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'Missing target URL' });
  }

  // Validate that the URL is to Discord
  try {
    const parsedUrl = new URL(url);
    const allowedHosts = ['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com'];
    const hostname = parsedUrl.hostname.toLowerCase();
    
    const isAllowed = allowedHosts.some(host => hostname === host || hostname.endsWith('.' + host));
    if (!isAllowed) {
      return res.status(400).json({ message: 'Target URL host is not allowed. Only Discord domains are permitted.' });
    }
  } catch (err) {
    return res.status(400).json({ message: 'Invalid target URL format' });
  }

  try {
    const fetchOptions = {
      method: method || 'GET',
      headers: headers || {}
    };

    if (isMultipart) {
      const discordFormData = new FormData();
      const blob = new Blob([fileContent], { type: 'text/csv' });
      discordFormData.append('files[0]', blob, fileName || 'Report.csv');
      
      if (body) {
        discordFormData.append('payload_json', typeof body === 'string' ? body : JSON.stringify(body));
      }
      
      fetchOptions.body = discordFormData;
      
      // Remove content-type to let fetch generate the boundary
      if (fetchOptions.headers) {
        delete fetchOptions.headers['Content-Type'];
        delete fetchOptions.headers['content-type'];
      }
    } else if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (fetchOptions.headers && !fetchOptions.headers['Content-Type'] && !fetchOptions.headers['content-type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const discordRes = await fetch(url, fetchOptions);
    const contentType = discordRes.headers.get('content-type') || '';

    let resData;
    if (contentType.includes('application/json')) {
      resData = await discordRes.json();
    } else {
      resData = { text: await discordRes.text() };
    }

    return res.status(discordRes.status).json(resData);
  } catch (error) {
    console.error('Discord proxy error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
