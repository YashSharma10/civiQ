const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY is missing from .env');
  process.exit(1);
}

const DEPARTMENTS = ['Roads', 'Water', 'Electricity', 'Garbage'];
const PASSWORD = 'Civiq@DeptDemo2026!';

async function seedDepartments() {
  console.log('Seeding Department Users into Clerk...');

  for (const dept of DEPARTMENTS) {
    const email = `${dept.toLowerCase()}@civiq.com`;
    
    // Check if user exists (rough check by attempting to create. If it fails due to duplicate email, that's fine)
    try {
      const response = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_address: [email],
          password: PASSWORD,
          first_name: dept,
          last_name: 'Department',
          public_metadata: {
            role: 'authority',
            department: dept
          },
          skip_password_requirement: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Created: ${email} (Dept: ${dept}) | Password: ${PASSWORD}`);
      } else if (data.errors && data.errors.some(err => err.code === 'form_identifier_exists')) {
        console.log(`⚠️ User already exists: ${email}. You can log in using password: ${PASSWORD} (if not changed)`);
      } else {
        console.error(`❌ Failed to create ${email}:`, data.errors || data);
      }
    } catch (error) {
      console.error(`Error processing ${dept}:`, error.message);
    }
  }

  console.log('\nSeed process finished! You can now log into the frontend using these email+password combinations.');
}

seedDepartments();
