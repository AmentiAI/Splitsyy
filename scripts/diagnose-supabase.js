/**
 * Comprehensive Supabase connection diagnosis
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Connection Diagnosis\n');
console.log('='.repeat(60));

console.log('\n✅ Environment Variables Loaded:');
console.log(`  URL: ${supabaseUrl || 'MISSING'}`);
console.log(`  Key: ${supabaseKey ? supabaseKey.substring(0, 40) + '...' : 'MISSING'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing required variables!');
  process.exit(1);
}

// Validate URL format
console.log('\n📋 URL Validation:');
const urlMatch = supabaseUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/);
if (urlMatch) {
  console.log('  ✅ URL format is correct');
  console.log(`  Project ID: ${urlMatch[1]}`);
} else {
  console.log('  ⚠️  URL format may be incorrect');
  console.log('  Expected: https://[project-id].supabase.co');
  console.log(`  Got: ${supabaseUrl}`);
}

// Check key format
console.log('\n🔑 Key Validation:');
if (supabaseKey.startsWith('eyJ')) {
  console.log('  ✅ Key format looks correct (JWT format)');
} else if (supabaseKey.startsWith('sb_publishable_')) {
  console.log('  ⚠️  Key format appears to be new Supabase format');
  console.log('  This might work but verify it\'s the correct key type');
} else {
  console.log('  ⚠️  Key format is unexpected');
  console.log('  Expected: Starts with "eyJ" (JWT) or "sb_publishable_"');
}

// Try DNS resolution
console.log('\n🌐 Network Check:');
const dns = require('dns');
const https = require('https');

const hostname = new URL(supabaseUrl).hostname;

dns.lookup(hostname, (err, address) => {
  if (err) {
    console.log(`  ❌ DNS lookup failed: ${err.message}`);
    console.log('\n💡 Possible Issues:');
    console.log('  1. Project might be paused in Supabase dashboard');
    console.log('  2. Project might have been deleted');
    console.log('  3. Network/firewall blocking connection');
    console.log('  4. Incorrect project URL');
    console.log('\n🔧 Solutions:');
    console.log('  1. Check Supabase Dashboard: https://supabase.com/dashboard');
    console.log('  2. Verify project is active (not paused)');
    console.log('  3. Copy fresh credentials from Settings → API');
    console.log('  4. Ensure URL matches exactly (no trailing slash)\n');
    process.exit(1);
  } else {
    console.log(`  ✅ DNS resolved: ${hostname} → ${address}`);
    
    // Try HTTPS connection
    console.log('\n🔌 HTTPS Connection Test:');
    const req = https.get(supabaseUrl, {
      timeout: 5000,
      headers: {
        'apikey': supabaseKey
      }
    }, (res) => {
      console.log(`  ✅ Connection successful! Status: ${res.statusCode}`);
      console.log('\n✨ Supabase is reachable and configured correctly!\n');
      process.exit(0);
    });
    
    req.on('error', (err) => {
      console.log(`  ❌ HTTPS connection failed: ${err.message}`);
      console.log('\n💡 This might indicate:');
      console.log('  - SSL/TLS certificate issues');
      console.log('  - Firewall blocking HTTPS');
      console.log('  - Project is paused\n');
      process.exit(1);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('  ❌ Connection timeout');
      console.log('  Check your network or Supabase project status\n');
      process.exit(1);
    });
  }
});

