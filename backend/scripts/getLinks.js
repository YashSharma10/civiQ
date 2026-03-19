const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function getLinks() {
  const r = await fetch('https://api.clerk.com/v1/users', { 
    headers: { 'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY } 
  });
  const users = await r.json();
  const testUsers = (users || []).filter(u => u.email_addresses[0]?.email_address.endsWith('@civiq.com'));
  
  const result = {};
  for (const u of testUsers) {
      const email = u.email_addresses[0].email_address;
      const tRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ user_id: u.id })
      });
      const t = await tRes.json();
      result[email] = t.url;
  }
  
  const fs = require('fs');
  fs.writeFileSync('links.json', JSON.stringify(result, null, 2));
}

getLinks();
