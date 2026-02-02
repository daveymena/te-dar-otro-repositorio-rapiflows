import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbbtvdesgdpasmofawks.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnR2ZGVzZ2RwYXNtb2Zhd2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYxMDMsImV4cCI6MjA4NTU3MjEwM30._h4xIxc-RQ10qZVPRY21mPfas_86-RMxZqtKGaDZlFk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAuth() {
    const email = "daveymena16@gmail.com";
    const password = "6715320Dvd.";

    console.log(`Checking Auth for: ${email}`);

    // Test 1: Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        console.log('SignIn Error:', signInError.message);
    } else {
        console.log('SignIn Success! User ID:', signInData.user.id);
        console.log('Email Confirmed At:', signInData.user.email_confirmed_at);
    }

    // Test 2: Try to sign up (if user exists, it should give a message)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.log('SignUp Error (indicates status):', signUpError.message);
    } else {
        console.log('SignUp Success (means user did not exist or was deleted):', signUpData.user?.id);
    }
}

verifyAuth();
