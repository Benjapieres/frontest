const pLimitModule = require('p-limit');
const pLimit = pLimitModule.default || pLimitModule;
const logger = require('../logger/logger');
const { checkUrl } = require('./http-checker');
const config = require('../../config/default');

/**
 * Executes URL checks in parallel with concurrency control
 */

async function executeParallel(urls, onProgress = null) {
  const maxParallel = config.concurrency.maxParallel;
  const limit = pLimit(maxParallel);

  logger.info(`Starting parallel checks with max concurrency: ${maxParallel}`);
  logger.info(`Total URLs to check: ${urls.length}`);

  const tasks = urls.map((urlEntry, index) => {
    return limit(async () => {
      try {
        const result = await checkUrl(urlEntry.url);
        if (onProgress) {
          onProgress({
            completed: index + 1,
            total: urls.length,
            url: urlEntry.url,
            statusCode: result.statusCode
          });
        }
        return result;
      } catch (error) {
        logger.error(`Error checking URL ${urlEntry.url}: ${error.message}`);
        return {
          url: urlEntry.url,
          statusCode: null,
          responseTime: 0,
          attempts: 1,
          category: 'error',
          description: error.message,
          error: error.message
        };
      }
    });
  });

  try {
    const results = await Promise.all(tasks);
    logger.info(`Completed checking all ${results.length} URLs`);
    return results;
  } catch (error) {
    logger.error(`Error during parallel execution: ${error.message}`);
    throw error;
  }
}

module.exports = {
  executeParallel
};
