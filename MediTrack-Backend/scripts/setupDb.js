const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db/pool');

async function setup() {
    console.log('🔄 Initializing MediTrack PostgreSQL Database Schema...');
    const client = await pool.connect();
    try {
        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('✅ Database schema, users table, relational geometry, and seed data initialized successfully!');
    } catch (err) {
        console.error('❌ Error initializing database schema:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

setup();
