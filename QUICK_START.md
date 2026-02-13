# Quick Start Guide

## Installation

```bash
npm install
```

## Run the Bot

### Option 1: Using Command Line Argument
```bash
npm start https://example.com/sitemap.xml
```

### Option 2: Using Environment Variable
```bash
export SITEMAP_URL=https://example.com/sitemap.xml
npm start
```

### Option 3: Using Local File
```bash
npm start ./path/to/sitemap.xml
```

## View Reports

After running the bot, reports are generated in the `./reports/` directory:

- **HTML Report**: Open `sitemap-check-*.html` in your browser for an interactive view
- **JSON Report**: Use `sitemap-check-*.json` for CI/CD integration or programmatic access

## View Logs

Logs are saved in `./logs/`:

- **all-YYYY-MM-DD.log** - All messages
- **error-YYYY-MM-DD.log** - Only errors

## Test with Sample Sitemap

A sample sitemap is included for testing:

```bash
npm start ./tests/fixtures/sample-sitemap.xml
```

This will check 5 test URLs and generate reports.

## Run Tests

```bash
npm test
```

## Configuration

Create a `.env` file to override defaults:

```env
SITEMAP_URL=https://example.com/sitemap.xml
MAX_PARALLEL_REQUESTS=10
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
LOG_LEVEL=info
```

## Exit Codes

- `0` - Success (no errors found)
- `1` - Errors detected or failure
- `130` - Interrupted by user

## Example Output

```
╔════════════════════════════════════════════════════╗
║         SITEMAP VERIFICATION REPORT                  ║
╚════════════════════════════════════════════════════╝

Sitemap: https://example.com/sitemap.xml
Duration: 45.2s

┌────────────────────────────────────────────────────┐
│ SUMMARY                                              │
├────────────────────────────────────────────────────┤
│ Total URLs            1500                          │
│ Successful            1450 (96.67%)                 │
│ Failed                50 (3.33%)                    │
│ Avg Response Time     234ms                         │
└────────────────────────────────────────────────────┘

📊 Reports saved to:
  • HTML: ./reports/sitemap-check-2026-02-12.html
  • JSON: ./reports/sitemap-check-2026-02-12.json
```

## Troubleshooting

### Bot is slow
- Increase timeout: `REQUEST_TIMEOUT=60000 npm start <url>`
- Increase parallelism: `MAX_PARALLEL_REQUESTS=20 npm start <url>`

### Getting rate limited (429 errors)
- Reduce parallelism: `MAX_PARALLEL_REQUESTS=5 npm start <url>`
- Run during off-peak hours

### Network errors
- Increase timeout: `REQUEST_TIMEOUT=60000 npm start <url>`
- Check network connectivity

## Next Steps

See [README.md](./README.md) for detailed documentation.
