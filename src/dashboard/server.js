#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('../logger/logger');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /
 * Serve dashboard HTML
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * GET /api/reports
 * List all generated reports
 */
app.get('/api/reports', (req, res) => {
  try {
    const reportsDir = './reports';

    if (!fs.existsSync(reportsDir)) {
      return res.json({ reports: [] });
    }

    const files = fs.readdirSync(reportsDir);
    const reports = files
      .filter(f => f.startsWith('sitemap-check-') && (f.endsWith('.json') || f.endsWith('.html')))
      .map(f => {
        const filepath = path.join(reportsDir, f);
        const stats = fs.statSync(filepath);
        return {
          filename: f,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: path.extname(f)
        };
      })
      .sort((a, b) => b.modified - a.modified);

    res.json({ reports });
  } catch (error) {
    logger.error(`Dashboard API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/report/:filename
 * Get report data (JSON format)
 */
app.get('/api/report/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join('./reports', filename);

    // Only allow JSON files
    if (!filename.endsWith('.json')) {
      return res.status(400).json({ error: 'Only JSON reports can be viewed' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const report = JSON.parse(content);
    res.json(report);
  } catch (error) {
    logger.error(`Dashboard API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /download/:filename
 * Download report file
 */
app.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join('./reports', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filepath);
  } catch (error) {
    logger.error(`Download error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Dashboard running on http://localhost:${PORT}`);
  console.log(`\n📊 Dashboard started`);
  console.log(`🌐 Open: http://localhost:${PORT}\n`);
});

module.exports = app;
