const cron = require('node-cron');
const { collectAllDatasets } = require('../collector/collectorService');

let isRunning = false;

function startScheduler(logger) {
  // 매일 00:00 (서버 로컬 시간)에 1회 수집
  cron.schedule('0 0 * * *', async () => {
    if (isRunning) {
      if (logger) {
        await logger.warn('Skipping scheduled collection (already running)');
      }
      return;
    }

    isRunning = true;
    try {
      if (logger) {
        await logger.info('Scheduled collection started');
      }
      await collectAllDatasets(logger);
      if (logger) {
        await logger.info('Scheduled collection finished');
      }
    } catch (err) {
      if (logger) {
        await logger.error('Scheduled collection failed', { error: err.message });
      }
    } finally {
      isRunning = false;
    }
  });
}

module.exports = {
  startScheduler,
};

