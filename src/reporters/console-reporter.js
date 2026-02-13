const chalk = require('chalk');
const cliProgress = require('cli-progress');
const logger = require('../logger/logger');
const { calculateStats, groupErrorsByType } = require('../utils/stats-calculator');

/**
 * Console reporter with progress bar and formatted output
 */

class ProgressReporter {
  constructor(totalUrls) {
    this.totalUrls = totalUrls;
    this.progressBar = new cliProgress.SingleBar({
      format: 'Checking URLs | {bar} | {percentage}% || {value}/{total} URLs | ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      stopOnComplete: true
    });
    this.progressBar.start(totalUrls, 0);
  }

  update(completed) {
    this.progressBar.update(completed);
  }

  stop() {
    this.progressBar.stop();
  }
}

function padRight(str, width) {
  return String(str).padEnd(width);
}

function padLeft(str, width) {
  return String(str).padStart(width);
}

function printSummary(sitemapUrl, results, durationMs) {
  const stats = calculateStats(results);
  const durationSec = Math.round(durationMs / 100) / 10;

  console.log('\n');
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║         SITEMAP VERIFICATION REPORT                  ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════╝'));
  console.log('');

  console.log(chalk.gray(`Sitemap: ${sitemapUrl}`));
  console.log(chalk.gray(`Duration: ${durationSec}s`));
  console.log('');

  // Summary Stats
  console.log(chalk.bold.cyan('┌────────────────────────────────────────────────────┐'));
  console.log(chalk.bold.cyan('│ SUMMARY                                              │'));
  console.log(chalk.bold.cyan('├────────────────────────────────────────────────────┤'));

  const summaryLines = [
    ['Total URLs', `${stats.totalUrls}`],
    ['Successful', chalk.green(`${stats.successful} (${stats.successRate.toFixed(2)}%)`)],
    ['Failed', chalk.red(`${stats.failed} (${(100 - stats.successRate).toFixed(2)}%)`)],
    ['Avg Response Time', `${stats.avgResponseTime}ms`],
    ['Min Response Time', `${stats.minResponseTime}ms`],
    ['Max Response Time', `${stats.maxResponseTime}ms`],
    ['P50 Response Time', `${stats.p50}ms`],
    ['P95 Response Time', `${stats.p95}ms`],
    ['P99 Response Time', `${stats.p99}ms`]
  ];

  summaryLines.forEach(([label, value]) => {
    console.log(chalk.cyan('│ ') + padRight(label, 22) + padRight(value, 26) + chalk.cyan('│'));
  });

  console.log(chalk.bold.cyan('└────────────────────────────────────────────────────┘'));
  console.log('');

  // Status Code Distribution
  console.log(chalk.bold.cyan('┌────────────────────────────────────────────────────┐'));
  console.log(chalk.bold.cyan('│ STATUS CODE DISTRIBUTION                             │'));
  console.log(chalk.bold.cyan('├────────────────────────────────────────────────────┤'));

  const statusCodes = Object.entries(stats.statusCodeCounts)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .slice(0, 10);

  statusCodes.forEach(([code, count]) => {
    const percentage = ((count / stats.totalUrls) * 100).toFixed(1);
    const barLength = Math.round((count / stats.totalUrls) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);

    let coloredCode = code;
    if (code >= 200 && code < 300) coloredCode = chalk.green(code);
    else if (code >= 300 && code < 400) coloredCode = chalk.blue(code);
    else if (code >= 400 && code < 500) coloredCode = chalk.yellow(code);
    else if (code >= 500) coloredCode = chalk.red(code);

    const codePart = padRight(coloredCode, 12);
    const countPart = padLeft(count, 8);
    const percentPart = padLeft(`${percentage}%`, 12);

    console.log(chalk.cyan('│ ') + codePart + countPart + percentPart + ' ' + bar + chalk.cyan(' │'));
  });

  console.log(chalk.bold.cyan('└────────────────────────────────────────────────────┘'));
  console.log('');

  // Error Summary
  if (stats.failed > 0) {
    const errors = groupErrorsByType(results);
    console.log(chalk.bold.red('⚠️  ERROR SUMMARY'));
    console.log('');

    Object.entries(errors)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([statusCode, failedUrls]) => {
        console.log(chalk.red(`  Status ${statusCode}: ${failedUrls.length} error(s)`));
        failedUrls.slice(0, 3).forEach(failure => {
          console.log(chalk.gray(`    • ${failure.url}`));
        });
        if (failedUrls.length > 3) {
          console.log(chalk.gray(`    ... and ${failedUrls.length - 3} more`));
        }
      });
    console.log('');
  }
}

function printReportPaths(htmlPath, jsonPath) {
  console.log(chalk.bold.cyan('\n📊 Reports saved to:'));
  console.log(chalk.gray(`  • HTML: ${htmlPath}`));
  console.log(chalk.gray(`  • JSON: ${jsonPath}`));
  console.log('');
}

module.exports = {
  ProgressReporter,
  printSummary,
  printReportPaths
};
