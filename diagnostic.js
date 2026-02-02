import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbbtvdesgdpasmofawks.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnR2ZGVzZ2RwYXNtb2Zhd2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYxMDMsImV4cCI6MjA4NTU3MjEwM30._h4xIxc-RQ10qZVPRY21mPfas_86-RMxZqtKGaDZlFk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthAndProfile() {
    const email = "daveymena16@gmail.com";

    // 1. Check Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers(); // Likely fails with anon key

    // Alternative: try to sign up again to see error
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: "dummy_password_test",
    });

    if (signUpError && signUpError.message.includes('User already registered')) {
        console.log('Auth user EXISTS for:', email);
    } else {
        console.log('Auth user status unknown or NOT FOUND:', signUpError?.message || 'New user created (unexpected)');
    }

    // 2. Check Profile again
    const { data: profileData } = await supabase.from('profiles').select('*').eq('email', email);
    console.log('Profile Data for email:', email, profileData);

    // 3. Try to manually insert profile if missing but user exists
    if (profileData && profileData.length === 0) {
        console.log('MANUAL ACTION NEEDED: Trigger did not create profile.');
    }
}

checkAuthAndProfile();
