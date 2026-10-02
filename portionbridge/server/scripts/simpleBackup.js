require('dotenv').config();

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * Simple Database Backup Script
 * Creates JSON backup of all data (safer than SQL for complex data types)
 * Usage: node scripts/simpleBackup.js
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

async function simpleBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  const backupFile = path.join(BACKUP_DIR, `portionbridge_simple_backup_${timestamp}.json`);
  
  console.log(`[Backup] Starting simple JSON backup...`);
  console.log(`[Backup] Database: ${DB_NAME}`);
  console.log(`[Backup] Backup file: ${backupFile}`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
    });
    
    console.log(`[Backup] Connected to database`);
    
    // Get all tables
    const [tables] = await connection.query(`SHOW TABLES`);
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`[Backup] Found ${tableNames.length} tables to backup`);
    
    const backupData = {
      metadata: {
        database: DB_NAME,
        timestamp: new Date().toISOString(),
        version: '1.0',
        tables: tableNames.length
      },
      tables: {}
    };
    
    for (const tableName of tableNames) {
      console.log(`[Backup] Backing up table: ${tableName}`);
      
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      backupData.tables[tableName] = rows;
      
      console.log(`[Backup] Backed up ${rows.length} rows from ${tableName}`);
    }
    
    // Write to JSON file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    
    const fileSize = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`[Backup] Backup completed successfully!`);
    console.log(`[Backup] File size: ${fileSize} KB`);
    console.log(`[Backup] Location: ${backupFile}`);
    
    // Keep only last 5 backups
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('portionbridge_simple_backup_') && file.endsWith('.json'))
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

async function simpleRestore(backupFile) {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }
  
  console.log(`[Restore] Starting JSON restore...`);
  console.log(`[Restore] Backup file: ${backupFile}`);
  
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  
  console.log(`[Restore] Database: ${backupData.metadata.database}`);
  console.log(`[Restore] Tables: ${backupData.metadata.tables}`);
  console.log(`[Restore] Backup date: ${backupData.metadata.timestamp}`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      multipleStatements: true,
    });
    
    console.log(`[Restore] Connected to database`);
    
    for (const tableName of Object.keys(backupData.tables)) {
      const rows = backupData.tables[tableName];
      
      if (rows.length === 0) {
        console.log(`[Restore] Skipping empty table: ${tableName}`);
        continue;
      }
      
      console.log(`[Restore] Restoring table: ${tableName} (${rows.length} rows)`);
      
      // Clear existing data
      await connection.query(`DELETE FROM \`${tableName}\``);
      
      // Insert data
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const columnNames = columns.map(col => `\`${col}\``).join(', ');
      
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        await connection.query(
          `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${placeholders})`,
          values
        );
      }
      
      console.log(`[Restore] Restored ${rows.length} rows to ${tableName}`);
    }
    
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
    .filter(file => file.startsWith('portionbridge_simple_backup_') && file.endsWith('.json'))
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
    simpleRestore(path.join(BACKUP_DIR, backupFile));
  } else {
    simpleRestore(backupFile);
  }
} else if (command === 'list') {
  listBackups();
} else {
  simpleBackup().catch(error => {
    console.error('[Backup] Backup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { simpleBackup, simpleRestore, listBackups };
