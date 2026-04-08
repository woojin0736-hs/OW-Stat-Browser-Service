const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');

module.exports = {
  ROOT_DIR,
  DATA_DIR: path.join(ROOT_DIR, 'data'),
  LATEST_DIR: path.join(ROOT_DIR, 'data', 'latest'),
  HISTORY_DIR: path.join(ROOT_DIR, 'data', 'history'),
  LOGS_DIR: path.join(ROOT_DIR, 'logs'),
  MANIFEST_PATH: path.join(ROOT_DIR, 'data', 'manifest.json'),
};

