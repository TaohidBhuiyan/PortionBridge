const { testConnection } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * GET /api/v1/health
 * Verifies the API is running and confirms live connectivity to MySQL.
 */
const getHealth = asyncHandler(async (req, res) => {
  const dbConnected = await testConnection();

  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Health check successful',
    data: {
      server: 'running',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { getHealth };
