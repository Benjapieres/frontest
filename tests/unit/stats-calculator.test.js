const { calculateStats, groupErrorsByType } = require('../../src/utils/stats-calculator');

describe('Stats Calculator', () => {
  const mockResults = [
    { url: 'https://example.com/1', statusCode: 200, responseTime: 100 },
    { url: 'https://example.com/2', statusCode: 200, responseTime: 150 },
    { url: 'https://example.com/3', statusCode: 200, responseTime: 120 },
    { url: 'https://example.com/4', statusCode: 404, responseTime: 50 },
    { url: 'https://example.com/5', statusCode: 500, responseTime: 200 }
  ];

  test('should calculate stats correctly', () => {
    const stats = calculateStats(mockResults);

    expect(stats.totalUrls).toBe(5);
    expect(stats.successful).toBe(3);
    expect(stats.failed).toBe(2);
    expect(stats.successRate).toBe(60);
  });

  test('should calculate response time metrics', () => {
    const stats = calculateStats(mockResults);

    expect(stats.avgResponseTime).toBe(124); // (100+150+120+50+200)/5
    expect(stats.minResponseTime).toBe(50);
    expect(stats.maxResponseTime).toBe(200);
  });

  test('should count status codes correctly', () => {
    const stats = calculateStats(mockResults);

    expect(stats.statusCodeCounts[200]).toBe(3);
    expect(stats.statusCodeCounts[404]).toBe(1);
    expect(stats.statusCodeCounts[500]).toBe(1);
  });

  test('should group errors by type', () => {
    const errors = groupErrorsByType(mockResults);

    expect(errors[404]).toBeDefined();
    expect(errors[404].length).toBe(1);
    expect(errors[404][0].url).toBe('https://example.com/4');

    expect(errors[500]).toBeDefined();
    expect(errors[500].length).toBe(1);
    expect(errors[500][0].url).toBe('https://example.com/5');
  });

  test('should handle empty results', () => {
    const stats = calculateStats([]);

    expect(stats.totalUrls).toBe(0);
    expect(stats.successful).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.successRate).toBe(0);
  });

  test('should calculate percentiles', () => {
    const stats = calculateStats(mockResults);

    expect(stats.p50).toBeGreaterThan(0);
    expect(stats.p95).toBeGreaterThan(0);
    expect(stats.p99).toBeGreaterThan(0);
  });
});
