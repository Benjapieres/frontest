# 🔍 Sitemap Verification Bot

Automated bot that verifies URLs in sitemap XML files to detect broken links (404s), server errors, and other HTTP issues. Perfect for maintaining SEO health and detecting issues before they affect users or search engines.

## Features

### Core Features
✅ **Parallel URL Verification** - Check up to 10 URLs simultaneously (configurable)
✅ **Smart Retry Logic** - Auto-retry with exponential backoff for temporary errors
✅ **Comprehensive Reports** - HTML (interactive), JSON (CI/CD), and console output
✅ **Real-time Progress** - Live progress bar during checks
✅ **Robust Logging** - Winston logger with rotating files
✅ **Sitemap Index Support** - Handle nested sitemaps automatically
✅ **Error Classification** - Intelligent categorization of failures

### Advanced Features (v1.1+)

🚀 **API REST Server** - Programmatic access via HTTP API
- Start verifications asynchronously
- Monitor progress in real-time
- Download reports in multiple formats
- List active verifications
- Health check endpoint

📊 **Web Dashboard** - Interactive web interface
- Browse all generated reports
- View detailed statistics and charts
- Download reports with one click
- Built-in API documentation
- Responsive design

📁 **Multiple Export Formats**
- **PDF** - Professional formatted reports with graphics
- **CSV** - Spreadsheet-compatible for Excel/Google Sheets
- **Markdown** - GitHub-friendly documentation format

## Installation

```bash
npm install
```

## Quick Start

### Using environment variable

```bash
export SITEMAP_URL="https://example.com/sitemap.xml"
npm start
```

### Using command line argument

```bash
npm start https://example.com/sitemap.xml
```

### Using local file

```bash
npm start file://./tests/fixtures/sample-sitemap.xml
```

### API REST Server

```bash
npm run api
# Server runs on http://localhost:3000

# Example: Start verification
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "https://example.com/sitemap.xml"}'
```

### Web Dashboard

```bash
npm run dashboard
# Dashboard opens on http://localhost:3001
```

Visit http://localhost:3001 to browse reports, view statistics, and download results.

### Generate Multiple Report Formats

```bash
# Export as PDF
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "pdf"}'

# Export as CSV
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "csv"}'

# Export as Markdown
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "markdown"}'

# Generate all formats
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "all"}'
```

## Configuration

Create a `.env` file or set environment variables:

```env
SITEMAP_URL=https://example.com/sitemap.xml
MAX_PARALLEL_REQUESTS=10
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
LOG_LEVEL=info
RETRY_DELAY=1000
API_PORT=3000
DASHBOARD_PORT=3001
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `SITEMAP_URL` | - | URL of the sitemap to verify |
| `MAX_PARALLEL_REQUESTS` | 10 | Number of concurrent requests |
| `MAX_RETRIES` | 3 | Number of retry attempts for failed requests |
| `REQUEST_TIMEOUT` | 30000 | HTTP request timeout in milliseconds |
| `LOG_LEVEL` | info | Winston logging level (debug, info, warn, error) |
| `RETRY_DELAY` | 1000 | Initial retry delay in milliseconds |
| `API_PORT` | 3000 | Port for API REST server |
| `DASHBOARD_PORT` | 3001 | Port for web dashboard |

## Usage Examples

### Basic verification

```bash
npm start https://mysite.com/sitemap.xml
```

### With higher concurrency

```bash
MAX_PARALLEL_REQUESTS=20 npm start https://mysite.com/sitemap.xml
```

### With longer timeout for slow servers

```bash
REQUEST_TIMEOUT=60000 npm start https://mysite.com/sitemap.xml
```

## Advanced Usage

### Running Multiple Servers Simultaneously

You can run CLI, API, and Dashboard at the same time:

```bash
# Terminal 1: CLI verification
npm start https://example.com/sitemap.xml

# Terminal 2: API server
npm run api

# Terminal 3: Dashboard
npm run dashboard
```

Then:
- Use CLI for one-off quick checks
- Use API for programmatic access and automation
- Use Dashboard to browse and visualize results

### API Integration Example (Node.js)

```javascript
const axios = require('axios');

async function verifySitemap(url) {
  // Start verification
  const { data: { checkId } } = await axios.post(
    'http://localhost:3000/api/verify',
    { sitemapUrl: url, format: 'all' }
  );

  // Poll until complete
  let status = 'running';
  while (status === 'running') {
    const { data: check } = await axios.get(
      `http://localhost:3000/api/verify/${checkId}`
    );
    status = check.status;
    console.log(`Progress: ${check.progress}%`);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`Success rate: ${check.successRate}%`);
  return check.reportFiles;
}
```

### Dashboard Features

- **Reports Tab**: Browse all generated reports with creation dates and sizes
- **View Report Tab**: Select a report to see:
  - Summary statistics (total, successful, failed, success rate)
  - Status code distribution chart
  - Sample URL results table
- **API Tab**: Built-in reference for all API endpoints

## Output

### Console Output

```
🔍 Sitemap Verification Report
════════════════════════════════════════════════════

Sitemap: https://example.com/sitemap.xml
Duration: 45.2s

┌─ SUMMARY ─────────────────────────────────────────┐
│ Total URLs:          1500                          │
│ Successful:          1450 (96.67%)                 │
│ Failed:              50 (3.33%)                    │
│ Avg Response Time:   234ms                         │
└────────────────────────────────────────────────────┘

📊 Reports saved to:
  • HTML: ./reports/sitemap-check-2026-02-12.html
  • JSON: ./reports/sitemap-check-2026-02-12.json
```

### HTML Report

Located in `./reports/`, the HTML report includes:

- 📊 Executive summary with key metrics
- 📈 Status code distribution charts
- 🔍 Searchable, sortable table of all URLs
- ⚠️ Error summary with details
- 📉 Response time percentiles (p50, p95, p99)

**Features:**
- Real-time search and filtering
- Color-coded status codes (green 2xx, yellow 4xx, red 5xx)
- Interactive sorting by any column
- Responsive design

### JSON Report

Located in `./reports/`, structured for CI/CD integration:

```json
{
  "metadata": {
    "sitemapUrl": "https://example.com/sitemap.xml",
    "timestamp": "2026-02-12T10:30:00.000Z",
    "duration": 45.2
  },
  "summary": {
    "totalUrls": 1500,
    "successful": 1450,
    "failed": 50,
    "successRate": 96.67
  },
  "results": [
    {
      "url": "https://example.com/page1",
      "statusCode": 200,
      "responseTime": 145,
      "attempts": 1,
      "category": "success",
      "description": "Success"
    }
  ],
  "errors": {
    "404": [
      { "url": "https://example.com/missing" }
    ]
  }
}
```

### PDF Report

Located in `./reports/`, generated on-demand via API:

- Professional formatting with colors and graphics
- Executive summary with key metrics
- Status code distribution visualization
- Failed URLs list with details
- Response time statistics
- Print-friendly layout

### CSV Export

Located in `./reports/`, perfect for data analysis:

**Columns:** URL, Status Code, Response Time, Attempts, Category, Description, Error, Redirect URL

**Uses:**
- Import into Excel, Google Sheets, or Numbers
- Perform custom data analysis
- Create pivot tables
- Share with non-technical stakeholders

### Markdown Report

Located in `./reports/`, ideal for documentation:

- GitHub-compatible format
- Tables with statistics
- Status emojis (✅ ❌)
- Embeddable in README or wiki
- Version control friendly

### Logs

Logs are stored in `./logs/`:

- **all-YYYY-MM-DD.log** - All log messages (JSON format)
- **error-YYYY-MM-DD.log** - Only error messages (JSON format)

## Error Handling

### Automatic Retry Logic

| Error Type | Retries | Strategy |
|-----------|---------|----------|
| 404 Not Found | ❌ No | Reported immediately |
| 500/502/503 | ✅ Yes (3x) | Exponential backoff |
| 408 Timeout | ✅ Yes (3x) | Exponential backoff |
| 429 Rate Limit | ✅ Yes (3x) | Exponential backoff |
| DNS Error | ❌ No | Network error |

### Exponential Backoff

Retry delays increase with each attempt:
- Attempt 1 → Wait 1s
- Attempt 2 → Wait 2s
- Attempt 3 → Wait 4s
- (Plus random jitter to prevent thundering herd)

## Testing

### Run unit tests

```bash
npm test
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Test with sample sitemap

```bash
npm start file://./tests/fixtures/sample-sitemap.xml
```

The sample sitemap includes:
- 3 URLs returning 200 OK
- 1 URL returning 404 Not Found
- 1 URL returning 500 Server Error

## Exit Codes

- `0` - All URLs verified successfully
- `1` - Errors found (broken links, server errors, etc.)
- `130` - Interrupted by user (Ctrl+C)

## Performance

### Typical Performance

- **100 URLs**: ~2-5 seconds
- **500 URLs**: ~10-15 seconds
- **1000+ URLs**: ~30-60 seconds

Depends on:
- Network speed
- Server response times
- Parallel concurrency settings
- Number of retries

### Optimization Tips

1. **Increase concurrency** (if target server allows):
   ```bash
   MAX_PARALLEL_REQUESTS=20 npm start <sitemap>
   ```

2. **Adjust timeout** for faster failure detection:
   ```bash
   REQUEST_TIMEOUT=5000 npm start <sitemap>
   ```

3. **Run during off-peak hours** to avoid rate limiting

## API Endpoints

When running `npm run api`, the following endpoints are available:

### POST /api/verify
Start a new sitemap verification.

**Request:**
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "sitemapUrl": "https://example.com/sitemap.xml",
    "format": "all"
  }'
```

**Response:**
```json
{
  "checkId": "check-1707667200000",
  "message": "Verification started",
  "statusUrl": "/api/verify/check-1707667200000"
}
```

### GET /api/verify/:checkId
Get verification status and results.

**Response:**
```json
{
  "checkId": "check-1707667200000",
  "status": "completed",
  "progress": 100,
  "totalUrls": 150,
  "successRate": "96.67",
  "reportFiles": {
    "html": "reports/sitemap-check-2026-02-12-1707667200000.html",
    "json": "reports/sitemap-check-2026-02-12-1707667200000.json",
    "pdf": "reports/sitemap-check-2026-02-12-1707667200000.pdf",
    "csv": "reports/sitemap-check-2026-02-12-1707667200000.csv",
    "markdown": "reports/sitemap-check-2026-02-12-1707667200000.md"
  }
}
```

### GET /api/verify/:checkId/report/:format
Download a specific report format (html, json, pdf, csv, markdown).

```bash
curl http://localhost:3000/api/verify/check-1707667200000/report/pdf \
  -o report.pdf
```

### GET /api/active-checks
List all currently running verifications.

**Response:**
```json
{
  "checks": [
    {
      "id": "check-1707667200000",
      "sitemapUrl": "https://example.com/sitemap.xml",
      "status": "running",
      "progress": 45,
      "totalUrls": 150
    }
  ]
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T10:00:00Z",
  "version": "1.0.0"
}
```

## CI/CD Integration

### GitHub Actions Example (CLI)

```yaml
name: Sitemap Verification
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm start https://mysite.com/sitemap.xml
```

### GitHub Actions Example (API)

```yaml
name: Sitemap Verification with API
on:
  schedule:
    - cron: '0 2 * * *'

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install

      - name: Start API server
        run: npm run api &

      - name: Run verification
        run: |
          sleep 2
          curl -X POST http://localhost:3000/api/verify \
            -H "Content-Type: application/json" \
            -d '{
              "sitemapUrl": "https://mysite.com/sitemap.xml",
              "format": "all"
            }' | tee response.json

          CHECK_ID=$(jq -r '.checkId' response.json)

          # Poll until complete
          while true; do
            STATUS=$(curl http://localhost:3000/api/verify/$CHECK_ID)
            STATE=$(echo $STATUS | jq -r '.status')
            if [ "$STATE" = "completed" ]; then
              break
            fi
            sleep 5
          done

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: sitemap-reports
          path: reports/
```

## Troubleshooting

### "Sitemap URL not provided"

Make sure to provide the sitemap URL:

```bash
npm start https://example.com/sitemap.xml
```

### "Timeout" errors

Increase the timeout:

```bash
REQUEST_TIMEOUT=60000 npm start <sitemap>
```

### "Rate limiting" (429 errors)

Reduce concurrent requests:

```bash
MAX_PARALLEL_REQUESTS=5 npm start <sitemap>
```

### "Address already in use" (if running locally)

The bot doesn't bind to any ports. If you see this, it's from another process.

## Architecture

```
frontest/
├── config/
│   └── default.js              # Configuration
├── src/
│   ├── index.js               # Main entry point
│   ├── parser/
│   │   └── sitemap-parser.js   # XML parsing
│   ├── crawler/
│   │   ├── http-checker.js     # HTTP requests
│   │   ├── retry-handler.js    # Retry logic
│   │   └── parallel-executor.js # Concurrency control
│   ├── reporters/
│   │   ├── html-reporter.js    # HTML report generation
│   │   ├── json-reporter.js    # JSON report generation
│   │   └── console-reporter.js # Console output
│   ├── exporters/              # NEW: Export formats
│   │   ├── pdf-exporter.js     # PDF generation
│   │   ├── csv-exporter.js     # CSV export
│   │   └── markdown-exporter.js # Markdown export
│   ├── api/                    # NEW: REST API server
│   │   └── server.js           # Express API
│   ├── dashboard/              # NEW: Web dashboard
│   │   ├── server.js           # Dashboard server
│   │   └── public/
│   │       └── index.html      # Dashboard UI
│   ├── logger/
│   │   └── logger.js           # Winston logging
│   └── utils/
│       ├── error-classifier.js # Error categorization
│       └── stats-calculator.js # Statistics calculation
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration.test.js     # Integration tests
│   └── fixtures/               # Sample sitemaps
├── reports/                    # Generated reports
└── logs/                       # Log files
```

## Dependencies

### Core Dependencies
- **axios** - HTTP client for URL verification
- **xml2js** - XML parsing for sitemaps
- **p-limit** - Concurrency control for parallel requests
- **winston** - Structured logging system
- **chalk** - Terminal colors and formatting
- **cli-progress** - Progress bar in console
- **handlebars** - HTML template engine
- **dotenv** - Environment variable loading

### API & Dashboard Dependencies
- **express** - Web framework for API and dashboard
- **cors** - Cross-Origin Resource Sharing middleware
- **pdfkit** - PDF document generation
- **papaparse** - CSV parsing and generation

## Additional Documentation

For detailed information about new features, see:

- **[NEW_FEATURES.md](./NEW_FEATURES.md)** - Complete documentation for API, Dashboard, and export formats
- **[FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md)** - Quick reference guide for all features
- **[PLAN.md](./PLAN.md)** - Architecture and design documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details and verification

## License

MIT

## Support

For issues or feature requests, please open an issue on GitHub.
