const { pool } = require('../config/db');

const ER_LOCK_DEADLOCK = 1213;
const ER_LOCK_WAIT_TIMEOUT = 1205;

/**
 * Runs `work(connection)` inside a transaction on a dedicated pooled connection.
 *
 * - READ COMMITTED: every statement after a row lock is acquired sees the latest
 *   committed data. Under the default REPEATABLE READ a plain SELECT would read
 *   from a snapshot taken before the lock was won and could miss a competing
 *   pledge that committed in between, breaking the quantity guard.
 * - Retries (default 2x) when MySQL picks this transaction as a deadlock victim
 *   or a lock wait times out; `work` must therefore be safe to re-run.
 * - Always rolls back on error and always releases the connection.
 */
async function runInTransaction(work, { retries = 2 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const connection = await pool.getConnection();
    try {
      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (err) {
      try { await connection.rollback(); } catch (_) { /* connection already gone */ }
      const retryable = err && (err.errno === ER_LOCK_DEADLOCK || err.errno === ER_LOCK_WAIT_TIMEOUT);
      if (!retryable || attempt >= retries) throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = { runInTransaction };
