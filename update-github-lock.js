#!/usr/bin/env node
/**
 * Update package-lock.json on GitHub
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
    console.log('📝 Updating package-lock.json on GitHub...\n');

    // Read local package-lock.json
    const lockContent = fs.readFileSync('package-lock.json', 'utf8');
    const content = Buffer.from(lockContent).toString('base64');

    // Get current file SHA
    const getResp = await apiRequest('GET', 
      `/repos/${OWNER}/${REPO}/contents/package-lock.json?ref=${BRANCH}`
    );

    if (getResp.status !== 200) {
      console.log('❌ Failed to get current file');
      process.exit(1);
    }

    const currentSha = getResp.data.sha;

    // Update file
    const updateResp = await apiRequest('PUT',
      `/repos/${OWNER}/${REPO}/contents/package-lock.json`,
      {
        message: 'Fix: Update package-lock.json with vite v6 dependencies',
        content: content,
        sha: currentSha,
        branch: BRANCH
      }
    );

    if (updateResp.status === 200) {
      console.log(`✅ Updated package-lock.json on GitHub`);
      console.log(`   New SHA: ${updateResp.data.content.sha.substring(0, 7)}`);
      console.log('\n🚀 Railway is rebuilding now!');
      console.log('   Check: https://railway.app/project/stellar-heart/services\n');
    } else {
      console.log('❌ Update failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
