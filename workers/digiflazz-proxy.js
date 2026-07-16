/**
 * Digiflazz API Proxy Server
 *
 * Purpose: Provides a static IP endpoint for Digiflazz API calls
 * Digiflazz requires IP whitelist, and Vercel uses dynamic IPs
 * This server acts as a relay with static VPS IP
 *
 * Endpoint: https://api.topupkilat.store
 *
 * Setup:
 * 1. Deploy to VPS: /var/www/digiflazz-proxy/
 * 2. Run with PM2: pm2 start index.js --name digiflazz-proxy
 * 3. Setup Nginx reverse proxy with SSL
 * 4. Test: curl https://api.topupkilat.store/health
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');

// ============== KONFIGURASI ==============
const CONFIG = {
  DIGIFLAZZ_API_URL: 'https://api.digiflazz.com/v1',
  API_USERNAME: 'kemikegwdEJo',
  API_KEY: 'ebc8d480-f61a-57da-a478-b7579e729c12',  // Production Key
  PORT: 3000,
};

// ============== HELPER FUNCTIONS ==============

/**
 * Mapping command ke signature string
 *
 * IMPORTANT: Signature dihitung dari command STRING, bukan dari cmd di body!
 *
 * CMD di Body    | Sign dari
 * -------------- | ----------
 * deposit        | depo
 * prepaid        | pricelist
 * pasca          | pricelist
 * topup          | ref_id (dari body)
 */
const SIGNATURE_MAP = {
  'deposit': 'depo',
  'prepaid': 'pricelist',
  'pasca': 'pricelist',
};

/**
 * Generate MD5 signature untuk Digiflazz API
 * Format: MD5(username + apiKey + command_string)
 *
 * @param {string} cmd - Command (deposit, prepaid, topup, etc.)
 * @param {string} refId - Ref ID untuk topup (optional)
 * @returns {string} MD5 hash
 */
function generateSignature(cmd, refId = null) {
  let signCmd = SIGNATURE_MAP[cmd] || cmd;

  // Untuk topup, signature dari ref_id
  if (cmd === 'topup' && refId) {
    signCmd = refId;
    console.log(`[SIG] Topup: signature dari ref_id = "${refId}"`);
  }

  const data = CONFIG.API_USERNAME + CONFIG.API_KEY + signCmd;
  console.log(`[SIG] Generate: username + apiKey + "${signCmd}"`);
  return crypto.createHash('md5').update(data).digest('hex');
}

// ============== REQUEST HANDLER ==============

const server = http.createServer(async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');

  console.log(`[${requestId}] ${req.method} ${req.url}`);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.end('{}');
  }

  // Health check endpoint
  if (req.url === '/health') {
    return res.end(JSON.stringify({
      success: true,
      message: 'Digiflazz Proxy is running',
      timestamp: new Date().toISOString(),
      endpoint: 'https://api.topupkilat.store'
    }));
  }

  // Collect body
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    await handleRequest(req, res, body, requestId);
  });
});

/**
 * Handle proxy request
 */
async function handleRequest(req, res, body, requestId) {
  try {
    let requestBody = {};

    // Parse body JSON
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (e) {
        console.log(`[${requestId}] Failed to parse JSON:`, body);
      }
    }

    // Add signature if cmd exists
    if (requestBody.cmd) {
      requestBody.username = CONFIG.API_USERNAME;

      // Untuk topup, signature dari ref_id
      if (requestBody.cmd === 'topup') {
        requestBody.sign = generateSignature(requestBody.cmd, requestBody.ref_id);
      } else {
        requestBody.sign = generateSignature(requestBody.cmd);
      }

      console.log(`[${requestId}] CMD: ${requestBody.cmd}, Sign: ${requestBody.sign}`);
    }

    // Determine path based on cmd
    let path = '/v1/transaction';  // default for topup
    if (requestBody.cmd === 'deposit') {
      path = '/v1/cek-saldo';
    } else if (requestBody.cmd === 'prepaid' || requestBody.cmd === 'pasca') {
      path = '/v1/price-list';
    }

    const dataString = JSON.stringify(requestBody);

    console.log(`[${requestId}] Forwarding to: ${CONFIG.DIGIFLAZZ_API_URL}${path}`);
    console.log(`[${requestId}] Body:`, dataString);

    const options = {
      hostname: 'api.digiflazz.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
      },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let responseData = '';
      proxyRes.on('data', chunk => responseData += chunk);
      proxyRes.on('end', () => {
        console.log(`[${requestId}] Digiflazz Response:`, responseData);
        res.end(responseData);
      });
    });

    proxyReq.on('error', (error) => {
      console.error(`[${requestId}] Proxy Error:`, error.message);
      res.end(JSON.stringify({
        success: false,
        message: 'Failed to connect to Digiflazz',
        error: error.message
      }));
    });

    proxyReq.write(dataString);
    proxyReq.end();

  } catch (error) {
    console.error(`[${requestId}] Error:`, error.message);
    res.end(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }));
  }
}

// ============== START SERVER ==============

server.listen(CONFIG.PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('Digiflazz Proxy Server Running!');
  console.log(`Port: ${CONFIG.PORT}`);
  console.log(`URL: http://103.169.207.161:${CONFIG.PORT}`);
  console.log(`SSL: https://api.topupkilat.store`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
});
