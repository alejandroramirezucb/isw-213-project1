const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'Warning: SUPABASE_SERVICE_ROLE_KEY not set — server will use anon key and some operations may be blocked by RLS',
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
