const fs = require('fs-extra');
const path = require('path');
const { LOGS_DIR } = require('../config/paths');

function getLogFilePath() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOGS_DIR, `collector-${date}.log`);
}

async function ensureLogDir() {
  await fs.ensureDir(LOGS_DIR);
}

function formatLogLine(level, scope, message, meta) {
  const ts = new Date().toISOString();
  const base = { ts, level, scope, message };
  const payload = meta ? { ...base, meta } : base;
  return JSON.stringify(payload);
}

async function log(level, scope, message, meta) {
  try {
    await ensureLogDir();
    const line = formatLogLine(level, scope, message, meta);

    const prefix = `[${new Date().toISOString()}] [${level}] [${scope}]`;
    if (level === 'ERROR') {
      console.error(prefix, message, meta || '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, meta || '');
    } else {
      console.log(prefix, message, meta || '');
    }

    const filePath = getLogFilePath();
    await fs.appendFile(filePath, `${line}\n`, 'utf8');
  } catch (err) {
    console.error('[LOGGER] Failed to write log', err);
  }
}

function createLogger(scope) {
  const s = scope || 'app';

  return {
    info(message, meta) {
      return log('INFO', s, message, meta);
    },
    warn(message, meta) {
      return log('WARN', s, message, meta);
    },
    error(message, meta) {
      return log('ERROR', s, message, meta);
    },
  };
}

module.exports = {
  createLogger,
};

