function normalizePercentage(rawValue, fieldName, idx) {
  if (rawValue == null) {
    throw new Error(`Missing ${fieldName} at index ${idx}`);
  }

  let num =
    typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue);

  if (Number.isNaN(num)) {
    throw new Error(`Invalid numeric ${fieldName} at index ${idx}`);
  }

  // Blizzard가 데이터 부족/미집계인 경우 -1로 내려주는 케이스가 있음
  // 이 값은 그대로 저장해서 UI에서 "--"로 표시한다.
  if (num === -1) {
    return -1;
  }

  if (num < 0 || num > 100) {
    throw new Error(
      `Out-of-range ${fieldName} at index ${idx}: ${num}`,
    );
  }

  return num;
}

const { applyApiColorWithFallback } = require('./heroColorFallback');

function normalizeRatesPayload(payload) {
  if (!payload || !Array.isArray(payload.rates)) {
    throw new Error('Invalid Blizzard payload: "rates" array missing');
  }

  const normalized = [];

  payload.rates.forEach((entry, idx) => {
    const hero = entry.hero || {};
    const cells = entry.cells || {};

    const name = hero.name;
    const role = hero.role;
    const portrait = hero.portrait;
    const color = applyApiColorWithFallback(name, hero.color);

    if (!name || !role || portrait == null) {
      throw new Error(
        `Invalid hero entry at index ${idx}: missing hero fields`,
      );
    }

    const pickrate = normalizePercentage(
      cells.pickrate,
      'pickrate',
      idx,
    );
    const winrate = normalizePercentage(
      cells.winrate,
      'winrate',
      idx,
    );

    normalized.push({
      hero: name,
      role,
      pickrate,
      winrate,
      portrait,
      color,
    });
  });

  return normalized;
}

module.exports = {
  normalizeRatesPayload,
};


