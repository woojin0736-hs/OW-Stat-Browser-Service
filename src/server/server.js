const express = require('express');
const os = require('os');
const path = require('path');
const { initCache } = require('./cache');
const { buildRouter } = require('./routes');

async function createServer(logger) {
  const app = express();

  app.use(express.json());

  // 정적 파일 (프론트엔드) 제공
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  const router = buildRouter(logger);
  app.use('/api', router);

  await initCache(logger);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  return new Promise((resolve) => {
    app.listen(port, host, () => {
      const localUrl = `http://localhost:${port}`;
      const networkIps = Object.values(os.networkInterfaces())
        .flat()
        .filter((item) => item && item.family === 'IPv4' && !item.internal)
        .map((item) => item.address);
      const networkUrl = networkIps.length ? `http://${networkIps[0]}:${port}` : null;

      if (logger) {
        logger.info(
          `Express server listening on ${host}:${port} (local: ${localUrl}${networkUrl ? `, network: ${networkUrl}` : ''})`,
        );
      } else {
        console.log(
          `Server listening on ${host}:${port} (local: ${localUrl}${networkUrl ? `, network: ${networkUrl}` : ''})`,
        );
      }
      resolve(app);
    });
  });
}

module.exports = {
  createServer,
};

