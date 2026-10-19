const { pool } = require('../config/db');
const { PLEDGE_TOTALS_SQL } = require('../utils/reliefQuantity');

/**
 * Raw SQL data-access layer for `relief_request_items`.
 * Pledged / collected / delivered are NEVER stored on the item: every total is
 * derived from relief_pledges via PLEDGE_TOTALS_SQL, so no counter can drift.
 */

const WRITABLE = new Set(['item_name', 'item_key', 'item_category', 'unit', 'quantity_requested', 'priority', 'status', 'notes']);

async function create(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO relief_request_items
       (relief_request_id, item_name, item_key, item_category, unit, quantity_requested, priority, notes)
     VALUES (:requestId, :itemName, :itemKey, :itemCategory, :unit, :quantityRequested, :priority, :notes)`,
    data
  );
  return result.insertId;
}

async function findById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM relief_request_items WHERE id = :id', { id });
  return rows[0] || null;
}

/** Exclusive row lock — THE mutex that serialises every quantity change for one item. */
async function findByIdForUpdate(id, connection) {
  const [rows] = await connection.query('SELECT * FROM relief_request_items WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

async function findByKey(requestId, itemKey, unit, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM relief_request_items WHERE relief_request_id = :requestId AND item_key = :itemKey AND unit = :unit',
    { requestId, itemKey, unit }
  );
  return rows[0] || null;
}

/** Locks every item of a request in id order (stable order prevents deadlocks). */
async function lockByRequestId(requestId, connection) {
  const [rows] = await connection.query(
    'SELECT id FROM relief_request_items WHERE relief_request_id = :requestId ORDER BY id FOR UPDATE',
    { requestId }
  );
  return rows;
}

async function updateById(id, fields, executor = pool) {
  const keys = Object.keys(fields).filter((k) => WRITABLE.has(k));
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = :${k}`);
  const params = { id };
  keys.forEach((k) => { params[k] = fields[k]; });
  await executor.query(`UPDATE relief_request_items SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

async function deleteById(id, executor = pool) {
  await executor.query('DELETE FROM relief_request_items WHERE id = :id', { id });
}

/** Items (with derived totals) for one or many requests. */
async function findWithTotalsByRequestIds(requestIds, { includeCancelled = false } = {}, executor = pool) {
  if (!requestIds.length) return [];
  const params = {};
  const names = requestIds.map((id, i) => { params[`r${i}`] = id; return `:r${i}`; });
  const [rows] = await executor.query(
    `SELECT i.*, ${PLEDGE_TOTALS_SQL}
     FROM relief_request_items i
     LEFT JOIN relief_pledges p ON p.relief_request_item_id = i.id
     WHERE i.relief_request_id IN (${names.join(', ')})
       ${includeCancelled ? '' : "AND i.status = 'active'"}
     GROUP BY i.id
     ORDER BY i.relief_request_id, i.id`,
    params
  );
  return rows;
}

/** Derived totals for ONE item. Inside a transaction, call it after locking the item row. */
async function getTotals(itemId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT ${PLEDGE_TOTALS_SQL}
     FROM relief_pledges p WHERE p.relief_request_item_id = :itemId`,
    { itemId }
  );
  return rows[0];
}

async function countPledges(itemId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT COUNT(*) AS total,
            SUM(status <> 'cancelled') AS non_cancelled
     FROM relief_pledges WHERE relief_request_item_id = :itemId`,
    { itemId }
  );
  return { total: Number(rows[0].total), nonCancelled: Number(rows[0].non_cancelled || 0) };
}

module.exports = {
  create, findById, findByIdForUpdate, findByKey, lockByRequestId, updateById, deleteById,
  findWithTotalsByRequestIds, getTotals, countPledges,
};
