/**
 * 符号配置 <-> CSV 互转工具
 * 用法：
 *   node scripts/sym2csv.mjs export   → 把 symbols.ts 导出为 data_symbols.csv（用 Excel 打开编辑）
 *   node scripts/sym2csv.mjs import   → 把 data_symbols.csv 改动写回 symbols.ts 的 base/weight 字段
 *
 * 说明：联动(combos)结构复杂，CSV 只暴露最常改的 base/weight/name/emoji 字段做"定点改"。
 * 联动规则的精修请直接在 symbols.ts 中改。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tsPath = join(here, '..', 'src', 'data', 'symbols.ts');
const csvPath = join(here, '..', 'data_symbols.csv');

const mode = process.argv[2];

// 从 symbols.ts 用正则提取每行符号定义
function parseSymbols(src) {
  const rows = [];
  const re = /\{ id: '([^']+)', name: '([^']*)', emoji: '([^']*)', faction: '([^']+)', rarity: '([^']+)', base: (-?\d+(?:\.\d+)?), weight: (\d+),/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    rows.push({ id: m[1], name: m[2], emoji: m[3], faction: m[4], rarity: m[5], base: m[6], weight: m[7] });
  }
  return rows;
}

if (mode === 'export') {
  const src = readFileSync(tsPath, 'utf8');
  const rows = parseSymbols(src);
  const header = 'id,name,emoji,faction,rarity,base,weight';
  const lines = rows.map((r) => `${r.id},${r.name},${r.emoji},${r.faction},${r.rarity},${r.base},${r.weight}`);
  writeFileSync(csvPath, '\ufeff' + [header, ...lines].join('\n'), 'utf8');
  console.log(`已导出 ${rows.length} 个符号到 ${csvPath}`);
} else if (mode === 'import') {
  const csv = readFileSync(csvPath, 'utf8').replace(/^\ufeff/, '');
  const map = new Map();
  csv.split(/\r?\n/).slice(1).filter(Boolean).forEach((line) => {
    const [id, , , , , base, weight] = line.split(',');
    map.set(id, { base, weight });
  });
  let src = readFileSync(tsPath, 'utf8');
  for (const [id, v] of map) {
    const re = new RegExp(`(\\{ id: '${id}',[^}]*?base: )-?\\d+(?:\\.\\d+)?(, weight: )\\d+`);
    src = src.replace(re, `$1${v.base}$2${v.weight}`);
  }
  writeFileSync(tsPath, src, 'utf8');
  console.log(`已将 CSV 的 base/weight 写回 ${tsPath}`);
} else {
  console.log('用法: node scripts/sym2csv.mjs [export|import]');
}
