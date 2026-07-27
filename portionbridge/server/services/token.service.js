const { pool } = require('../config/db');
const { generateAccessToken, generateOpaqueToken, hashToken } = require('../utils/token');
const { AUTH } = require('../constants');
const refreshTokenModel = require('../models/refreshToken.model');

/**
 * Business logic for issuing and rotating token pairs.
 * Kept separate from the controller so the same logic can be reused by
 * login, register, and the refresh-token endpoint without duplication.
 */

/**
 * Issues a brand-new access + refresh token pair for a user and persists
 * the refresh token's hash as a new `refresh_tokens` row (a new session).
 *
 * Now accepts an optional trailing `connection` (defaults to `pool`) so
 * completeRotation can issue the replacement token on the same connection
 * that's holding the old token row's lock. login/register (the other two
 * callers) don't pass one, so they're unaffected.
 * @returns {{ accessToken: string, rawRefreshToken: string, refreshTokenId: number, expiresAt: Date }}
 */
async function issueNewSession(user, { ipAddress, userAgent } = {}, connection = pool) {
  const accessToken = generateAccessToken({ id: user.id, role: user.role });

  const rawRefreshToken = generateOpaqueToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  const refreshTokenId = await refreshTokenModel.createRefreshToken(
    {
      userId: user.id,
      tokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    },
    connection
  );

  return { accessToken, rawRefreshToken, refreshTokenId, expiresAt };
}

/**
 * Validates a presented refresh token as part of an atomic rotation.
 *
 * RACE CONDITION FIX: previously read the token row with a plain, unlocked
 * SELECT (findByTokenHash), so two simultaneous refresh requests could both
 * read it as "valid, not revoked" before either one revoked it — both would
 * then successfully rotate, handing out two valid new sessions from one
 * old token. Now requires the caller to pass an active transaction
 * connection and locks the row with SELECT ... FOR UPDATE (lockByTokenHash)
 * — a second request hits this same lock and blocks until the first
 * transaction commits or rolls back.
 *
 * Note: the REPLAY branch no longer calls revokeAllForUser itself (moved
 * to the caller, auth.service.js#refreshSession) — doing it here, while
 * still holding this row's lock, would deadlock against that broader
 * UPDATE's attempt to touch the very row this transaction has locked.
 *
 * @param {string} rawRefreshToken - The raw token presented by the client
 * @param {Object} connection - Active transaction connection (caller owns begin/commit/rollback)
 * @throws {Error} with a `.code` property distinguishing failure reasons:
 *   'NOT_FOUND'  — token hash doesn't exist at all
 *   'REPLAY'     — token was already revoked (possible theft) — err.userId is set
 *   'EXPIRED'    — token exists, is not revoked, but has expired
 */
async function rotateRefreshToken(rawRefreshToken, connection) {
  const tokenHash = hashToken(rawRefreshToken);
  const existing = await refreshTokenModel.lockByTokenHash(connection, tokenHash);

  if (!existing) {
    const err = new Error('Refresh token not recognized.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (existing.is_revoked) {
    const err = new Error('Refresh token reuse detected.');
    err.code = 'REPLAY';
    err.userId = existing.user_id;
    throw err;
  }

  if (new Date(existing.expires_at).getTime() < Date.now()) {
    const err = new Error('Refresh token has expired.');
    err.code = 'EXPIRED';
    throw err;
  }

  return { existingTokenRow: existing };
}

/**
 * Completes a rotation after rotateRefreshToken has validated (and locked)
 * the old token row: issues the new session and links the rotation chain —
 * both writes on the SAME connection/transaction that's holding the lock,
 * so the whole validate-then-rotate sequence is atomic.
 * @param {Object} existingTokenRow - The locked, validated old token row
 * @param {Object} user - The token's owner
 * @param {Object} connection - Active transaction connection (same one used by rotateRefreshToken)
 * @param {Object} [options]
 */
async function completeRotation(existingTokenRow, user, connection, { ipAddress, userAgent } = {}) {
  const newSession = await issueNewSession(user, { ipAddress, userAgent }, connection);
  await refreshTokenModel.revokeAndReplace(existingTokenRow.id, newSession.refreshTokenId, connection);
  return newSession;
}

module.exports = {
  issueNewSession,
  rotateRefreshToken,
  completeRotation,
};
