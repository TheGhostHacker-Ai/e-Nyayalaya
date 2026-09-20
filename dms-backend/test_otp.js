const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qsmuvcijmmzjwwuqftbm.supabase.co';
const supabaseKey = 'sb_publishable_eUCl9QvC0n-NICppruvESg_1mtG-F3w'; // anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOtp() {
  const email = 'obrinnarson@gmail.com';
  
  console.log("Sending OTP to:", email);
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  
  if (error) {
    console.error("Send Error:", error);
    return;
  }
  
  console.log("OTP sent! Please check your email and we will simulate verification.");
}

testOtp();
