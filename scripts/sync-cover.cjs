#!/usr/bin/env node
/**
 * 把首屏封面（CSS / DOM / 启动脚本三块）从 dev.html 同步到 index.html。
 *
 * 为什么要这一步：封面必须在主样式表之前可用，所以只能内联进 HTML。
 * 而仓库有两个 HTML 入口 —— dev.html（开发/预览）和 index.html（GitHub Pages）。
 * 手工维护两份必然漂移，所以以 dev.html 为唯一来源，这里做单向同步。
 *
 * 用法：node scripts/sync-cover.cjs [--check]
 *   --check  只检查是否一致，不写文件（给测试用；不一致时退出码 1）
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'dev.html');
const DST = path.join(ROOT, 'index.html');

/** 三块内容的标记：两个文件里必须一致 */
const BLOCKS = [
  { name: 'COVER-CSS', open: '/* ==== COVER-CSS:START ==== */', close: '/* ==== COVER-CSS:END ==== */' },
  { name: 'COVER-DOM', open: '<!-- ==== COVER:START ==== -->', close: '<!-- ==== COVER:END ==== -->' },
  { name: 'COVER-JS', open: '/* ==== COVER-JS:START ==== */', close: '/* ==== COVER-JS:END ==== */' },
];

/** 取 open..close 之间（含标记）的整段文本；找不到返回 null */
function extract(text, block) {
  const i = text.indexOf(block.open);
  if (i < 0) return null;
  const j = text.indexOf(block.close, i + block.open.length);
  if (j < 0) return null;
  return text.slice(i, j + block.close.length);
}

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const src = read(SRC);
let dst = read(DST);
const checkOnly = process.argv.includes('--check');

const problems = [];
let changed = 0;

for (const block of BLOCKS) {
  const want = extract(src, block);
  if (want === null) {
    problems.push(`dev.html 缺少 ${block.name} 标记（${block.open} … ${block.close}）`);
    continue;
  }
  const have = extract(dst, block);
  if (have === null) {
    problems.push(`index.html 缺少 ${block.name} 标记`);
    continue;
  }
  if (have !== want) {
    if (checkOnly) {
      problems.push(`index.html 的 ${block.name} 与 dev.html 不一致`);
    } else {
      dst = dst.replace(have, want);
      changed++;
    }
  }
}

if (problems.length) {
  console.error('[sync-cover] 失败：');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

if (checkOnly) {
  console.log('[sync-cover] 一致：dev.html 与 index.html 的封面三块完全相同');
  process.exit(0);
}

if (changed === 0) {
  console.log('[sync-cover] 已是最新，无需改动');
} else {
  fs.writeFileSync(DST, dst);
  console.log(`[sync-cover] 已同步 ${changed} 块到 index.html`);
}
