const fs = require('node:fs');
const path = require('node:path');

function merge(base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(base[key] || {}, value) : value;
  }
  return out;
}

function loadConfig(appDir, userDataDir) {
  const defaults = JSON.parse(fs.readFileSync(path.join(appDir, 'config.default.json'), 'utf8'));
  const userPath = path.join(userDataDir, 'config.json');
  if (!fs.existsSync(userPath)) {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(userPath, JSON.stringify(defaults, null, 2));
    return { config: defaults, userPath };
  }
  try {
    return { config: merge(defaults, JSON.parse(fs.readFileSync(userPath, 'utf8'))), userPath };
  } catch (error) {
    throw new Error(`配置文件格式错误 (${userPath}): ${error.message}`);
  }
}

module.exports = { loadConfig, merge };
