#!/usr/bin/env node

require('dotenv').config();
const chalk = require('chalk');
const logger = require('./logger/logger');
const { parseSitemap } = require('./parser/sitemap-parser');
const { executeParallel } = require('./crawler/parallel-executor');
const { generateHtmlReport, saveHtmlReport } = require('./reporters/html-reporter');
const { generateJsonReport, saveJsonReport } = require('./reporters/json-reporter');
const { ProgressReporter, printSummary, printReportPaths } = require('./reporters/console-reporter');
const config = require('../config/default');

/**
 * Main entry point - orchestrates the sitemap verification flow
 */

async function main() {
  const startTime = Date.now();

  try {
    // Get sitemap URL from CLI arguments or environment
    let sitemapUrl = process.argv[2] || process.env.SITEMAP_URL;

    if (!sitemapUrl) {
      console.error(chalk.red('Error: Sitemap URL not provided'));
      console.error(chalk.gray('Usage: npm start <sitemap-url> or set SITEMAP_URL env var'));
      process.exit(1);
    }

    logger.info(`Starting sitemap verification for: ${sitemapUrl}`);

    // Step 1: Parse sitemap
    console.log(chalk.cyan('\n🔄 Parsing sitemap...'));
    const urls = await parseSitemap(sitemapUrl);

    if (urls.length === 0) {
      console.error(chalk.red('Error: No URLs found in sitemap'));
      process.exit(1);
    }

    console.log(chalk.green(`✓ Found ${urls.length} URLs to check`));

    // Step 2: Execute parallel checks with progress
    console.log(chalk.cyan('\n🔄 Starting URL verification...'));
    const progressReporter = new ProgressReporter(urls.length);

    let completedCount = 0;
    const results = await executeParallel(urls, (progress) => {
      completedCount = progress.completed;
      progressReporter.update(completedCount);
    });

    progressReporter.stop();

    // Step 3: Generate reports
    console.log(chalk.cyan('\n🔄 Generating reports...'));

    const duration = Date.now() - startTime;

    // Generate and save reports
    const htmlReport = generateHtmlReport(sitemapUrl, results, duration);
    const jsonReport = generateJsonReport(sitemapUrl, results, duration);

    const htmlPath = saveHtmlReport(htmlReport);
    const jsonPath = saveJsonReport(jsonReport);

    // Step 4: Print summary
    printSummary(sitemapUrl, results, duration);
    printReportPaths(htmlPath, jsonPath);

    // Determine exit code based on errors
    const failedUrls = results.filter(r => r.statusCode >= 400);
    const hasErrors = failedUrls.length > 0;

    if (hasErrors) {
      logger.warn(`Verification completed with ${failedUrls.length} failed URLs`);
      process.exit(1);
    } else {
      logger.info('Verification completed successfully');
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    console.error(chalk.red(`\n✗ Error: ${error.message}`));
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.warn('Interrupted by user');
  console.log(chalk.yellow('\n\nInterrupted. Cleaning up...'));
  process.exit(130);
});

process.on('SIGTERM', () => {
  logger.warn('Terminated');
  process.exit(1);
});

// Run main
main();
