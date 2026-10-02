require('dotenv').config();

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * Database Backup Script
 * Creates timestamped SQL backups of the PortionBridge database
 * Usage: node scripts/backupDatabase.js
 */

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'portionbridge';
const DB_PORT = process.env.DB_PORT || 3306;

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`[Backup] Created backup directory: ${BACKUP_DIR}`);
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  const backupFile = path.join(BACKUP_DIR, `portionbridge_backup_${timestamp}.sql`);
  
  console.log(`[Backup] Starting database backup...`);
  console.log(`[Backup] Database: ${DB_NAME}`);
  console.log(`[Backup] Backup file: ${backupFile}`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT,
      multipleStatements: true,
    });
    
    console.log(`[Backup] Connected to MySQL server`);
    
    // Get all tables
    const [tables] = await connection.query(`SHOW TABLES FROM \`${DB_NAME}\``);
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`[Backup] Found ${tableNames.length} tables to backup`);
    
    let sqlContent = `-- PortionBridge Database Backup\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${DB_NAME}\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    for (const tableName of tableNames) {
      console.log(`[Backup] Backing up table: ${tableName}`);
      
      // Get table structure
      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${DB_NAME}\`.\`${tableName}\``);
      sqlContent += `-- Table structure for ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTable[0]['Create Table']};\n\n`;
      
      // Get table data
      const [rows] = await connection.query(`SELECT * FROM \`${DB_NAME}\`.\`${tableName}\``);
      
      if (rows.length > 0) {
        sqlContent += `-- Data for table ${tableName}\n`;
        sqlContent += `LOCK TABLES \`${tableName}\` WRITE;\n`;
        
        const columns = Object.keys(rows[0]);
        const columnNames = columns.map(col => `\`${col}\``).join(', ');
        
        for (const row of rows) {
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/backupDatabase.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/backupDatabase.js
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) {
              return 'NULL';
            } else if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
            } else if (typeof value === 'number') {
              return value;
            } else if (value instanceof Date) {
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/backupDatabase.js
              return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            } else if (Buffer.isBuffer(value)) {
              return `'${value.toString('hex')}'`;
            } else {
              return `'${String(value).replace(/'/g, "''")}'`;
=======
              const dateStr = value.toISOString();
              if (dateStr === 'Invalid Date') {
                return 'NULL';
              }
              return `'${dateStr.slice(0, 19).replace('T', ' ')}'`;
            } else if (Buffer.isBuffer(value)) {
              return `'${value.toString('hex')}'`;
            } else {
              const strValue = String(value);
              if (strValue === 'Invalid Date' || strValue === 'NaN') {
                return 'NULL';
              }
              return `'${strValue.replace(/'/g, "''")}'`;
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/backupDatabase.js
            }
          }).join(', ');
          
          sqlContent += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});\n`;
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/backupDatabase.js
          try {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) {
                return 'NULL';
              } else if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              } else if (typeof value === 'number') {
                return value;
              } else if (value instanceof Date) {
                const dateStr = value.toISOString();
                if (dateStr === 'Invalid Date') {
                  return 'NULL';
                }
                return `'${dateStr.slice(0, 19).replace('T', ' ')}'`;
              } else if (Buffer.isBuffer(value)) {
                return `'${value.toString('hex')}'`;
              } else {
                const strValue = String(value);
                if (strValue === 'Invalid Date' || strValue === 'NaN') {
                  return 'NULL';
                }
                return `'${strValue.replace(/'/g, "''")}'`;
              }
            }).join(', ');
            
            sqlContent += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});\n`;
          } catch (rowError) {
            console.error(`[Backup] Error processing row in table ${tableName}:`, rowError.message);
            console.error(`[Backup] Problematic row:`, JSON.stringify(row, null, 2));
            // Skip this row but continue with others
            continue;
          }
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/backupDatabase.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/backupDatabase.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/backupDatabase.js
        }
        
        sqlContent += `UNLOCK TABLES;\n\n`;
      }
    }
    
    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlContent += `-- Backup completed successfully\n`;
    
    // Write to file
    fs.writeFileSync(backupFile, sqlContent, 'utf8');
    
    const fileSize = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`[Backup] Backup completed successfully!`);
    console.log(`[Backup] File size: ${fileSize} KB`);
    console.log(`[Backup] Location: ${backupFile}`);
    
    // Keep only last 5 backups
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('portionbridge_backup_') && file.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (backupFiles.length > 5) {
      const filesToDelete = backupFiles.slice(5);
      console.log(`[Backup] Cleaning up old backups (${filesToDelete.length} files)`);
      
      for (const file of filesToDelete) {
        const filePath = path.join(BACKUP_DIR, file);
        fs.unlinkSync(filePath);
        console.log(`[Backup] Deleted old backup: ${file}`);
      }
    }
    
    return backupFile;
    
  } catch (error) {
    console.error(`[Backup] Error during backup:`, error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function restoreDatabase(backupFile) {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }
  
  console.log(`[Restore] Starting database restore...`);
  console.log(`[Restore] Backup file: ${backupFile}`);
  console.log(`[Restore] Database: ${DB_NAME}`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT,
      multipleStatements: true,
    });
    
    console.log(`[Restore] Connected to MySQL server`);
    
    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    
    console.log(`[Restore] Executing restore script...`);
    await connection.query(sqlContent);
    
    console.log(`[Restore] Database restored successfully!`);
    
  } catch (error) {
    console.error(`[Restore] Error during restore:`, error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`[Backup] No backup directory found`);
    return [];
  }
  
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('portionbridge_backup_') && file.endsWith('.sql'))
    .sort()
    .reverse();
  
  console.log(`[Backup] Available backups (${backupFiles.length}):`);
  
  for (const file of backupFiles) {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    const date = stats.mtime.toISOString();
    console.log(`  - ${file} (${size} KB, ${date})`);
  }
  
  return backupFiles;
}

// Main execution
const command = process.argv[2];

if (command === 'restore' && process.argv[3]) {
  const backupFile = process.argv[3];
  if (!path.isAbsolute(backupFile)) {
    restoreDatabase(path.join(BACKUP_DIR, backupFile));
  } else {
    restoreDatabase(backupFile);
  }
} else if (command === 'list') {
  listBackups();
} else {
  backupDatabase().catch(error => {
    console.error('[Backup] Backup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { backupDatabase, restoreDatabase, listBackups };
