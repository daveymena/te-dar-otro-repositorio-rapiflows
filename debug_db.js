import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbbtvdesgdpasmofawks.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnR2ZGVzZ2RwYXNtb2Zhd2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYxMDMsImV4cCI6MjA4NTU3MjEwM30._h4xIxc-RQ10qZVPRY21mPfas_86-RMxZqtKGaDZlFk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase
        .rpc('get_tables'); // This might not work if it's not defined

    if (error) {
        // If RPC fails, try a direct query to postgrest health or something
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
        console.log('Direct profiles test:', { profiles, pError });
    } else {
        console.log('Tables:', data);
    }
}

listTables();
