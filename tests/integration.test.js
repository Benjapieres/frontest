/**
 * Integration tests for the sitemap verification bot
 * Tests report generation and statistics
 */

const { generateJsonReport } = require('../src/reporters/json-reporter');
const { generateHtmlReport } = require('../src/reporters/html-reporter');
const { calculateStats } = require('../src/utils/stats-calculator');

describe('Integration Tests', () => {
  test('should generate statistics from mixed results', () => {
    const mockResults = [
      { url: 'https://example.com/1', statusCode: 200, responseTime: 100 },
      { url: 'https://example.com/2', statusCode: 200, responseTime: 150 },
      { url: 'https://example.com/3', statusCode: 200, responseTime: 120 },
      { url: 'https://example.com/4', statusCode: 404, responseTime: 50 },
      { url: 'https://example.com/5', statusCode: 500, responseTime: 200 }
    ];

    const stats = calculateStats(mockResults);

    expect(stats.totalUrls).toBe(5);
    expect(stats.successful).toBe(3);
    expect(stats.failed).toBe(2);
    expect(stats.successRate).toBe(60);
    expect(stats.avgResponseTime).toBe(124);
  });

  test('should generate JSON report with correct structure', () => {
    const mockResults = [
      { url: 'https://example.com/1', statusCode: 200, responseTime: 100, attempts: 1, category: 'success', description: 'OK', error: null, redirectUrl: null },
      { url: 'https://example.com/2', statusCode: 404, responseTime: 50, attempts: 1, category: 'client_error', description: 'Not Found', error: null, redirectUrl: null }
    ];

    const report = generateJsonReport('https://example.com/sitemap.xml', mockResults, 5000);

    expect(report).toHaveProperty('metadata');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('results');
    expect(report).toHaveProperty('errors');
    expect(report.metadata.sitemapUrl).toBe('https://example.com/sitemap.xml');
    expect(report.summary.totalUrls).toBe(2);
    expect(report.summary.successful).toBe(1);
    expect(report.summary.failed).toBe(1);
    expect(report.results).toHaveLength(2);
    expect(report.errors['404']).toHaveLength(1);
  });

  test('should generate HTML report with correct content', () => {
    const mockResults = [
      { url: 'https://example.com/page1', statusCode: 200, responseTime: 100, attempts: 1, category: 'success', description: 'OK', error: null, redirectUrl: null },
      { url: 'https://example.com/page2', statusCode: 404, responseTime: 50, attempts: 1, category: 'client_error', description: 'Not Found', error: null, redirectUrl: null }
    ];

    const html = generateHtmlReport('https://example.com/sitemap.xml', mockResults, 5000);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Sitemap Verification Report');
    expect(html).toContain('https://example.com/sitemap.xml');
    expect(html).toContain('https://example.com/page1');
    expect(html).toContain('200');
    expect(html).toContain('404');
  });

  test('should handle empty results in reports', () => {
    const report = generateJsonReport('https://example.com/sitemap.xml', [], 1000);

    expect(report.summary.totalUrls).toBe(0);
    expect(report.summary.successful).toBe(0);
    expect(report.summary.failed).toBe(0);
    expect(report.summary.successRate).toBe(0);
  });

  test('should calculate percentiles correctly', () => {
    const mockResults = [
      { url: 'https://example.com/1', statusCode: 200, responseTime: 10 },
      { url: 'https://example.com/2', statusCode: 200, responseTime: 20 },
      { url: 'https://example.com/3', statusCode: 200, responseTime: 30 },
      { url: 'https://example.com/4', statusCode: 200, responseTime: 40 },
      { url: 'https://example.com/5', statusCode: 200, responseTime: 50 }
    ];

    const stats = calculateStats(mockResults);

    expect(stats.p50).toBeGreaterThan(0);
    expect(stats.p95).toBeGreaterThan(0);
    expect(stats.p99).toBeGreaterThan(0);
    expect(stats.minResponseTime).toBe(10);
    expect(stats.maxResponseTime).toBe(50);
  });
});
