#!/usr/bin/env node

/**
 * Apple Sign-In JWT Generator for Supabase
 * 
 * This script generates a JWT token from your Apple .p8 key file
 * for use in Supabase Apple OAuth configuration.
 * 
 * Usage:
 *   node generate-apple-jwt.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Prompt user for inputs
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🍎 Apple Sign-In JWT Generator for Supabase\n');
console.log('This script will generate a JWT token for your Supabase Apple OAuth config.\n');

const questions = [
  'Path to your .p8 key file (e.g., /path/to/AuthKey_X6M4H2F5PA.p8): ',
  'Team ID (10 characters, e.g., ABC123XYZ9): ',
  'Key ID (10 characters, e.g., X6M4H2F5PA): ',
  'Client ID / Services ID (e.g., com.fxellence.aurumx): '
];

let answers = [];
let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion < questions.length) {
    rl.question(questions[currentQuestion], (answer) => {
      answers.push(answer.trim());
      currentQuestion++;
      askQuestion();
    });
  } else {
    rl.close();
    generateJWT();
  }
}

function generateJWT() {
  const [keyPath, teamId, keyId, clientId] = answers;

  console.log('\n📋 Configuration:');
  console.log(`  Team ID: ${teamId}`);
  console.log(`  Key ID: ${keyId}`);
  console.log(`  Client ID: ${clientId}`);
  console.log(`  Key Path: ${keyPath}\n`);

  // Read the private key
  let privateKey;
  try {
    privateKey = fs.readFileSync(keyPath, 'utf8');
    console.log('✅ Successfully read .p8 key file\n');
  } catch (error) {
    console.error('❌ Error reading .p8 file:', error.message);
    console.log('\nMake sure the file path is correct and the file exists.');
    process.exit(1);
  }

  // Install jsonwebtoken if not present
  try {
    require('jsonwebtoken');
  } catch (error) {
    console.log('📦 Installing jsonwebtoken package...\n');
    const { execSync } = require('child_process');
    try {
      execSync('npm install jsonwebtoken', { stdio: 'inherit' });
      console.log('\n✅ Package installed successfully\n');
    } catch (installError) {
      console.error('❌ Failed to install jsonwebtoken');
      console.log('\nPlease install it manually: npm install jsonwebtoken');
      process.exit(1);
    }
  }

  const jwt = require('jsonwebtoken');

  // Generate JWT
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + (86400 * 180), // 180 days (6 months)
    aud: 'https://appleid.apple.com',
    sub: clientId
  };

  const header = {
    alg: 'ES256',
    kid: keyId
  };

  let token;
  try {
    token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: header
    });

    console.log('🎉 JWT Generated Successfully!\n');
    console.log('━'.repeat(80));
    console.log('\n📝 Copy this JWT and paste it into Supabase:\n');
    console.log('🔑 Secret Key (for OAuth):\n');
    console.log(token);
    console.log('\n' + '━'.repeat(80));
    console.log('\n📋 Next Steps:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/qdpunpuwyyrtookkbtdh/auth/providers');
    console.log('2. Scroll to "Apple" provider');
    console.log(`3. In "Client IDs" field, enter: ${clientId}`);
    console.log('4. In "Secret Key (for OAuth)" field, paste the JWT above');
    console.log('5. Check "Allow users without an email" (optional)');
    console.log('6. Click "Save"');
    console.log('\n⚠️  Note: This JWT expires in 6 months. You\'ll need to regenerate it then.\n');
    
  } catch (error) {
    console.error('❌ Error generating JWT:', error.message);
    process.exit(1);
  }
}

askQuestion();
