module.exports = {
  http: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT || 30000),
    followRedirects: true,
    maxRedirects: 5,
    userAgent: 'SitemapBot/1.0 (+https://example.com/bot)'
  },

  concurrency: {
    maxParallel: parseInt(process.env.MAX_PARALLEL_REQUESTS || 10)
  },

  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES || 3),
    retryDelay: parseInt(process.env.RETRY_DELAY || 1000),
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    backoffMultiplier: 2,
    maxBackoffDelay: 30000
  },

  reporting: {
    outputDirectory: './reports',
    formats: ['html', 'json', 'console']
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    outputDirectory: './logs'
  },

  sitemap: {
    url: process.env.SITEMAP_URL || ''
  }
};
