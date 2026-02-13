const fs = require('fs');
const path = require('path');
const logger = require('../logger/logger');
const { calculateStats, groupErrorsByType } = require('../utils/stats-calculator');
const config = require('../../config/default');

/**
 * Generates JSON report for CI/CD integration
 */

function generateJsonReport(sitemapUrl, results, duration) {
  const stats = calculateStats(results);
  const errors = groupErrorsByType(results);

  const report = {
    metadata: {
      sitemapUrl,
      timestamp: new Date().toISOString(),
      duration: Math.round(duration / 100) / 10, // Convert to seconds
      generatedAt: new Date().toLocaleString()
    },
    summary: {
      totalUrls: stats.totalUrls,
      successful: stats.successful,
      failed: stats.failed,
      successRate: stats.successRate,
      avgResponseTime: stats.avgResponseTime,
      minResponseTime: stats.minResponseTime,
      maxResponseTime: stats.maxResponseTime,
      p50ResponseTime: stats.p50,
      p95ResponseTime: stats.p95,
      p99ResponseTime: stats.p99
    },
    statusCodeDistribution: stats.statusCodeCounts,
    results: results.map(r => ({
      url: r.url,
      statusCode: r.statusCode,
      responseTime: r.responseTime,
      attempts: r.attempts,
      category: r.category,
      description: r.description,
      error: r.error,
      redirectUrl: r.redirectUrl
    })),
    errors: Object.entries(errors).reduce((acc, [statusCode, failedUrls]) => {
      acc[statusCode] = failedUrls;
      return acc;
    }, {})
  };

  return report;
}

function saveJsonReport(report) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportDir = config.reporting.outputDirectory;

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const filename = `sitemap-check-${timestamp}-${Date.now()}.json`;
  const filepath = path.join(reportDir, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    logger.info(`JSON report saved: ${filepath}`);
    return filepath;
  } catch (error) {
    logger.error(`Failed to save JSON report: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateJsonReport,
  saveJsonReport
};
