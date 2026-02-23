const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const urlSupabase = process.env.SUPABASE_URL;
const claveSupabase =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(urlSupabase, claveSupabase);

module.exports = supabase;
