# 🔍 Sitemap Verification Bot

Automated bot that verifies URLs in sitemap XML files to detect broken links (404s), server errors, and other HTTP issues. Perfect for maintaining SEO health and detecting issues before they affect users or search engines.

## Features

✅ **Parallel URL Verification** - Check up to 10 URLs simultaneously (configurable)
✅ **Smart Retry Logic** - Auto-retry with exponential backoff for temporary errors
✅ **Comprehensive Reports** - HTML (interactive), JSON (CI/CD), and console output
✅ **Real-time Progress** - Live progress bar during checks
✅ **Robust Logging** - Winston logger with rotating files
✅ **Sitemap Index Support** - Handle nested sitemaps automatically
✅ **Error Classification** - Intelligent categorization of failures

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

## Configuration

Create a `.env` file or set environment variables:

```env
SITEMAP_URL=https://example.com/sitemap.xml
MAX_PARALLEL_REQUESTS=10
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
LOG_LEVEL=info
RETRY_DELAY=1000
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

## CI/CD Integration

### GitHub Actions Example

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
│   ├── logger/
│   │   └── logger.js           # Winston logging
│   └── utils/
│       ├── error-classifier.js # Error categorization
│       └── stats-calculator.js # Statistics calculation
├── tests/
│   ├── unit/                   # Unit tests
│   └── fixtures/               # Sample sitemaps
├── reports/                    # Generated reports
└── logs/                       # Log files
```

## Dependencies

- **axios** - HTTP client
- **xml2js** - XML parsing
- **p-limit** - Concurrency control
- **winston** - Logging
- **chalk** - Terminal colors
- **cli-progress** - Progress bars
- **handlebars** - HTML templating

## License

MIT

## Support

For issues or feature requests, please open an issue on GitHub.
