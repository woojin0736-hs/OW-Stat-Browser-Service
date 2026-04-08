const { createLogger } = require('./logger/logger');
const { createServer } = require('./server/server');
const { startScheduler } = require('./scheduler/scheduler');
const { collectAllDatasets } = require('./collector/collectorService');

(async () => {
  const logger = createLogger('main');

  // HTTP 서버를 먼저 띄워 브라우저에서 바로 접속 가능하게 함.
  // 초기 수집은 대상이 많아 시간이 걸리므로 백그라운드에서 실행.
  await createServer(logger);
  startScheduler(logger);

  void (async () => {
    try {
      await logger.info('Initial collection on startup started');
      await collectAllDatasets(logger);
      await logger.info('Initial collection on startup finished');
    } catch (err) {
      await logger.error('Initial collection failed', { error: err.message });
    }
  })();
})();

