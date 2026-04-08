const { createLogger } = require('./logger/logger');
const { collectAllDatasets } = require('./collector/collectorService');

(async () => {
  const logger = createLogger('manual-collect');

  try {
    await logger.info('Manual collection started');
    const result = await collectAllDatasets(logger);
    await logger.info('Manual collection finished', {
      updatedCount: result.updatedDatasetIds.length,
      errorCount: result.errors.length,
    });
    process.exit(0);
  } catch (err) {
    await logger.error('Manual collection failed', { error: err.message });
    process.exit(1);
  }
})();

