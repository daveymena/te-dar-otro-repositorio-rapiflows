import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbbtvdesgdpasmofawks.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnR2ZGVzZ2RwYXNtb2Zhd2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYxMDMsImV4cCI6MjA4NTU3MjEwM30._h4xIxc-RQ10qZVPRY21mPfas_86-RMxZqtKGaDZlFk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log('Checking user: daveymena16@gmail.com');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'daveymena16@gmail.com');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('--- USER PROFILE FOUND ---');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('--- NO PROFILE FOUND ---');
    }
}

checkUser();
