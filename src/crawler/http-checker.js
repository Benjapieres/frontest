const axios = require('axios');
const logger = require('../logger/logger');
const { executeWithRetry } = require('./retry-handler');
const { classifyError } = require('../utils/error-classifier');
const config = require('../../config/default');

/**
 * Performs HTTP checks on URLs
 */

const client = axios.create({
  timeout: config.http.timeout,
  followRedirects: config.http.followRedirects,
  maxRedirects: config.http.maxRedirects,
  headers: {
    'User-Agent': config.http.userAgent
  },
  validateStatus: () => true // Don't throw on any status code
});

async function checkUrl(url) {
  const startTime = Date.now();

  try {
    const result = await executeWithRetry(
      async () => {
        const response = await client.head(url);

        // If HEAD is not allowed (405), try GET
        if (response.status === 405) {
          return await client.get(url);
        }

        return response;
      },
      url
    );

    const responseTime = Date.now() - startTime;
    const statusCode = result.status;
    const classification = classifyError(statusCode);

    return {
      url,
      statusCode,
      responseTime,
      attempts: result.attempts,
      redirectUrl: result.config?.url !== url ? result.config?.url : null,
      category: classification.category,
      description: classification.description,
      error: null
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Error object thrown from retry handler
    if (error.url) {
      return error;
    }

    // Network error
    return {
      url,
      statusCode: null,
      responseTime,
      attempts: 1,
      redirectUrl: null,
      category: 'network_error',
      description: error.message,
      error: error.message
    };
  }
}

module.exports = {
  checkUrl
};
