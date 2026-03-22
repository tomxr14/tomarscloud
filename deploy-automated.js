#!/usr/bin/env node
/**
 * Automated Deployment Script for tomarscloud
 * Deploys to Railway (backend) and Cloudflare Pages (frontend)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RAILWAY_TOKEN = '4c59b5f5-f498-4f59-b26b-340156fece01';
const CLOUDFLARE_ZONE_ID = '3d75d8a96cd9f64955ff2a93467d9a3a';
const CLOUDFLARE_API_TOKEN = 'cfk_fCQDOwwmtM0r9eGL6D7VsE1zWEsgYAK8GLmDh5gefee31672';
const GITHUB_REPO = 'tomxr14/tomarscloud';

console.log('🚀 Starting Automated Deployment...\n');

// Test Railway API
function testRailway() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testing Railway API connection...');
    const query = JSON.stringify({
      query: '{ me { id email } }'
    });

    const options = {
      hostname: 'api.railway.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': query.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.me) {
            console.log(`✅ Railway authenticated as: ${json.data.me.email}\n`);
            resolve(json.data.me);
          } else if (json.errors) {
            console.log(`❌ Railway API error: ${json.errors[0].message}\n`);
            reject(new Error(json.errors[0].message));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(query);
    req.end();
  });
}

// List existing Railway projects
function listRailwayProjects() {
  return new Promise((resolve, reject) => {
    console.log('📋 Fetching Railway projects...');
    const query = JSON.stringify({
      query: `{
        projects(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }`
    });

    const options = {
      hostname: 'api.railway.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': query.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.projects) {
            const projects = json.data.projects.edges.map(e => e.node);
            resolve(projects);
          } else {
            reject(new Error('Failed to fetch projects'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(query);
    req.end();
  });
}

// Build frontend
function buildFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🔨 Building frontend...');
    try {
      const output = execSync('npm run build', {
        cwd: path.join(__dirname, 'client'),
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      console.log('✅ Frontend built successfully\n');
      resolve(output);
    } catch (e) {
      reject(e);
    }
  });
}

// Deploy Cloudflare Pages
function deployCloudflarePages() {
  return new Promise((resolve, reject) => {
    console.log('☁️  Deploying to Cloudflare Pages...');
    try {
      const output = execSync('npx wrangler pages deploy dist --project-name=tomarscloud', {
        cwd: path.join(__dirname, 'client'),
        stdio: 'pipe',
        encoding: 'utf-8',
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: CLOUDFLARE_API_TOKEN
        }
      });
      console.log('✅ Cloudflare Pages deployment initiated\n');
      resolve(output);
    } catch (e) {
      console.log('⚠️  Wrangler deployment requires interactive setup');
      resolve('manual');
    }
  });
}

// Main execution
async function main() {
  try {
    // Step 1: Test Railway
    await testRailway();

    // Step 2: List projects
    const projects = await listRailwayProjects();
    console.log(`Found ${projects.length} project(s):`);
    projects.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    console.log();

    // Step 3: Build frontend
    await buildFrontend();

    // Step 4: Deploy Cloudflare Pages
    await deployCloudflarePages();

    console.log('✨ Deployment automation complete!');
    console.log('\n📌 NEXT STEPS:');
    console.log('1. Go to https://railway.app and deploy: tomxr14/tomarscloud');
    console.log('2. Copy the Railway URL (format: https://tomarscloud-xxx.railway.app)');
    console.log('3. Edit client/src/components/Dashboard.jsx line 4:');
    console.log('   const API_BASE = "https://tomarscloud-xxx.railway.app/api";');
    console.log('4. Push to GitHub - Cloudflare auto-rebuilds');
    console.log('5. Visit https://tomarscloud.pages.dev\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
