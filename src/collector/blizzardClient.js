const axios = require('axios');

const http = axios.create({
  baseURL: 'https://overwatch.blizzard.com/ko-kr/rates',
  timeout: 10000,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error) {
  if (!error.response) return true;
  const status = error.response.status;
  if (status >= 500) return true;
  if (status === 429) return true;
  return false;
}

async function fetchRatesWithRetry(params, logger, maxRetries = 3, baseDelayMs = 1000) {
  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    try {
      const response = await http.get('/data/', { params });
      return response.data;
    } catch (err) {
      lastError = err;
      const canRetry = shouldRetry(err);
      const msg = err.response
        ? `status=${err.response.status}`
        : `network error: ${err.message}`;

      if (!canRetry || attempt === maxRetries) {
        if (logger) {
          await logger.error('Blizzard API call failed (no more retries)', {
            attempt,
            params,
            error: msg,
          });
        }
        throw err;
      }

      const delay = baseDelayMs * 2 ** attempt;
      if (logger) {
        await logger.warn('Blizzard API call failed, retrying with backoff', {
          attempt,
          delayMs: delay,
          params,
          error: msg,
        });
      }
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError || new Error('Unknown error in fetchRatesWithRetry');
}

module.exports = {
  fetchRatesWithRetry,
};

