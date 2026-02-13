const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { calculateStats } = require('../utils/stats-calculator');

/**
 * Exports sitemap verification results to PDF format
 */

function generatePdfReport(sitemapUrl, results, duration) {
  const stats = calculateStats(results);
  const durationSec = Math.round(duration / 100) / 10;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Sitemap Verification Report', {
        align: 'center'
      });

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666');
      doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text(`Sitemap: ${sitemapUrl}`, { align: 'center' });
      doc.text(`Duration: ${durationSec}s`, { align: 'center' });

      // Summary Section
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Summary');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      const summaryData = [
        ['Total URLs', stats.totalUrls.toString()],
        ['Successful', `${stats.successful} (${stats.successRate.toFixed(2)}%)`],
        ['Failed', `${stats.failed} (${(100 - stats.successRate).toFixed(2)}%)`],
        ['Avg Response Time', `${stats.avgResponseTime}ms`],
        ['Min Response Time', `${stats.minResponseTime}ms`],
        ['Max Response Time', `${stats.maxResponseTime}ms`],
        ['P50 Response Time', `${stats.p50}ms`],
        ['P95 Response Time', `${stats.p95}ms`],
        ['P99 Response Time', `${stats.p99}ms`]
      ];

      doc.fontSize(10).font('Helvetica');
      summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, { width: 200, continued: true });
        doc.font('Helvetica-Bold').text(value);
        doc.font('Helvetica');
      });

      // Status Code Distribution
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Status Code Distribution');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica');
      Object.entries(stats.statusCodeCounts)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .slice(0, 10)
        .forEach(([code, count]) => {
          const percentage = ((count / stats.totalUrls) * 100).toFixed(1);
          const barLength = Math.round((count / stats.totalUrls) * 40);
          const bar = '█'.repeat(barLength);
          doc.text(`${code}: ${count} (${percentage}%) ${bar}`);
        });

      // Failed URLs
      const failedUrls = results.filter(r => r.statusCode >= 400);
      if (failedUrls.length > 0) {
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#cc0000').text('Failed URLs');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(8).font('Helvetica').fillColor('#000000');
        failedUrls.slice(0, 50).forEach(url => {
          doc.text(`${url.statusCode} - ${url.url}`, {
            width: 500,
            ellipsis: true
          });
        });

        if (failedUrls.length > 50) {
          doc.text(`... and ${failedUrls.length - 50} more`, { style: 'italic' });
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999999').text('Sitemap Verification Bot | Generated with Node.js', {
        align: 'center'
      });

      // Finalize
      resolve(doc);
    } catch (error) {
      reject(error);
    }
  });
}

function savePdfReport(doc, filename) {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = './reports';
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filepath = path.join(reportsDir, filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);
      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generatePdfReport,
  savePdfReport
};
