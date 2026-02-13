#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('../logger/logger');
const { parseSitemap } = require('../parser/sitemap-parser');
const { executeParallel } = require('../crawler/parallel-executor');
const { generateHtmlReport, saveHtmlReport } = require('../reporters/html-reporter');
const { generateJsonReport, saveJsonReport } = require('../reporters/json-reporter');
const { generatePdfReport, savePdfReport } = require('../exporters/pdf-exporter');
const { generateCsvReport, saveCsvReport } = require('../exporters/csv-exporter');
const { generateMarkdownReport, saveMarkdownReport } = require('../exporters/markdown-exporter');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Store for active checks (in-memory, can be replaced with DB)
const activeChecks = new Map();

/**
 * POST /api/verify
 * Start a new sitemap verification
 */
app.post('/api/verify', async (req, res) => {
  try {
    const { sitemapUrl, format = 'all' } = req.body;

    if (!sitemapUrl) {
      return res.status(400).json({ error: 'sitemapUrl is required' });
    }

    const checkId = `check-${Date.now()}`;
    logger.info(`Starting API verification: ${checkId} for ${sitemapUrl}`);

    // Store check metadata
    activeChecks.set(checkId, {
      id: checkId,
      sitemapUrl,
      status: 'running',
      startedAt: new Date(),
      progress: 0,
      totalUrls: 0
    });

    // Respond immediately with check ID
    res.json({
      checkId,
      message: 'Verification started',
      statusUrl: `/api/verify/${checkId}`
    });

    // Run verification in background
    runVerification(checkId, sitemapUrl, format).catch(error => {
      logger.error(`Verification error for ${checkId}: ${error.message}`);
      const check = activeChecks.get(checkId);
      if (check) {
        check.status = 'error';
        check.error = error.message;
      }
    });
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/verify/:checkId
 * Get status and results of a verification
 */
app.get('/api/verify/:checkId', (req, res) => {
  try {
    const { checkId } = req.params;
    const check = activeChecks.get(checkId);

    if (!check) {
      return res.status(404).json({ error: 'Check not found' });
    }

    res.json({
      checkId: check.id,
      status: check.status,
      startedAt: check.startedAt,
      completedAt: check.completedAt,
      progress: check.progress,
      totalUrls: check.totalUrls,
      successRate: check.successRate,
      reportFiles: check.reportFiles,
      error: check.error
    });
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/verify/:checkId/report/:format
 * Download a specific report format
 */
app.get('/api/verify/:checkId/report/:format', (req, res) => {
  try {
    const { checkId, format } = req.params;
    const check = activeChecks.get(checkId);

    if (!check) {
      return res.status(404).json({ error: 'Check not found' });
    }

    if (check.status !== 'completed') {
      return res.status(400).json({ error: 'Check not completed yet' });
    }

    if (!check.reportFiles || !check.reportFiles[format]) {
      return res.status(404).json({ error: `Report format ${format} not available` });
    }

    const filepath = check.reportFiles[format];
    res.download(filepath);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

/**
 * GET /api/active-checks
 * List all active checks
 */
app.get('/api/active-checks', (req, res) => {
  try {
    const checks = Array.from(activeChecks.values()).map(check => ({
      id: check.id,
      sitemapUrl: check.sitemapUrl,
      status: check.status,
      progress: check.progress,
      totalUrls: check.totalUrls
    }));

    res.json({ checks });
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Run verification in background
 */
async function runVerification(checkId, sitemapUrl, format) {
  const check = activeChecks.get(checkId);
  const startTime = Date.now();

  try {
    // Parse sitemap
    logger.info(`[${checkId}] Parsing sitemap`);
    const urls = await parseSitemap(sitemapUrl);
    check.totalUrls = urls.length;

    // Execute parallel checks
    logger.info(`[${checkId}] Starting parallel checks for ${urls.length} URLs`);
    let completedCount = 0;

    const results = await executeParallel(urls, (progress) => {
      completedCount = progress.completed;
      check.progress = Math.round((completedCount / urls.length) * 100);
    });

    // Generate reports
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString().split('T')[0];
    const reportFiles = {};

    logger.info(`[${checkId}] Generating reports`);

    // HTML
    if (format === 'all' || format === 'html') {
      const htmlReport = generateHtmlReport(sitemapUrl, results, duration);
      const htmlPath = await saveHtmlReport(htmlReport);
      reportFiles.html = htmlPath;
    }

    // JSON
    if (format === 'all' || format === 'json') {
      const jsonReport = generateJsonReport(sitemapUrl, results, duration);
      const jsonPath = await saveJsonReport(jsonReport);
      reportFiles.json = jsonPath;
    }

    // PDF
    if (format === 'all' || format === 'pdf') {
      try {
        const pdfDoc = await generatePdfReport(sitemapUrl, results, duration);
        const pdfPath = await savePdfReport(pdfDoc, `sitemap-check-${timestamp}-${Date.now()}.pdf`);
        reportFiles.pdf = pdfPath;
      } catch (error) {
        logger.warn(`Failed to generate PDF: ${error.message}`);
      }
    }

    // CSV
    if (format === 'all' || format === 'csv') {
      const csvContent = generateCsvReport(results);
      const csvPath = await saveCsvReport(csvContent, `sitemap-check-${timestamp}-${Date.now()}.csv`);
      reportFiles.csv = csvPath;
    }

    // Markdown
    if (format === 'all' || format === 'markdown') {
      const mdContent = generateMarkdownReport(sitemapUrl, results, duration);
      const mdPath = await saveMarkdownReport(mdContent, `sitemap-check-${timestamp}-${Date.now()}.md`);
      reportFiles.markdown = mdPath;
    }

    // Calculate stats
    const successful = results.filter(r => r.statusCode >= 200 && r.statusCode < 400).length;
    const successRate = (successful / results.length) * 100;

    // Update check status
    check.status = 'completed';
    check.completedAt = new Date();
    check.reportFiles = reportFiles;
    check.successRate = successRate.toFixed(2);
    check.duration = duration / 1000;

    logger.info(`[${checkId}] Verification completed: ${successful}/${results.length} successful`);
  } catch (error) {
    logger.error(`[${checkId}] Verification failed: ${error.message}`);
    check.status = 'error';
    check.error = error.message;
  }
}

// Start server
app.listen(PORT, () => {
  logger.info(`Sitemap Verification API running on http://localhost:${PORT}`);
  console.log(`\n🚀 API Server started`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`\n📚 Endpoints:`);
  console.log(`   POST   /api/verify                    - Start new verification`);
  console.log(`   GET    /api/verify/:checkId           - Get verification status`);
  console.log(`   GET    /api/verify/:checkId/report/:format - Download report`);
  console.log(`   GET    /api/active-checks             - List active checks`);
  console.log(`   GET    /api/health                    - Health check\n`);
});

module.exports = app;
