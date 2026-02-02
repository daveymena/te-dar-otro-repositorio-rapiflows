import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbbtvdesgdpasmofawks.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnR2ZGVzZ2RwYXNtb2Zhd2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYxMDMsImV4cCI6MjA4NTU3MjEwM30._h4xIxc-RQ10qZVPRY21mPfas_86-RMxZqtKGaDZlFk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInfrastructure() {
    console.log('--- Checking Database Infrastructure ---');

    // Try rides table
    const { data: rides, error: ridesError } = await supabase.from('rides').select('*').limit(1);
    console.log('Rides Table:', ridesError ? `Error: ${ridesError.message}` : 'Found');

    // Try bids table
    const { data: bids, error: bidsError } = await supabase.from('bids').select('*').limit(1);
    console.log('Bids Table:', bidsError ? `Error: ${bidsError.message}` : 'Found');

    // Try profiles table
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles Table:', profilesError ? `Error: ${profilesError.message}` : 'Found');
}

checkInfrastructure();
