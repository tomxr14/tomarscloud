#!/usr/bin/env node
/**
 * Set Railway environment variables via API
 */

const https = require('https');

const GITHUB_TOKEN = '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';
const PROJECT_ID = 'stellar-heart'; // From your URL
const SERVICE_ID = 'web'; // The backend service

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.railway.app',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('⚙️  You need to set Railway environment variables manually.\n');
  console.log('Go to: https://railway.app/project/stellar-heart/services');
  console.log('Click the "web" service → Variables tab\n');
  console.log('Add these variables:');
  console.log('  MONGODB_URI=mongodb+srv://tomaranurag:Window$12@tomar.bllqvnm.mongodb.net/tomarscloud?retryWrites=true&w=majority');
  console.log('  JWT_SECRET=tomarscloud_secret_key_2026');
  console.log('  PORT=3000');
  console.log('  NODE_ENV=production\n');
  console.log('Once added, Railway will auto-rebuild and deploy ✅');
}

main();
