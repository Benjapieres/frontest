/**
 * Calculates statistics from URL check results
 */

function calculateStats(results) {
  if (!results || results.length === 0) {
    return getEmptyStats();
  }

  const successful = results.filter(r => r.statusCode >= 200 && r.statusCode < 400);
  const failed = results.filter(r => r.statusCode >= 400);
  const statusCodeCounts = {};
  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);

  results.forEach(r => {
    statusCodeCounts[r.statusCode] = (statusCodeCounts[r.statusCode] || 0) + 1;
  });

  const successRate = (successful.length / results.length) * 100;

  // Calculate response time percentiles
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const getPercentile = (p) => {
    if (sortedTimes.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedTimes.length) - 1;
    return sortedTimes[Math.max(0, index)];
  };

  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  return {
    totalUrls: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: Math.round(successRate * 100) / 100,
    avgResponseTime,
    minResponseTime: sortedTimes.length > 0 ? sortedTimes[0] : 0,
    maxResponseTime: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
    statusCodeCounts
  };
}

function getEmptyStats() {
  return {
    totalUrls: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
    avgResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    p50: 0,
    p95: 0,
    p99: 0,
    statusCodeCounts: {}
  };
}

function groupErrorsByType(results) {
  const errors = {};

  results
    .filter(r => r.statusCode >= 400)
    .forEach(r => {
      const statusCode = r.statusCode;
      if (!errors[statusCode]) {
        errors[statusCode] = [];
      }
      errors[statusCode].push({
        url: r.url,
        attempts: r.attempts,
        error: r.error
      });
    });

  return errors;
}

module.exports = {
  calculateStats,
  getEmptyStats,
  groupErrorsByType
};
