/**
 * Cloudflare Worker - Digiflazz API Proxy
 *
 * Purpose: Provides a fixed outbound IP for Digiflazz API calls
 * Digiflazz requires IP whitelist, and Vercel uses dynamic IPs
 * This worker acts as a relay with a static IP
 *
 * Setup:
 * 1. Deploy this worker to Cloudflare Workers
 * 2. Note the assigned IPv4 address (or use Cloudflare's dedicated IP)
 * 3. Whitelist that IP in Digiflazz dashboard
 * 4. Update DIGIFLAZZ_API_URL to point to this worker
 */

const DIGIFLAZZ_API_URL = 'https://api.digiflazz.com/v1';
const API_USERNAME = ''; // Set via Cloudflare Dashboard or env
const API_KEY = ''; // Set via Cloudflare Dashboard or env

/**
 * Generate signature for Digiflazz API
 */
function generateSignature(jsonBody) {
  // Digiflazz signature format: username + api_key + json_body
  const data = `${API_USERNAME}${API_KEY}${jsonBody}`;
  return require('crypto').createHash('md5').update(data).digest('hex');
}

/**
 * Handle incoming requests
 */
async function handleRequest(request) {
  const url = new URL(request.url);

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    console.log(`[Digiflazz Worker] Action: ${action}`, JSON.stringify(data));

    // Build Digiflazz request
    const postData = {
      username: API_USERNAME,
      sign: generateSignature(JSON.stringify(data)),
      ...data
    };

    // Forward to Digiflazz
    const digiflazzResponse = await fetch(`${DIGIFLAZZ_API_URL}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    const responseData = await digiflazzResponse.json();
    console.log(`[Digiflazz Worker] Response:`, JSON.stringify(responseData));

    return new Response(JSON.stringify(responseData), {
      status: digiflazzResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error(`[Digiflazz Worker] Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cloudflare Workers entry point
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
