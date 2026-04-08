const fs = require('fs-extra');
const path = require('path');
const { LATEST_DIR } = require('../config/paths');

const cache = new Map();

async function initCache(logger) {
  await fs.ensureDir(LATEST_DIR);
  const files = await fs.readdir(LATEST_DIR);
  let loaded = 0;

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const datasetId = path.basename(file, '.json');
    const fullPath = path.join(LATEST_DIR, file);

    try {
      const payload = await fs.readJson(fullPath);
      cache.set(datasetId, payload);
      loaded += 1;
    } catch (err) {
      if (logger) {
        await logger.error('Failed to load dataset into cache', {
          datasetId,
          error: err.message,
        });
      }
    }
  }

  if (logger) {
    await logger.info('Cache initialized', { datasetCount: loaded });
  }

  watchLatestDir(logger);
}

function watchLatestDir(logger) {
  try {
    fs.watch(
      LATEST_DIR,
      { persistent: true },
      async (eventType, filename) => {
        if (!filename || !filename.endsWith('.json')) return;

        const datasetId = path.basename(filename, '.json');
        const fullPath = path.join(LATEST_DIR, filename);

        try {
          const exists = await fs.pathExists(fullPath);
          if (!exists) {
            cache.delete(datasetId);
            if (logger) {
              await logger.info('Dataset removed from cache', { datasetId });
            }
            return;
          }

          const payload = await fs.readJson(fullPath);
          cache.set(datasetId, payload);
          if (logger) {
            await logger.info('Dataset reloaded into cache', {
              datasetId,
              eventType,
            });
          }
        } catch (err) {
          if (logger) {
            await logger.error('Failed to reload dataset on fs change', {
              datasetId,
              eventType,
              error: err.message,
            });
          }
        }
      },
    );
  } catch (err) {
    if (logger) {
      logger.error('Failed to watch latest directory', { error: err.message });
    }
  }
}

function getDataset(datasetId) {
  return cache.get(datasetId) || null;
}

function getAllDatasets() {
  return Array.from(cache.entries()).map(([datasetId, payload]) => ({
    datasetId,
    payload,
  }));
}

module.exports = {
  initCache,
  getDataset,
  getAllDatasets,
};

