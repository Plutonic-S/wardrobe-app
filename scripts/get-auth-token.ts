// scripts/get-auth-token.ts
// Quick script to login and get auth token
// Run with: npx tsx scripts/get-auth-token.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthToken() {
  console.log('🔐 Logging in to get auth token...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ibra@gmail.com',
        password: 'Bb123456',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Extract token from Set-Cookie header
      const setCookieHeader = response.headers.get('set-cookie');
      
      if (setCookieHeader) {
        // Parse token from cookie
        const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          
          console.log('✅ Login successful!\n');
          console.log('Your auth token:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(token);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          console.log('Add this to your .env.local:');
          console.log(`TEST_AUTH_TOKEN=${token}\n`);
          
          console.log('Now you can run the tests:');
          console.log('  npx tsx scripts/test-outfit-routes.ts');
          console.log('  or');
          console.log(`  ./scripts/quick-test-outfits.sh ${token}\n`);
          
          return token;
        }
      }
      
      // If no cookie header, token might be in response body
      if (data.data?.token) {
        const token = data.data.token;
        console.log('✅ Login successful!\n');
        console.log('Your auth token:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(token);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('Add this to your .env.local:');
        console.log(`TEST_AUTH_TOKEN=${token}\n`);
        
        return token;
      }
      
      console.log('⚠️  Login successful but token not found in response');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error during login:', error);
    console.log('\nMake sure your dev server is running:');
    console.log('  npm run dev');
  }
}

getAuthToken();
