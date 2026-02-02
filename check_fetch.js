async function checkUser() {
    const url = "https://bbbtvdesgdpasmofawks.supabase.co/rest/v1/profiles?email=eq.daveymena16@gmail.com";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnR2ZGVzZ2RwYXNtb2Zhd2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYxMDMsImV4cCI6MjA4NTU3MjEwM30._h4xIxc-RQ10qZVPRY21mPfas_86-RMxZqtKGaDZlFk";

    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        const data = await res.json();
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

checkUser();
