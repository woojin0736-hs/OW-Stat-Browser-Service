const { buildTargets } = require('../config/blizzardConfig');
const { normalizeRatesPayload } = require('../normalizer/normalizeRates');
const { saveDataset, updateManifest } = require('../storage/fileStorage');
const { fetchRatesWithRetry } = require('./blizzardClient');

async function collectAllDatasets(logger) {
  const targets = buildTargets();
  const startTime = new Date().toISOString();

  if (logger) {
    await logger.info('Collection started', {
      startTime,
      targetCount: targets.length,
    });
  }

  const updatedDatasetIds = [];
  const errors = [];

  for (const target of targets) {
    const { datasetId, ...params } = target;

    if (logger) {
      await logger.info('Collecting dataset', {
        datasetId,
        params,
      });
    }

    try {
      const rawPayload = await fetchRatesWithRetry(
        {
          input: params.input,
          map: params.map,
          region: params.region,
          role: params.role,
          rq: params.rq,
          tier: params.tier,
        },
        logger,
      );

      const records = normalizeRatesPayload(rawPayload);

      await saveDataset(
        datasetId,
        {
          mode: params.mode,
          tier: params.tier,
          region: params.region,
          rq: params.rq,
          input: params.input,
          map: params.map,
          source: 'blizzard-rates-api',
        },
        records,
      );

      updatedDatasetIds.push(datasetId);

      if (logger) {
        await logger.info('Dataset collected and saved', {
          datasetId,
          recordCount: records.length,
        });
      }
    } catch (err) {
      const info = {
        datasetId,
        message: err.message,
      };
      errors.push(info);

      if (logger) {
        await logger.error('Failed to collect dataset', info);
      }
    }
  }

  const manifest = await updateManifest(updatedDatasetIds);
  const endTime = new Date().toISOString();

  if (logger) {
    await logger.info('Collection finished', {
      startTime,
      endTime,
      updatedCount: updatedDatasetIds.length,
      errorCount: errors.length,
      manifestUpdatedAt: manifest.updated_at,
    });

    if (errors.length > 0) {
      await logger.warn('Some datasets failed to collect', { errors });
    }
  }

  return {
    updatedDatasetIds,
    errors,
    manifest,
  };
}

module.exports = {
  collectAllDatasets,
};

