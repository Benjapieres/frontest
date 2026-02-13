const { classifyError } = require('../../src/utils/error-classifier');

describe('Error Classifier', () => {
  test('should classify 200 as success', () => {
    const result = classifyError(200);
    expect(result.category).toBe('success');
    expect(result.shouldRetry).toBe(false);
  });

  test('should classify 301 as success (redirect)', () => {
    const result = classifyError(301);
    expect(result.category).toBe('success');
    expect(result.shouldRetry).toBe(false);
  });

  test('should classify 404 as client error, no retry', () => {
    const result = classifyError(404);
    expect(result.category).toBe('client_error');
    expect(result.shouldRetry).toBe(false);
  });

  test('should classify 429 as client error, with retry', () => {
    const result = classifyError(429);
    expect(result.category).toBe('client_error');
    expect(result.shouldRetry).toBe(true);
  });

  test('should classify 500 as server error, with retry', () => {
    const result = classifyError(500);
    expect(result.category).toBe('server_error');
    expect(result.shouldRetry).toBe(true);
  });

  test('should classify null status as network error', () => {
    const result = classifyError(null);
    expect(result.category).toBe('network_error');
    expect(result.shouldRetry).toBe(false);
  });

  test('should classify timeout errors correctly', () => {
    const error = new Error('timeout');
    error.code = 'ECONNABORTED';
    const result = classifyError(null, error);
    expect(result.category).toBe('timeout');
    expect(result.shouldRetry).toBe(true);
  });

  test('should classify DNS errors as network error', () => {
    const error = new Error('getaddrinfo ENOTFOUND example.com');
    error.code = 'ENOTFOUND';
    const result = classifyError(null, error);
    expect(result.category).toBe('network_error');
    expect(result.shouldRetry).toBe(false);
  });
});
