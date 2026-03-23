#!/usr/bin/env node

/**
 * Deploy Register Fix to GitHub via API
 * Pushes the updated server.js that includes JWT token in register response
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = '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';
const OWNER = 'tomxr14';
const REPO = 'tomarscloud';
const FILE_PATH = 'server.js';

console.log('🚀 Deploying register fix to GitHub...\n');

function makeRequest(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: pathname,
      method: method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node.js',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function deploy() {
  try {
    // Step 1: Get current file SHA
    console.log('📋 Getting current server.js...');
    const getPath = `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
    const getRes = await makeRequest('GET', getPath);
    
    if (getRes.status !== 200) {
      throw new Error(`Failed to get file: ${getRes.body.message}`);
    }
    
    const currentSha = getRes.body.sha;
    console.log(`✅ Current SHA: ${currentSha.substring(0, 8)}\n`);

    // Step 2: Read local file and encode
    console.log('📄 Reading local server.js...');
    const fileContent = fs.readFileSync('server.js', 'utf8');
    const encodedContent = Buffer.from(fileContent).toString('base64');
    console.log(`✅ File size: ${fileContent.length} bytes\n`);

    // Step 3: Update file on GitHub
    console.log('🔄 Updating server.js on GitHub...');
    const updateBody = JSON.stringify({
      message: 'Deploy: Register endpoint now returns JWT token for automatic login',
      content: encodedContent,
      sha: currentSha
    });

    const updateRes = await makeRequest('PUT', getPath, updateBody);
    
    if (updateRes.status !== 200) {
      throw new Error(`Failed to update file: ${updateRes.body.message}`);
    }

    const newSha = updateRes.body.commit.sha;
    console.log(`✅ Updated: ${newSha.substring(0, 8)}\n`);

    console.log('═══════════════════════════════════════');
    console.log('✨ DEPLOYMENT SUCCESSFUL!\n');
    console.log('📍 Changes pushed to GitHub');
    console.log('🚂 Railway will auto-deploy in 1-2 minutes');
    console.log('═══════════════════════════════════════\n');

    console.log('What was fixed:');
    console.log('  ✅ Register endpoint now returns JWT token');
    console.log('  ✅ Users can login immediately after signup');
    console.log('  ✅ All buttons will work after registration\n');

    console.log('Test at: https://tomarscloud.odd-leaf-4538.workers.dev');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

deploy();
