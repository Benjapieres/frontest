const logger = require('../logger/logger');
const { classifyError } = require('../utils/error-classifier');
const config = require('../../config/default');

/**
 * Handles retry logic with exponential backoff
 */

async function executeWithRetry(fn, url, options = {}) {
  const maxRetries = options.maxRetries ?? config.retry.maxRetries;
  const retryDelay = options.retryDelay ?? config.retry.retryDelay;
  const backoffMultiplier = config.retry.backoffMultiplier;
  const maxBackoffDelay = config.retry.maxBackoffDelay;

  let lastError;
  let lastStatusCode;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      return { ...result, attempts: attempt };
    } catch (error) {
      lastError = error;
      lastStatusCode = error.response?.status;

      // Classify the error to determine if we should retry
      const classification = classifyError(lastStatusCode, error);

      if (!classification.shouldRetry || attempt === maxRetries + 1) {
        logger.debug(
          `URL failed (${classification.category}): ${url} - Status: ${lastStatusCode} - Attempts: ${attempt}`
        );
        throw {
          url,
          statusCode: lastStatusCode,
          attempts: attempt,
          error: classification.description,
          category: classification.category
        };
      }

      // Calculate backoff delay with jitter
      const exponentialDelay = Math.min(
        retryDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxBackoffDelay
      );
      const jitter = Math.random() * 0.1 * exponentialDelay;
      const totalDelay = exponentialDelay + jitter;

      logger.debug(
        `Retrying ${url} (attempt ${attempt}/${maxRetries}) after ${Math.round(totalDelay)}ms`
      );

      await sleep(totalDelay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  executeWithRetry,
  sleep
};
