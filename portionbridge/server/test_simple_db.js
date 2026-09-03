const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing MySQL connection with different hosts...');
    
    const hosts = ['localhost', '127.0.0.1', '::1'];
    
    for (const host of hosts) {
      try {
        console.log(`Trying host: ${host}`);
        const connection = await mysql.createConnection({
          host: host,
          user: 'root',
          password: '',
          connectTimeout: 5000
        });
        
        console.log(`✅ Connected to ${host}`);
        
        const [rows] = await connection.execute('SHOW DATABASES');
        console.log('Databases:', rows.map(r => r.Database));
        
        await connection.end();
        return true;
      } catch (err) {
        console.log(`❌ Failed for ${host}:`, err.message);
      }
    }
    
    return false;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ MySQL connection test passed');
  } else {
    console.log('❌ MySQL connection test failed');
  }
  process.exit(success ? 0 : 1);
});