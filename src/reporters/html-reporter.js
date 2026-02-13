const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('../logger/logger');
const { calculateStats, groupErrorsByType } = require('../utils/stats-calculator');
const config = require('../../config/default');

/**
 * Generates interactive HTML report
 */

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap Verification Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .sitemap-url {
            color: #666;
            font-family: monospace;
            word-break: break-all;
            margin: 10px 0;
        }
        .timestamp { color: #999; font-size: 12px; margin-top: 10px; }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        .stat-label {
            color: #999;
            font-size: 12px;
            text-transform: uppercase;
        }
        .stat-success .stat-value { color: #22c55e; }
        .stat-failed .stat-value { color: #ef4444; }
        .stat-time .stat-value { color: #f59e0b; }

        .chart-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chart-section h2 { color: #333; margin-bottom: 15px; font-size: 18px; }

        .status-bars {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .status-bar {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .status-label {
            min-width: 120px;
            text-align: right;
            font-size: 12px;
            color: #666;
        }
        .status-container {
            flex: 1;
            height: 24px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            display: flex;
        }
        .status-bar-fill {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            color: white;
            font-size: 11px;
            font-weight: bold;
        }
        .status-2xx { background: #22c55e; }
        .status-3xx { background: #3b82f6; }
        .status-4xx { background: #f59e0b; }
        .status-5xx { background: #ef4444; }
        .status-null { background: #9ca3af; }

        .table-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table-section h2 { color: #333; margin-bottom: 15px; font-size: 18px; }

        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        input[type="text"], select {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        input[type="text"] { flex: 1; min-width: 200px; }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        thead {
            background: #f3f4f6;
            cursor: pointer;
        }
        th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        th:hover { background: #e5e7eb; }
        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover { background: #f9fafb; }

        .status-200 { color: #22c55e; font-weight: 600; }
        .status-301 { color: #3b82f6; }
        .status-404 { color: #f59e0b; font-weight: 600; }
        .status-500 { color: #ef4444; font-weight: 600; }
        .status-null { color: #9ca3af; }

        .url-cell {
            font-family: monospace;
            font-size: 11px;
            word-break: break-all;
            max-width: 400px;
        }

        .error-section {
            background: #fef2f2;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-section h2 {
            color: #991b1b;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .error-group {
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-left: 4px solid #ef4444;
            border-radius: 4px;
        }
        .error-code {
            font-weight: 600;
            color: #ef4444;
            margin-bottom: 8px;
        }
        .error-url {
            font-family: monospace;
            font-size: 11px;
            color: #666;
            word-break: break-all;
            margin: 5px 0;
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Sitemap Verification Report</h1>
            <div class="sitemap-url">Sitemap: {{sitemapUrl}}</div>
            <div class="timestamp">Generated: {{timestamp}}</div>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-label">Total URLs</div>
                <div class="stat-value">{{stats.totalUrls}}</div>
            </div>
            <div class="stat-card stat-success">
                <div class="stat-label">Successful</div>
                <div class="stat-value">{{stats.successful}}</div>
            </div>
            <div class="stat-card stat-failed">
                <div class="stat-label">Failed</div>
                <div class="stat-value">{{stats.failed}}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Success Rate</div>
                <div class="stat-value">{{stats.successRate}}%</div>
            </div>
            <div class="stat-card stat-time">
                <div class="stat-label">Avg Response</div>
                <div class="stat-value">{{stats.avgResponseTime}}ms</div>
            </div>
        </div>

        <div class="chart-section">
            <h2>Status Code Distribution</h2>
            <div class="status-bars">
                {{#each statusBars}}
                <div class="status-bar">
                    <div class="status-label">{{this.label}}</div>
                    <div class="status-container">
                        <div class="status-bar-fill status-{{this.cssClass}}" style="width: {{this.percentage}}%">
                            {{this.count}} ({{this.percentage}}%)
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>
        </div>

        {{#if results}}
        <div class="table-section">
            <h2>URL Check Results</h2>
            <div class="controls">
                <input type="text" id="searchInput" placeholder="Search URLs...">
                <select id="filterStatus">
                    <option value="">All Status Codes</option>
                    <option value="200">200 OK</option>
                    <option value="301">301 Redirect</option>
                    <option value="404">404 Not Found</option>
                    <option value="500">500+ Server Errors</option>
                </select>
            </div>
            <table id="resultsTable">
                <thead>
                    <tr>
                        <th onclick="sortTable(0)">URL 🔄</th>
                        <th onclick="sortTable(1)">Status 🔄</th>
                        <th onclick="sortTable(2)">Response Time 🔄</th>
                        <th onclick="sortTable(3)">Attempts 🔄</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    {{#each results}}
                    <tr class="status-row" data-status="{{this.statusCode}}">
                        <td class="url-cell">{{this.url}}</td>
                        <td><span class="status-{{this.statusCode}}">{{this.statusCode}}</span></td>
                        <td>{{this.responseTime}}ms</td>
                        <td>{{this.attempts}}</td>
                        <td>{{this.description}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
        {{/if}}

        {{#if errorGroups}}
        <div class="error-section">
            <h2>⚠️ Error Summary</h2>
            {{#each errorGroups}}
            <div class="error-group">
                <div class="error-code">Status {{this.statusCode}} - {{this.count}} error(s)</div>
                {{#each this.urls}}
                <div class="error-url">• {{this.url}}</div>
                {{/each}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        <div class="footer">
            <p>Sitemap Verification Bot | Report generated on {{timestamp}}</p>
        </div>
    </div>

    <script>
        function sortTable(columnIndex) {
            const table = document.getElementById('resultsTable');
            const tbody = document.getElementById('tableBody');
            const rows = Array.from(tbody.getElementsByTagName('tr'));

            const isAscending = table.dataset.sortColumn === columnIndex && table.dataset.sortOrder === 'asc';
            table.dataset.sortColumn = columnIndex;
            table.dataset.sortOrder = isAscending ? 'desc' : 'asc';

            rows.sort((a, b) => {
                const aValue = a.cells[columnIndex].textContent.trim();
                const bValue = b.cells[columnIndex].textContent.trim();

                const aNum = parseInt(aValue) || aValue;
                const bNum = parseInt(bValue) || bValue;

                if (typeof aNum === 'number' && typeof bNum === 'number') {
                    return isAscending ? bNum - aNum : aNum - bNum;
                }
                return isAscending ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
            });

            rows.forEach(row => tbody.appendChild(row));
        }

        document.getElementById('searchInput').addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#tableBody tr');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none';
            });
        });

        document.getElementById('filterStatus').addEventListener('change', function() {
            const filter = this.value;
            const rows = document.querySelectorAll('#tableBody tr');
            rows.forEach(row => {
                if (!filter) {
                    row.style.display = '';
                } else {
                    const statusCell = row.cells[1].textContent.trim();
                    if (filter === '500' && parseInt(statusCell) >= 500) {
                        row.style.display = '';
                    } else if (statusCell === filter) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    </script>
</body>
</html>`;

function generateStatusBars(statusCodeCounts, total) {
  const statusGroups = {
    '2xx (Success)': { codes: [200, 201, 204], color: '2xx' },
    '3xx (Redirect)': { codes: [301, 302, 304], color: '3xx' },
    '4xx (Client Error)': { codes: [400, 401, 403, 404, 405, 408, 429], color: '4xx' },
    '5xx (Server Error)': { codes: [500, 501, 502, 503, 504], color: '5xx' },
    'Network Error': { codes: [null], color: 'null' }
  };

  const bars = [];
  for (const [label, config] of Object.entries(statusGroups)) {
    let count = 0;
    config.codes.forEach(code => {
      count += statusCodeCounts[code] || 0;
    });

    if (count > 0) {
      bars.push({
        label,
        count,
        percentage: Math.round((count / total) * 100),
        cssClass: config.color
      });
    }
  }
  return bars;
}

function generateHtmlReport(sitemapUrl, results, duration) {
  const stats = calculateStats(results);
  const errors = groupErrorsByType(results);

  // Prepare error groups for template
  const errorGroups = Object.entries(errors)
    .map(([statusCode, urls]) => ({
      statusCode,
      count: urls.length,
      urls: urls.map(u => ({ url: u.url }))
    }))
    .sort((a, b) => parseInt(b.statusCode) - parseInt(a.statusCode));

  const statusBars = generateStatusBars(stats.statusCodeCounts, stats.totalUrls);

  const template = Handlebars.compile(HTML_TEMPLATE);
  const html = template({
    sitemapUrl,
    timestamp: new Date().toLocaleString(),
    stats: {
      totalUrls: stats.totalUrls,
      successful: stats.successful,
      failed: stats.failed,
      successRate: stats.successRate.toFixed(2),
      avgResponseTime: stats.avgResponseTime
    },
    statusBars,
    results: results.slice(0, 5000), // Limit to prevent huge DOM
    errorGroups: errorGroups.slice(0, 100)
  });

  return html;
}

function saveHtmlReport(html) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportDir = config.reporting.outputDirectory;

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const filename = `sitemap-check-${timestamp}-${Date.now()}.html`;
  const filepath = path.join(reportDir, filename);

  try {
    fs.writeFileSync(filepath, html);
    logger.info(`HTML report saved: ${filepath}`);
    return filepath;
  } catch (error) {
    logger.error(`Failed to save HTML report: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateHtmlReport,
  saveHtmlReport
};
