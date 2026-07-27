/**
 * Custom structured request logger.
 * Separate from Morgan: this logs a compact, structured line with
 * precise response time using process.hrtime, useful for spotting
 * slow endpoints during development.
 */
function requestLogger(req, res, next) {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${durationMs}ms)`
    );
  });

  next();
}

module.exports = requestLogger;
