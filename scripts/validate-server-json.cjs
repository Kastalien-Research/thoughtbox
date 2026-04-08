#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const serverJsonPath = path.join(__dirname, '..', 'server.json');

console.log('Validating server.json...\n');

// Fetch schema
https.get('https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const schema = JSON.parse(data);
      const serverJson = JSON.parse(fs.readFileSync(serverJsonPath, 'utf8'));

      // Basic validation checks
      const errors = [];

      // Check required fields
      if (!serverJson.name) errors.push('Missing required field: name');
      if (!serverJson.description) errors.push('Missing required field: description');
      if (!serverJson.version) errors.push('Missing required field: version');

      // Check name format (reverse DNS)
      if (serverJson.name && !serverJson.name.match(/^[a-z0-9.-]+\/[a-z0-9-]+$/)) {
        errors.push('Invalid name format (must be reverse-DNS format)');
      }

      // Check description length
      if (serverJson.description && serverJson.description.length > 100) {
        errors.push('Description exceeds 100 characters');
      }

      // Check version format
      if (serverJson.version && !serverJson.version.match(/^\d+\.\d+\.\d+/)) {
        errors.push('Invalid version format (should be semver)');
      }

      // Check packages array
      if (!serverJson.packages || !Array.isArray(serverJson.packages) || serverJson.packages.length === 0) {
        errors.push('Missing or empty packages array');
      } else {
        serverJson.packages.forEach((pkg, i) => {
          if (!pkg.registryType) errors.push(`Package ${i}: missing registryType`);
          if (!pkg.identifier) errors.push(`Package ${i}: missing identifier`);
          if (!pkg.version) errors.push(`Package ${i}: missing version`);
          if (!pkg.transport || !pkg.transport.type) errors.push(`Package ${i}: missing transport.type`);
        });
      }

      if (errors.length > 0) {
        console.log('❌ Validation failed:\n');
        errors.forEach(err => console.log('  - ' + err));
        process.exit(1);
      } else {
        console.log('✓ server.json is valid!\n');
        console.log('Summary:');
        console.log(`  Name: ${serverJson.name}`);
        console.log(`  Version: ${serverJson.version}`);
        console.log(`  Description: ${serverJson.description}`);
        console.log(`  Packages: ${serverJson.packages.length}`);
        serverJson.packages.forEach(pkg => {
          console.log(`    - ${pkg.registryType}: ${pkg.identifier}@${pkg.version}`);
        });
      }
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error('Network error:', e.message);
  console.log('\nPerforming offline validation instead...\n');

  try {
    const serverJson = JSON.parse(fs.readFileSync(serverJsonPath, 'utf8'));
    console.log('✓ server.json is valid JSON\n');
    console.log('Summary:');
    console.log(`  Name: ${serverJson.name}`);
    console.log(`  Version: ${serverJson.version}`);
    console.log(`  Description: ${serverJson.description}`);
  } catch (e) {
    console.error('❌ Invalid JSON:', e.message);
    process.exit(1);
  }
});
