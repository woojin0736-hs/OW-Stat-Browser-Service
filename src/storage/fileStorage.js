const fs = require('fs-extra');
const path = require('path');
const {
  DATA_DIR,
  LATEST_DIR,
  HISTORY_DIR,
  MANIFEST_PATH,
} = require('../config/paths');

async function ensureDirs() {
  await Promise.all([
    fs.ensureDir(DATA_DIR),
    fs.ensureDir(LATEST_DIR),
    fs.ensureDir(HISTORY_DIR),
  ]);
}

function latestFilePath(datasetId) {
  return path.join(LATEST_DIR, `${datasetId}.json`);
}

function historyFilePath(datasetId, timestamp) {
  return path.join(HISTORY_DIR, `${datasetId}__${timestamp}.json`);
}

async function saveDataset(datasetId, meta, records) {
  await ensureDirs();

  const now = new Date().toISOString();
  const payload = {
    meta: {
      ...meta,
      savedAt: now,
    },
    records,
  };

  const latestPath = latestFilePath(datasetId);
  await fs.writeJson(latestPath, payload, { spaces: 2 });

  const safeTs = now.replace(/[:.]/g, '-');
  const historyPath = historyFilePath(datasetId, safeTs);
  await fs.writeJson(historyPath, payload, { spaces: 2 });

  return { latestPath, historyPath };
}

async function loadAllLatestDatasets() {
  await ensureDirs();
  const map = new Map();
  const files = await fs.readdir(LATEST_DIR);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const datasetId = path.basename(file, '.json');
    const fullPath = path.join(LATEST_DIR, file);

    try {
      const payload = await fs.readJson(fullPath);
      map.set(datasetId, payload);
    } catch {
      continue;
    }
  }

  return map;
}

async function loadManifest() {
  await ensureDirs();

  if (!(await fs.pathExists(MANIFEST_PATH))) {
    return {
      updated_at: null,
      datasets: [],
    };
  }

  try {
    return await fs.readJson(MANIFEST_PATH);
  } catch {
    return {
      updated_at: null,
      datasets: [],
    };
  }
}

async function writeManifest(manifest) {
  await ensureDirs();
  await fs.writeJson(MANIFEST_PATH, manifest, { spaces: 2 });
}

async function listDatasetIdsOnDisk() {
  await ensureDirs();
  const files = await fs.readdir(LATEST_DIR);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.basename(f, '.json'));
}

async function updateManifest(updatedDatasetIds) {
  const manifest = await loadManifest();
  const existing = new Set(manifest.datasets || []);
  const allOnDisk = await listDatasetIdsOnDisk();

  for (const id of allOnDisk) {
    existing.add(id);
  }

  const newManifest = {
    ...manifest,
    datasets: Array.from(existing).sort(),
  };

  if (updatedDatasetIds && updatedDatasetIds.length > 0) {
    newManifest.updated_at = new Date().toISOString();
  }

  await writeManifest(newManifest);
  return newManifest;
}

module.exports = {
  saveDataset,
  loadAllLatestDatasets,
  loadManifest,
  updateManifest,
  latestFilePath,
};

