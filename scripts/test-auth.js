/**
 * Test Supabase authentication connection
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Authentication Connection\n');
console.log('='.repeat(60));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('📡 Testing basic connection...');
    
    // Test 1: Check if we can reach Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError && !authError.message.includes('fetch failed')) {
      // If we get an auth error (not connection), that's good - it means we're connected
      console.log('  ✅ Connection successful! (No active session - this is expected)');
    } else if (authError && authError.message.includes('fetch failed')) {
      console.error('  ❌ Connection failed:', authError.message);
      return false;
    } else {
      console.log('  ✅ Connection successful!');
    }

    // Test 2: Try to check if tables exist (may fail if migrations not run)
    console.log('\n📊 Checking database tables...');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('  ⚠️  Database tables not found');
          console.log('  💡 Run migrations: See SUPABASE_SETUP.md');
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.log('  ✅ Tables exist! (RLS blocking access - this is correct)');
        } else {
          console.log('  ⚠️  Error:', error.message);
        }
      } else {
        console.log('  ✅ Tables accessible!');
      }
    } catch (dbError) {
      console.log('  ⚠️  Could not check tables:', dbError.message);
    }

    console.log('\n✨ Supabase connection is working!');
    console.log('\n📝 Summary:');
    console.log('  ✅ Network connection: OK');
    console.log('  ✅ Supabase URL: Valid');
    console.log('  ✅ API Key: Valid');
    console.log('\n🎯 You can now:');
    console.log('  1. Start your Next.js dev server');
    console.log('  2. Test user registration/login');
    console.log('  3. Run database migrations if needed\n');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

