const path = require('path');
const fs = require('fs');

const fallbackPath = path.join(__dirname, '..', 'public', 'heroColorFallback.json');
let cachedFallback = null;

function loadHeroColorFallbackMap() {
  if (cachedFallback) return cachedFallback;
  try {
    const raw = fs.readFileSync(fallbackPath, 'utf8');
    cachedFallback = JSON.parse(raw);
    if (typeof cachedFallback !== 'object' || cachedFallback === null) {
      cachedFallback = {};
    }
  } catch {
    cachedFallback = {};
  }
  return cachedFallback;
}

function normalizeHexColor(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s)) return null;
  return `#${s.toLowerCase()}`;
}

/**
 * API hero.color가 없거나 형식이 이상할 때, 영웅 표시명(한글 등)으로 보조 색상을 찾는다.
 */
function applyApiColorWithFallback(heroName, apiColor) {
  const fromApi = normalizeHexColor(apiColor);
  if (fromApi) return fromApi;
  const key = (heroName || '').trim();
  const map = loadHeroColorFallbackMap();
  const fallbackRaw = map[key];
  return normalizeHexColor(fallbackRaw) || null;
}

function enrichRecordColors(rec) {
  if (!rec || typeof rec !== 'object') return rec;
  const color = applyApiColorWithFallback(rec.hero, rec.color);
  if (!color) return rec;
  return { ...rec, color };
}

function enrichRecordsColors(records) {
  if (!Array.isArray(records)) return records;
  return records.map(enrichRecordColors);
}

module.exports = {
  loadHeroColorFallbackMap,
  normalizeHexColor,
  applyApiColorWithFallback,
  enrichRecordColors,
  enrichRecordsColors,
};
