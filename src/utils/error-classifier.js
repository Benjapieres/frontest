/**
 * Classifies HTTP errors and determines retry strategy
 */

const ERROR_CATEGORIES = {
  SUCCESS: 'success',
  CLIENT_ERROR: 'client_error',
  SERVER_ERROR: 'server_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout'
};

const HTTP_ERROR_DESCRIPTIONS = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

function classifyError(statusCode, error = null) {
  if (!statusCode) {
    if (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          category: ERROR_CATEGORIES.TIMEOUT,
          shouldRetry: true,
          description: 'Request timeout'
        };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          category: ERROR_CATEGORIES.NETWORK_ERROR,
          shouldRetry: false,
          description: `Network error: ${error.code}`
        };
      }
    }
    return {
      category: ERROR_CATEGORIES.NETWORK_ERROR,
      shouldRetry: false,
      description: 'Unknown network error'
    };
  }

  if (statusCode >= 200 && statusCode < 300) {
    return {
      category: ERROR_CATEGORIES.SUCCESS,
      shouldRetry: false,
      description: 'Success'
    };
  }

  if (statusCode >= 300 && statusCode < 400) {
    return {
      category: ERROR_CATEGORIES.SUCCESS,
      shouldRetry: false,
      description: 'Redirect'
    };
  }

  if (statusCode >= 400 && statusCode < 500) {
    const shouldRetry = statusCode === 408 || statusCode === 429;
    return {
      category: ERROR_CATEGORIES.CLIENT_ERROR,
      shouldRetry,
      description: HTTP_ERROR_DESCRIPTIONS[statusCode] || `Client Error (${statusCode})`
    };
  }

  if (statusCode >= 500 && statusCode < 600) {
    return {
      category: ERROR_CATEGORIES.SERVER_ERROR,
      shouldRetry: true,
      description: HTTP_ERROR_DESCRIPTIONS[statusCode] || `Server Error (${statusCode})`
    };
  }

  return {
    category: ERROR_CATEGORIES.CLIENT_ERROR,
    shouldRetry: false,
    description: `Unknown status code: ${statusCode}`
  };
}

module.exports = {
  classifyError,
  ERROR_CATEGORIES,
  HTTP_ERROR_DESCRIPTIONS
};
