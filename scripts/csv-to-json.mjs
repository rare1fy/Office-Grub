// CSV -> JSON 同步脚本。
// 用法：改完 data/*.csv 后运行 `npm run sync-data`，自动生成 src/data/*.json 供游戏加载。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const OUT_DIR = resolve(__dirname, '..', 'src', 'data');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

/** 解析一行 CSV，支持双引号包裹的字段（内部逗号不分割，"" 转义为 "）。 */
function parseLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  const header = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = {};
    header.forEach((key, idx) => {
      row[key] = cells[idx] ?? '';
    });
    return row;
  });
}

function coerce(value) {
  if (value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseJsonField(value) {
  if (!value || value.trim() === '') return {};
  try {
    return JSON.parse(value);
  } catch (err) {
    console.error(`[sync-data] JSON 解析失败: ${value}\n${err.message}`);
    return {};
  }
}

function splitList(value) {
  if (!value || value.trim() === '') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

// ---- symbols ----
const symbols = parseCsv(readFileSync(resolve(DATA_DIR, 'symbols.csv'), 'utf8')).map((r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  rarity: r.rarity,
  tags: splitList(r.tags),
  baseValue: Number(r.base_value) || 0,
  effectType: r.effect_type || 'flat',
  effectParams: parseJsonField(r.effect_params),
  weird: coerce(r.weird) === true,
  desc: r.desc || '',
}));

// ---- combos ----
const combos = parseCsv(readFileSync(resolve(DATA_DIR, 'combos.csv'), 'utf8')).map((r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  rarity: r.rarity,
  kind: r.kind,
  inputs: splitList(r.inputs),
  adjacency: r.adjacency || 'orthogonal',
  output: coerce(r.output),
  payout: Number(r.payout) || 0,
  freshGain: Number(r.fresh_gain) || 0,
  weird: coerce(r.weird) === true,
  desc: r.desc || '',
}));

// ---- items ----
const items = parseCsv(readFileSync(resolve(DATA_DIR, 'items.csv'), 'utf8')).map((r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  rarity: r.rarity,
  rule: r.rule,
  params: parseJsonField(r.params),
  desc: r.desc || '',
}));

// ---- appetite ----
const appetite = parseCsv(readFileSync(resolve(DATA_DIR, 'appetite.csv'), 'utf8')).map((r) => ({
  period: Number(r.period),
  display: Number(r.display),
}));

// ---- config ----
const config = JSON.parse(readFileSync(resolve(DATA_DIR, 'config.json'), 'utf8'));

writeFileSync(resolve(OUT_DIR, 'symbols.json'), JSON.stringify(symbols, null, 2));
writeFileSync(resolve(OUT_DIR, 'combos.json'), JSON.stringify(combos, null, 2));
writeFileSync(resolve(OUT_DIR, 'items.json'), JSON.stringify(items, null, 2));
writeFileSync(resolve(OUT_DIR, 'appetite.json'), JSON.stringify(appetite, null, 2));
writeFileSync(resolve(OUT_DIR, 'config.json'), JSON.stringify(config, null, 2));

console.log(
  `[sync-data] OK -> symbols:${symbols.length} combos:${combos.length} items:${items.length} appetite:${appetite.length}`,
);
