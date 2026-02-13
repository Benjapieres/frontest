# New Features: API REST, Dashboard & Export Formats

## Overview

Three powerful new features have been added to the Sitemap Verification Bot:

1. **API REST** - Programmatic access to run verifications
2. **Dashboard Web** - Visual interface to view reports and history
3. **Export Formats** - PDF, CSV, and Markdown report generation

---

## 1. API REST Server

### Start the API Server

```bash
npm run api
# Server runs on http://localhost:3000
```

### Configuration

```env
API_PORT=3000  # Port for API server
```

### Endpoints

#### POST /api/verify
Start a new sitemap verification

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

**Format Options:**
- `all` - Generate all report formats
- `html` - HTML report only
- `json` - JSON report only
- `pdf` - PDF report only
- `csv` - CSV export only
- `markdown` - Markdown report only

#### GET /api/verify/:checkId
Get verification status and results

**Request:**
```bash
curl http://localhost:3000/api/verify/check-1707667200000
```

**Response:**
```json
{
  "checkId": "check-1707667200000",
  "status": "completed|running|error",
  "startedAt": "2026-02-12T10:00:00Z",
  "completedAt": "2026-02-12T10:05:30Z",
  "progress": 100,
  "totalUrls": 150,
  "successRate": "96.67",
  "duration": 330.5,
  "reportFiles": {
    "html": "reports/sitemap-check-2026-02-12-1707667200000.html",
    "json": "reports/sitemap-check-2026-02-12-1707667200000.json",
    "pdf": "reports/sitemap-check-2026-02-12-1707667200000.pdf",
    "csv": "reports/sitemap-check-2026-02-12-1707667200000.csv",
    "markdown": "reports/sitemap-check-2026-02-12-1707667200000.md"
  }
}
```

#### GET /api/verify/:checkId/report/:format
Download a specific report

**Supported formats:** html, json, pdf, csv, markdown

**Example:**
```bash
curl http://localhost:3000/api/verify/check-1707667200000/report/pdf \
  -o report.pdf
```

#### GET /api/active-checks
List all active verifications

**Request:**
```bash
curl http://localhost:3000/api/active-checks
```

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

#### GET /api/health
Health check endpoint

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T10:00:00Z",
  "version": "1.0.0"
}
```

### Example: Full Verification Flow

```bash
# 1. Start verification
RESPONSE=$(curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "https://example.com/sitemap.xml"}')

CHECK_ID=$(echo $RESPONSE | jq -r '.checkId')

# 2. Poll for status
while true; do
  STATUS=$(curl http://localhost:3000/api/verify/$CHECK_ID)
  echo "Status: $(echo $STATUS | jq -r '.status')"

  if [ "$(echo $STATUS | jq -r '.status')" == "completed" ]; then
    break
  fi

  sleep 5
done

# 3. Download reports
curl http://localhost:3000/api/verify/$CHECK_ID/report/pdf -o report.pdf
curl http://localhost:3000/api/verify/$CHECK_ID/report/json -o report.json
```

---

## 2. Dashboard Web

### Start the Dashboard

```bash
npm run dashboard
# Dashboard runs on http://localhost:3001
```

### Configuration

```env
DASHBOARD_PORT=3001  # Port for dashboard
```

### Features

- **Reports List** - Browse all generated reports
- **Report Viewer** - View detailed report statistics
- **Download Reports** - Download in any format
- **API Documentation** - Built-in API reference

### Usage

1. Open http://localhost:3001 in your browser
2. View list of all generated reports
3. Click "View" to examine report details
4. Click "Download" to save reports locally

### Tabs

#### Reports Tab
- Lists all generated reports
- Shows file size and creation date
- Quick actions to view or download

#### View Report Tab
- Select a report from dropdown
- View summary statistics
- Browse status code distribution
- See sample URL results

#### API Tab
- API endpoint documentation
- Example requests
- Format specifications

---

## 3. Export Formats

### PDF Report

**Features:**
- Professional formatting
- Executive summary
- Status code distribution
- Failed URLs list
- Page breaks for readability

**Usage:**
```bash
# Generate via API
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "pdf"}'

# File: reports/sitemap-check-YYYY-MM-DD-timestamp.pdf
```

### CSV Export

**Features:**
- Spreadsheet compatible format
- One row per URL
- All status information
- Easy to import into Excel/Google Sheets
- Excel-friendly quoting

**Columns:**
- URL
- Status Code
- Response Time (ms)
- Attempts
- Category
- Description
- Error
- Redirect URL

**Usage:**
```bash
# Generate via API
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "csv"}'

# File: reports/sitemap-check-YYYY-MM-DD-timestamp.csv
```

**Example Import:**
```bash
# Import into Google Sheets
cat reports/sitemap-check-*.csv | pbcopy
# Paste in Google Sheets > File > Import > Paste data

# Open in Excel
open reports/sitemap-check-*.csv
```

### Markdown Report

**Features:**
- GitHub-compatible format
- Tables for data
- Markdown links
- Embeddable in documentation
- Status code emojis (✅ ❌)

**Sections:**
- Summary statistics table
- Status code distribution
- Failed URLs grouped by status code
- Sample URL results table

**Usage:**
```bash
# Generate via API
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "...", "format": "markdown"}'

# File: reports/sitemap-check-YYYY-MM-DD-timestamp.md

# Include in README
cat reports/sitemap-check-*.md >> README.md
```

---

## Integration Examples

### GitHub Actions

```yaml
name: Sitemap Check

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Install dependencies
        run: npm install

      - name: Run verification
        run: |
          curl -X POST http://localhost:3000/api/verify \
            -H "Content-Type: application/json" \
            -d '{
              "sitemapUrl": "https://mysite.com/sitemap.xml",
              "format": "all"
            }'

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: sitemap-reports
          path: reports/
```

### Node.js Script

```javascript
const axios = require('axios');

async function verifySitemap(url) {
  // Start verification
  const { data: { checkId } } = await axios.post(
    'http://localhost:3000/api/verify',
    { sitemapUrl: url }
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

  // Download reports
  const formats = ['pdf', 'csv', 'json'];
  for (const format of formats) {
    const response = await axios.get(
      `http://localhost:3000/api/verify/${checkId}/report/${format}`,
      { responseType: 'arraybuffer' }
    );
    // Save to file...
  }
}
```

### Python Integration

```python
import requests
import time
import json

# Start verification
response = requests.post('http://localhost:3000/api/verify', json={
    'sitemapUrl': 'https://example.com/sitemap.xml',
    'format': 'all'
})

check_id = response.json()['checkId']

# Poll for completion
while True:
    status = requests.get(f'http://localhost:3000/api/verify/{check_id}').json()
    print(f"Status: {status['status']} ({status['progress']}%)")

    if status['status'] == 'completed':
        break

    time.sleep(5)

# Download JSON report
report = requests.get(
    f'http://localhost:3000/api/verify/{check_id}/report/json'
).json()

print(f"Success rate: {report['summary']['successRate']}%")
```

---

## Running Multiple Servers

You can run the CLI, API, and Dashboard simultaneously:

```bash
# Terminal 1: CLI verification
npm start https://example.com/sitemap.xml

# Terminal 2: API server
npm run api

# Terminal 3: Dashboard
npm run dashboard
```

Then:
- Use CLI for one-off checks
- Use API for programmatic access
- Use Dashboard to browse results

---

## File Structure

```
frontest/
├── src/
│   ├── api/
│   │   └── server.js              # API server
│   ├── dashboard/
│   │   ├── server.js              # Dashboard server
│   │   └── public/
│   │       └── index.html         # Dashboard UI
│   └── exporters/
│       ├── pdf-exporter.js        # PDF generation
│       ├── csv-exporter.js        # CSV generation
│       └── markdown-exporter.js   # Markdown generation
├── reports/                       # Generated exports
└── package.json
```

---

## Performance Considerations

- **API:** Handles multiple concurrent verifications
- **Dashboard:** Lightweight, no database required
- **Exports:** Generated on-demand, no storage overhead
- **Memory:** Large sitemaps (100k+ URLs) may need tuning

---

## Security Notes

- API has basic path traversal protection
- Dashboard only serves reports from `./reports/` directory
- All file access is validated
- No authentication needed (add if required)

---

## Troubleshooting

### API won't start
```bash
# Check port is available
lsof -i :3000

# Change port
API_PORT=3001 npm run api
```

### Dashboard shows no reports
```bash
# Run bot first to generate reports
npm start https://example.com/sitemap.xml

# Reports will appear in Dashboard
```

### PDF generation fails
```bash
# pdfkit requires native modules
npm rebuild

# If issues persist, use HTML/CSV/JSON formats instead
```

---

## Next Steps

- Add database for persistent storage
- Add authentication (API keys/OAuth)
- Add real-time WebSocket updates
- Add scheduling/automation
- Add email notifications
