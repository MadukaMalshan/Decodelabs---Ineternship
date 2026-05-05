// src/db/pool.js
// PostgreSQL Connection Pool Service
// Manages all database connections with proper error handling and validation

const { Pool } = require('pg');

// ============================================================================
// DATABASE POOL CONFIGURATION
// ============================================================================
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'meditrack',
    // Connection pool settings
    max: 20,              // Maximum pool size
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
    connectionTimeoutMillis: 2000,  // Connection timeout
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('✅ New database connection established');
});

// ============================================================================
// QUERY EXECUTION WITH PARAMETERIZED STATEMENTS (Prevents SQL Injection)
// ============================================================================

/**
 * Execute a query with parameterized placeholders
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {array} params - Query parameters
 * @returns {Promise} Query result
 */
async function query(sql, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(sql, params);
        const duration = Date.now() - start;
        console.log(`✓ Query executed in ${duration}ms`);
        return result;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

/**
 * Execute a single row query
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Single row or null
 */
async function queryOne(sql, params = []) {
    const result = await query(sql, params);
    return result.rows[0] || null;
}

/**
 * Execute a query that returns multiple rows
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<array>} Array of rows
 */
async function queryMany(sql, params = []) {
    const result = await query(sql, params);
    return result.rows;
}

/**
 * Execute an INSERT query and return the inserted row
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Inserted row
 */
async function insert(sql, params = []) {
    const result = await query(sql, params);
    return result.rows[0];
}

/**
 * Begin a transaction
 * @returns {Promise<object>} Client for transaction
 */
async function beginTransaction() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('✓ Transaction started');
        return client;
    } catch (error) {
        client.release();
        throw error;
    }
}

/**
 * Commit a transaction
 * @param {object} client - Transaction client
 */
async function commitTransaction(client) {
    try {
        await client.query('COMMIT');
        console.log('✓ Transaction committed');
    } finally {
        client.release();
    }
}

/**
 * Rollback a transaction
 * @param {object} client - Transaction client
 */
async function rollbackTransaction(client) {
    try {
        await client.query('ROLLBACK');
        console.log('✓ Transaction rolled back');
    } finally {
        client.release();
    }
}

/**
 * Health check - verify DB connection
 * @returns {Promise<boolean>} True if connected
 */
async function healthCheck() {
    try {
        const result = await query('SELECT NOW()');
        return result.rows.length > 0;
    } catch (error) {
        console.error('Database health check failed:', error.message);
        return false;
    }
}

/**
 * Close all connections
 */
async function close() {
    await pool.end();
    console.log('✓ Database pool closed');
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    pool,
    query,
    queryOne,
    queryMany,
    insert,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    healthCheck,
    close
};
