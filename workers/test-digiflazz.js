/**
 * Digiflazz API Test Script
 *
 * Purpose: Test API connection and verify credentials
 *
 * Usage: node test-digiflazz.js
 *
 * Documentation:
 * - Signature format: MD5(username + apiKey + command_string)
 * - Command mapping:
 *   - cmd: "deposit" -> sign dari: "depo"
 *   - cmd: "prepaid" -> sign dari: "pricelist"
 *   - cmd: "pasca" -> sign dari: "pricelist"
 */

const https = require('https');
const crypto = require('crypto');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // Development or Production credentials
  username: 'kemikegwdEJo',
  apiKey: 'dev-b11acd60-810e-11f1-b9f1-7df8eb84eb16',  // Development Key
  // apiKey: 'ebc8d480-f61a-57da-a478-b7579e729c12',  // Production Key
};

// Command to signature string mapping
const SIGNATURE_MAP = {
  'deposit': 'depo',
  'prepaid': 'pricelist',
  'pasca': 'pricelist',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate signature MD5
 * Format: MD5(username + apiKey + command_string)
 */
function generateSignature(cmd) {
  const signCmd = SIGNATURE_MAP[cmd] || cmd;
  const data = CONFIG.username + CONFIG.apiKey + signCmd;
  console.log(`  → Data: "${CONFIG.username}" + "[apiKey]" + "${signCmd}"`);
  return crypto.createHash('md5').update(data).digest('hex');
}

// ============================================
// API REQUEST FUNCTION
// ============================================
function makeRequest(path, postData) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(postData);

    const options = {
      hostname: 'api.digiflazz.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    console.log('\n📤 REQUEST:');
    console.log(`   URL: https://${options.hostname}${path}`);
    console.log(`   Body: ${dataString}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('📥 RESPONSE:');
        console.log(`   Status: ${res.statusCode}`);

        try {
          const parsed = JSON.parse(responseData);
          console.log(`   Data: ${responseData}`);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + responseData));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(dataString);
    req.end();
  });
}

// ============================================
// TESTS
// ============================================

async function testCekSaldo() {
  console.log('\n' + '═'.repeat(50));
  console.log('🧪 TEST 1: CEK SALDO (Deposit)');
  console.log('═'.repeat(50));

  const cmd = 'deposit';
  const sign = generateSignature(cmd);

  console.log(`   Signature: ${sign}`);

  try {
    const result = await makeRequest('/v1/cek-saldo', {
      cmd: cmd,
      username: CONFIG.username,
      sign: sign
    });

    if (result.data?.deposit !== undefined) {
      console.log('\n✅ SUCCESS!');
      console.log(`   Deposit: Rp ${result.data.deposit.toLocaleString('id-ID')}`);
    } else if (result.data?.rc) {
      console.log('\n❌ FAILED!');
      console.log(`   RC: ${result.data.rc}`);
      console.log(`   Message: ${result.data.message}`);
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

async function testPriceList() {
  console.log('\n' + '═'.repeat(50));
  console.log('🧪 TEST 2: DAFTAR HARGA (Price List)');
  console.log('═'.repeat(50));

  const cmd = 'prepaid';
  const sign = generateSignature(cmd);

  console.log(`   Signature: ${sign}`);

  try {
    const result = await makeRequest('/v1/price-list', {
      cmd: cmd,
      username: CONFIG.username,
      sign: sign
    });

    if (result.data && Array.isArray(result.data)) {
      console.log('\n✅ SUCCESS!');
      console.log(`   Product Count: ${result.data.length}`);
      if (result.data.length > 0) {
        console.log('   Sample Product:');
        console.log(`   - ${JSON.stringify(result.data[0], null, 2).split('\n').join('\n     ')}`);
      }
    } else if (result.data?.rc) {
      console.log('\n❌ FAILED!');
      console.log(`   RC: ${result.data.rc}`);
      console.log(`   Message: ${result.data.message}`);
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       DIGIFLAZZ API TEST SCRIPT                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  console.log('\n📋 Configuration:');
  console.log(`   Username: ${CONFIG.username}`);
  console.log(`   API Key: ${CONFIG.apiKey.substring(0, 20)}...`);
  console.log(`   Mode: ${CONFIG.apiKey.startsWith('dev') ? 'Development' : 'Production'}`);

  console.log('\n📖 Signature Format:');
  console.log('   MD5(username + apiKey + command_string)');
  console.log('   Command mapping:');
  console.log('   - cmd: "deposit" → sign dari: "depo"');
  console.log('   - cmd: "prepaid" → sign dari: "pricelist"');

  await testCekSaldo();
  await testPriceList();

  console.log('\n' + '═'.repeat(50));
  console.log('📝 RC Codes Reference:');
  console.log('═'.repeat(50));
  console.log(`
   RC 00: Transaksi Sukses
   RC 01: Transaksi Pending
   RC 02: Transaksi Gagal
   RC 40: Payload Error (tipe data tidak sesuai)
   RC 41: Signature Salah (cek API key & mode)
   RC 45: IP tidak di-whitelist
  `);
}

// Run
main();
