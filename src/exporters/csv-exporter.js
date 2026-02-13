const fs = require('fs');
const path = require('path');

/**
 * Exports sitemap verification results to CSV format
 */

function generateCsvReport(results) {
  // CSV header
  const headers = ['URL', 'Status Code', 'Response Time (ms)', 'Attempts', 'Category', 'Description', 'Error', 'Redirect URL'];

  // CSV rows
  const rows = results.map(result => [
    `"${result.url.replace(/"/g, '""')}"`, // Escape quotes in URL
    result.statusCode || 'N/A',
    result.responseTime,
    result.attempts,
    result.category || 'unknown',
    `"${(result.description || '').replace(/"/g, '""')}"`,
    result.error ? `"${result.error.replace(/"/g, '""')}"` : '',
    result.redirectUrl ? `"${result.redirectUrl.replace(/"/g, '""')}"` : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

function saveCsvReport(csvContent, filename) {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = './reports';
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filepath = path.join(reportsDir, filename);
      fs.writeFileSync(filepath, csvContent, 'utf-8');
      resolve(filepath);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateCsvReport,
  saveCsvReport
};
