#!/usr/bin/env node
/**
 * Push Dashboard.jsx with live Railway URL to GitHub
 */

const https = require('https');
const fs = require('fs');

const TOKEN = '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';
const OWNER = 'tomxr14';
const REPO = 'tomarscloud';
const BRANCH = 'main';

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js'
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      options.headers['Content-Type'] = 'application/json';
    }

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
  try {
    console.log('📤 Pushing Dashboard.jsx to GitHub with live Railway URL...\n');

    // Read Dashboard.jsx
    const content = fs.readFileSync('Dashboard.jsx', 'utf8');
    const base64Content = Buffer.from(content).toString('base64');

    // Get current file SHA
    const getResp = await apiRequest('GET',
      `/repos/${OWNER}/${REPO}/contents/Dashboard.jsx?ref=${BRANCH}`
    );

    if (getResp.status !== 200) {
      console.log('❌ Could not get current Dashboard.jsx');
      process.exit(1);
    }

    const currentSha = getResp.data.sha;

    // Update file
    const updateResp = await apiRequest('PUT',
      `/repos/${OWNER}/${REPO}/contents/Dashboard.jsx`,
      {
        message: 'Live: Connect frontend to Railway backend at https://web-production-57dae.up.railway.app',
        content: base64Content,
        sha: currentSha,
        branch: BRANCH
      }
    );

    if (updateResp.status === 200) {
      console.log('✅ Dashboard.jsx pushed to GitHub!');
      console.log(`   New SHA: ${updateResp.data.content.sha.substring(0, 7)}\n`);
      console.log('🚀 Cloudflare Pages will auto-rebuild in 30-60 seconds...\n');
      console.log('📍 Your app will be live at: https://tomarscloud.pages.dev\n');
      console.log('⏳ Give it 2 minutes, then visit that URL! 🎉\n');
    } else {
      console.log('❌ Push failed:', updateResp.data);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
