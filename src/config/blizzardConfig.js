const MODES = {
  QUICKPLAY: 'quickplay',
  COMPETITIVE: 'competitive',
};

const INPUT = 'PC';
const MAP = 'all-maps';
const REGION = 'Asia';
const ROLE = 'All';

// 전장 키워드(주신 목록 기반)
const MAPS_ALL = { id: 'all-maps', label: '모든 전장' };

const MAP_GROUPS = [
  {
    id: 'control',
    label: '쟁탈',
    maps: [
      { id: 'nepal', label: '네팔' },
      { id: 'lijiang-tower', label: '리장 타워' },
      { id: 'busan', label: '부산' },
      { id: 'samoa', label: '사모아' },
      { id: 'oasis', label: '오아시스' },
      { id: 'ilios', label: '일리오스' },
    ],
  },
  {
    id: 'escort',
    label: '호위',
    maps: [
      { id: 'route-66', label: '66번 국도' },
      { id: 'watchpoint-gibraltar', label: '감시기지: 지브롤터' },
      { id: 'dorado', label: '도라도' },
      { id: 'rialto', label: '리알토' },
      { id: 'shambali-monastery', label: '샴발리 수도원' },
      { id: 'circuit-royal', label: '서킷 로얄' },
      { id: 'junkertown', label: '쓰레기촌' },
      { id: 'havana', label: '하바나' },
    ],
  },
  {
    id: 'flashpoint',
    label: '플래시포인트',
    maps: [
      { id: 'new-junk-city', label: '뉴 정크 시티' },
      { id: 'suravasa', label: '수라바사' },
      { id: 'aatlis', label: '아틀리스' },
    ],
  },
  {
    id: 'hybrid',
    label: '혼합',
    maps: [
      { id: 'numbani', label: '눔바니' },
      { id: 'midtown', label: '미드타운' },
      { id: 'blizzard-world', label: '블리자드 월드' },
      { id: 'eichenwalde', label: '아이헨발데' },
      { id: 'kings-row', label: '왕의 길' },
      { id: 'paraiso', label: '파라이수' },
      { id: 'hollywood', label: '할리우드' },
    ],
  },
  {
    id: 'push',
    label: '밀기',
    maps: [
      { id: 'new-queen-street', label: '뉴 퀸 스트리트' },
      { id: 'runasapi', label: '루나사피' },
      { id: 'esperanca', label: '이스페란사' },
      { id: 'colosseo', label: '콜로세오' },
    ],
  },
];

function listAllMaps() {
  return MAP_GROUPS.flatMap((g) => g.maps);
}

// 수집 범위 정책
// - 기본: all-maps만 수집
// - 확장: 경쟁전 Grandmaster는 개별 전장까지 수집 (요청하신 1차 범위)
function mapsToCollect(mode, tier) {
  if (mode === MODES.QUICKPLAY && tier === 'All') {
    return [MAPS_ALL, ...listAllMaps()];
  }
  if (mode === MODES.COMPETITIVE) {
    return [MAPS_ALL, ...listAllMaps()];
  }
  return [MAPS_ALL];
}

const QUICKPLAY_TIERS = ['All'];
const COMPETITIVE_TIERS = [
  'All',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Grandmaster',
];

function buildDatasetId(mode, tier, mapId = 'all-maps') {
  const base = `${mode}__tier-${tier}`;
  // 기존 파일명 호환을 위해 all-maps는 suffix를 붙이지 않음
  if (!mapId || mapId === 'all-maps') return base;
  return `${base}__map-${mapId}`;
}

function buildTargets() {
  const targets = [];

  QUICKPLAY_TIERS.forEach((tier) => {
    const maps = mapsToCollect(MODES.QUICKPLAY, tier);
    maps.forEach((m) => {
      targets.push({
        mode: MODES.QUICKPLAY,
        rq: 0,
        tier,
        input: INPUT,
        map: m.id,
        region: REGION,
        role: ROLE,
        datasetId: buildDatasetId(MODES.QUICKPLAY, tier, m.id),
      });
    });
  });

  COMPETITIVE_TIERS.forEach((tier) => {
    const maps = mapsToCollect(MODES.COMPETITIVE, tier);
    maps.forEach((m) => {
      targets.push({
        mode: MODES.COMPETITIVE,
        rq: 2,
        tier,
        input: INPUT,
        map: m.id,
        region: REGION,
        role: ROLE,
        datasetId: buildDatasetId(MODES.COMPETITIVE, tier, m.id),
      });
    });
  });

  return targets;
}

function isValidMapId(mapId) {
  if (!mapId) return false;
  if (mapId === MAPS_ALL.id) return true;
  return listAllMaps().some((m) => m.id === mapId);
}

function mapLabelById(mapId) {
  if (!mapId || mapId === MAPS_ALL.id) return MAPS_ALL.label;
  const hit = listAllMaps().find((m) => m.id === mapId);
  return hit ? hit.label : mapId;
}

module.exports = {
  MODES,
  INPUT,
  MAP,
  REGION,
  ROLE,
  MAPS_ALL,
  MAP_GROUPS,
  listAllMaps,
  mapsToCollect,
  isValidMapId,
  mapLabelById,
  QUICKPLAY_TIERS,
  COMPETITIVE_TIERS,
  buildDatasetId,
  buildTargets,
};

