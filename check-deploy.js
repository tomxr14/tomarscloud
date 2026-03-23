#!/usr/bin/env node
/**
 * Monitor Railway deployment and get the live URL once deployed
 */

const https = require('https');

const TOKEN = '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';
const OWNER = 'tomxr14';
const REPO = 'tomarscloud';

function apiRequest(method, path) {
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
  console.log('⏳ Checking Railway deployment status...\n');
  console.log('Note: Railway typically takes 2-3 minutes to build and deploy.\n');
  
  try {
    // Check latest deployment via GitHub
    const deploymentsResp = await apiRequest('GET',
      `/repos/${OWNER}/${REPO}/deployments?environment=production&per_page=1`
    );

    if (deploymentsResp.status === 200 && deploymentsResp.data.length > 0) {
      const deployment = deploymentsResp.data[0];
      console.log(`📋 Latest Deployment:`);
      console.log(`   ID: ${deployment.id}`);
      console.log(`   State: ${deployment.state}`);
      console.log(`   Created: ${deployment.created_at}`);
      console.log(`   Updated: ${deployment.updated_at}\n`);

      if (deployment.state === 'success') {
        console.log('✅ Build SUCCEEDED! Railway is live!\n');
        
        // Get statuses for this deployment
        const statusResp = await apiRequest('GET', deployment.statuses_url);
        if (statusResp.data.length > 0) {
          const latestStatus = statusResp.data[0];
          console.log(`🚀 Status: ${latestStatus.state}`);
          if (latestStatus.environment_url) {
            console.log(`📍 Live URL: ${latestStatus.environment_url}\n`);
            return latestStatus.environment_url;
          }
        }
      } else if (deployment.state === 'pending' || deployment.state === 'in_progress') {
        console.log('⏳ Build is still in progress... (2-3 min typical)\n');
        console.log('Check status manually: https://railway.app/project/stellar-heart/services\n');
      } else {
        console.log(`❌ Deployment state: ${deployment.state}\n`);
      }
    } else {
      console.log('ℹ️  No deployments found yet. Railway is likely still building.\n');
      console.log('Check here: https://railway.app/project/stellar-heart/services\n');
    }

    console.log('💡 Once Railway shows "✅ Success", you\'ll see the live URL.\n');
    console.log('Then I\'ll automatically:');
    console.log('  1. Update Dashboard.jsx with the Railway URL');
    console.log('  2. Push to GitHub');
    console.log('  3. Cloudflare rebuilds automatically\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Check Railway status here: https://railway.app/project/stellar-heart/services');
  }
}

main();
