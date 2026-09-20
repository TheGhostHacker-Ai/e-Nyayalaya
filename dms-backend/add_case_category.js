const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');

client.connect().then(async () => {
  try {
    // 1. Add column
    await client.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_category text DEFAULT 'General'`);
    console.log("Added case_category column.");

    // 2. Fetch all cases
    const { rows: cases } = await client.query('SELECT id, title FROM cases');
    
    // 3. Update category based on title prefix
    for (const c of cases) {
      const match = c.title.match(/^\[(.*?)\]/);
      let category = 'General';
      if (match && match[1]) {
        category = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(); // Capitalize
      }
      await client.query(`UPDATE cases SET case_category = $1 WHERE id = $2`, [category, c.id]);
    }
    console.log(`Updated ${cases.length} cases.`);
    
  } catch(e) {
    console.error(e);
  } finally {
    client.end();
  }
});
