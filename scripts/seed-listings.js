const fetch = require('node-fetch');

async function seedListings() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/seed-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error) => console.log(`  - ${error}`));
      }
    }
  } catch (error) {
    console.error('Failed to seed listings:', error.message);
  }
}

seedListings();
