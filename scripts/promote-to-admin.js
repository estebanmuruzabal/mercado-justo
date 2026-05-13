#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/promote-to-admin.js <email>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteToAdmin() {
  try {
    const { error } = await supabase
      .from('user')
      .update({ role: 'super-admin' })
      .eq('email', email);

    if (error) {
      console.error('Error promoting user:', error.message);
      process.exit(1);
    }

    console.log(`✓ Successfully promoted ${email} to super-admin`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

promoteToAdmin();
