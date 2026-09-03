const mysql = require('mysql2');

console.log('Testing MySQL connection...');

// Test basic connection to MySQL server with timeout
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  connectTimeout: 10000
});

connection.connect((err) => {
  if (err) {
    console.log('❌ Connection failed:', err.message);
    console.log('Error code:', err.code);
    console.log('Error number:', err.errno);
  } else {
    console.log('✅ Connected to MySQL server');
    
    // Check if portionbridge database exists
    connection.query('SHOW DATABASES LIKE "portionbridge"', (err, results) => {
      if (err) {
        console.log('❌ Error checking database:', err.message);
      } else {
        if (results.length > 0) {
          console.log('✅ Database "portionbridge" exists');
        } else {
          console.log('❌ Database "portionbridge" does not exist');
        }
      }
      connection.end();
    });
  }
});