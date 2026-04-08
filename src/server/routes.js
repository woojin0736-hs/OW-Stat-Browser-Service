const express = require('express');
const {
  MODES,
  COMPETITIVE_TIERS,
  QUICKPLAY_TIERS,
  buildDatasetId,
  INPUT,
  MAP,
  REGION,
  ROLE,
  isValidMapId,
  mapLabelById,
} = require('../config/blizzardConfig');
const {
  applyApiColorWithFallback,
  enrichRecordsColors,
} = require('../normalizer/heroColorFallback');
const { getDataset, getAllDatasets } = require('./cache');
const { fetchRatesWithRetry } = require('../collector/blizzardClient');
const { normalizeRatesPayload } = require('../normalizer/normalizeRates');

function buildRouter(logger) {
  const router = express.Router();

  /**
   * 캐시 기반 스냅샷 조회
   */
  router.get('/stats', (req, res) => {
    const modeRaw = (req.query.mode || '').toString();
    const tierRaw = (req.query.tier || '').toString();
    const mapRaw = (req.query.map || '').toString();

    const mode = modeRaw.toLowerCase();
    const tier = tierRaw || 'All';
    const mapId = mapRaw || 'all-maps';

    if (![MODES.QUICKPLAY, MODES.COMPETITIVE].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Use "quickplay" or "competitive".',
      });
    }

    if (mode === MODES.QUICKPLAY) {
      if (!QUICKPLAY_TIERS.includes(tier)) {
        return res.status(400).json({
          error: `Invalid tier for quickplay. Allowed: ${QUICKPLAY_TIERS.join(', ')}`,
        });
      }
    } else if (mode === MODES.COMPETITIVE) {
      if (!COMPETITIVE_TIERS.includes(tier)) {
        return res.status(400).json({
          error: `Invalid tier for competitive. Allowed: ${COMPETITIVE_TIERS.join(', ')}`,
        });
      }
    }

    if (!isValidMapId(mapId)) {
      return res.status(400).json({
        error: 'Invalid map id.',
        map: mapId,
      });
    }

    const datasetId = buildDatasetId(mode, tier, mapId);
    const dataset = getDataset(datasetId);

    if (!dataset) {
      if (logger) {
        logger.warn('Requested dataset not found in cache', { datasetId });
      }
      return res.status(404).json({
        error: 'Dataset not available (yet). Please try again later.',
        datasetId,
        hint:
          mapId !== 'all-maps'
            ? '전장별 데이터는 기본 수집 대상이 아닙니다. 서버 환경변수 COLLECT_ALL_MAPS=true 로 전체 전장 수집을 켜고 다시 수집하세요.'
            : undefined,
      });
    }

    return res.json({
      datasetId,
      meta: dataset.meta,
      mapLabel: mapLabelById(mapId),
      records: enrichRecordsColors(dataset.records),
    });
  });

  /**
   * Blizzard API를 실시간으로 호출하는 라이브 프록시
   * /api/stats-live?mode=competitive&tier=Diamond
   */
  router.get('/stats-live', async (req, res) => {
    const modeRaw = (req.query.mode || '').toString();
    const tierRaw = (req.query.tier || '').toString();

    const mode = modeRaw.toLowerCase();
    const tier = tierRaw || 'All';

    if (![MODES.QUICKPLAY, MODES.COMPETITIVE].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Use "quickplay" or "competitive".',
      });
    }

    if (mode === MODES.QUICKPLAY) {
      if (!QUICKPLAY_TIERS.includes(tier)) {
        return res.status(400).json({
          error: `Invalid tier for quickplay. Allowed: ${QUICKPLAY_TIERS.join(', ')}`,
        });
      }
    } else if (mode === MODES.COMPETITIVE) {
      if (!COMPETITIVE_TIERS.includes(tier)) {
        return res.status(400).json({
          error: `Invalid tier for competitive. Allowed: ${COMPETITIVE_TIERS.join(', ')}`,
        });
      }
    }

    const rq = mode === MODES.QUICKPLAY ? 0 : 2;

    try {
      const raw = await fetchRatesWithRetry(
        {
          input: INPUT,
          map: MAP,
          region: REGION,
          role: ROLE,
          rq,
          tier,
        },
        logger,
      );

      const records = enrichRecordsColors(normalizeRatesPayload(raw));

      return res.json({
        mode,
        tier,
        params: {
          input: INPUT,
          map: MAP,
          region: REGION,
          role: ROLE,
          rq,
        },
        records,
      });
    } catch (error) {
      if (logger) {
        await logger.error('stats-live failed', {
          error: error.message,
        });
      }
      return res.status(502).json({
        error: 'Failed to fetch live stats from Blizzard API',
        detail: error.message,
      });
    }
  });

  router.get('/heroes', (req, res) => {
    const all = getAllDatasets();
    const roleMap = new Map();

    for (const { payload } of all) {
      const records = payload.records || [];
      for (const rec of records) {
        const roleKey = (rec.role || 'unknown').toString().toLowerCase();
        const heroName = rec.hero;
        if (!heroName) continue;

        if (!roleMap.has(roleKey)) {
          roleMap.set(roleKey, new Map());
        }
        const heroesForRole = roleMap.get(roleKey);

        if (!heroesForRole.has(heroName)) {
          const color =
            applyApiColorWithFallback(heroName, rec.color) || undefined;
          heroesForRole.set(heroName, {
            hero: heroName,
            role: rec.role,
            portrait: rec.portrait,
            ...(color ? { color } : {}),
          });
        }
      }
    }

    const grouped = {};
    for (const [role, heroesMap] of roleMap.entries()) {
      grouped[role] = Array.from(heroesMap.values()).sort((a, b) =>
        a.hero.localeCompare(b.hero, 'ko-KR'),
      );
    }

    return res.json(grouped);
  });

  return router;
}

module.exports = {
  buildRouter,
};

