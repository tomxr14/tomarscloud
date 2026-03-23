#!/usr/bin/env node
/**
 * Check Cloudflare Pages projects
 */

const https = require('https');

const CLOUDFLARE_TOKEN = 'cfk_fCQDOwwmtM0r9eGL6D7VsE1zWEsgYAK8GLmDh5gefee31672';
const ACCOUNT_ID = '3d75d8a96cd9f64955ff2a93467d9a3a';

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
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
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 Checking Cloudflare Pages projects...\n');

    const resp = await apiRequest(`/accounts/${ACCOUNT_ID}/pages/projects`);

    if (resp.status === 200 && resp.data.success) {
      const projects = resp.data.result;

      if (projects.length === 0) {
        console.log('❌ No Pages projects found.\n');
        console.log('You need to create a new one:');
        console.log('  1. Go to https://pages.cloudflare.com');
        console.log('  2. Click "Create project"');
        console.log('  3. Connect to Git → tomxr14/tomarscloud');
        console.log('  4. Build settings: npm run build → dist');
        console.log('  5. Deploy!\n');
      } else {
        console.log(`✅ Found ${projects.length} project(s):\n`);
        projects.forEach(p => {
          console.log(`📋 Project: ${p.name}`);
          console.log(`   URL: https://${p.subdomain}.pages.dev`);
          console.log(`   Status: ${p.latest_deployment?.status || 'unknown'}`);
          console.log();
        });
      }
    } else {
      console.log('❌ Error fetching projects:');
      console.log(resp.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
