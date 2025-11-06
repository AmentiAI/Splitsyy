/**
 * Quick Supabase connection checker
 * Uses dotenv to load .env.local
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Supabase Connection Check\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ SET (${supabaseUrl.substring(0, 30)}...)` : '❌ MISSING');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? `✅ SET (${supabaseKey.substring(0, 30)}...)` : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? `✅ SET (${serviceKey.substring(0, 30)}...)` : '⚠️  MISSING (optional for some features)');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing required environment variables!');
  console.log('\nPlease ensure .env.local contains:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...');
  process.exit(1);
}

// Test connection
console.log('\n📡 Testing Connection...');

const https = require('https');
const http = require('http');

const url = new URL(supabaseUrl);
const testUrl = `${supabaseUrl}/rest/v1/`;

console.log('  Testing URL:', testUrl);

const lib = url.protocol === 'https:' ? https : http;

lib.get(testUrl, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  },
  timeout: 5000
}, (res) => {
  console.log('  Status:', res.statusCode);
  
  if (res.statusCode === 200 || res.statusCode === 401) {
    console.log('  ✅ Connection successful! (401 is expected for REST endpoint without query)');
    console.log('\n✨ Supabase is configured correctly!');
    console.log('\nNext steps:');
    console.log('  1. Test authentication');
    console.log('  2. Run database migrations if needed');
    console.log('  3. Start using the app!\n');
    process.exit(0);
  } else {
    console.log('  ⚠️  Unexpected status:', res.statusCode);
    process.exit(1);
  }
}).on('error', (err) => {
  console.error('  ❌ Connection failed:', err.message);
  console.log('\nPossible issues:');
  console.log('  - Invalid Supabase URL');
  console.log('  - Network connectivity problems');
  console.log('  - Supabase project might be paused');
  console.log('\nCheck your Supabase dashboard: https://supabase.com/dashboard\n');
  process.exit(1);
}).on('timeout', () => {
  console.error('  ❌ Connection timeout');
  console.log('  Check your internet connection or Supabase project status\n');
  process.exit(1);
});

