const fetch = require('node-fetch');

async function seedListings() {
  try {
    console.log('Starting to seed listings...');

    const response = await fetch('http://localhost:3000/api/admin/seed-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Success! Created ${data.created} listings out of ${data.total}`);
      if (data.errors && data.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        data.errors.forEach((error) => console.log(`  - ${error}`));
      }
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to seed listings:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

seedListings();
