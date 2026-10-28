import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(directory, 'catalog.json'), 'utf8'));
const style = readFileSync(join(directory, 'catalog.css'), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const sections = new Set();
const cards = new Set();

for (const group of catalog.groups) {
  if (!/^[a-z0-9-]+$/.test(group.id) || sections.has(group.id)) throw new Error(`Invalid section: ${group.id}`);
  sections.add(group.id);
  for (const item of group.items) {
    if (cards.has(item.code) || !item.frames.length) throw new Error(`Invalid card: ${item.code}`);
    cards.add(item.code);
    for (const frame of item.frames) {
      if (!/^screens\/[a-z0-9-]+\.webp$/.test(frame.src) || !existsSync(join(directory, frame.src))) {
        throw new Error(`Missing or invalid capture: ${frame.src}`);
      }
      if (!Number.isInteger(frame.width) || !Number.isInteger(frame.height) || frame.width <= 0 || frame.height <= 0) {
        throw new Error(`Invalid dimensions: ${frame.src}`);
      }
      if (createHash('sha256').update(readFileSync(join(directory, frame.src))).digest('hex') !== frame.sha256) {
        throw new Error(`Capture checksum mismatch: ${frame.src}`);
      }
    }
  }
}

const frameHTML = (item, frame) => {
  const name = `${item.title} · ${frame.label}`;
  return `<div class="frame"><details class="frame-preview" name="preview"><summary aria-label="放大或关闭${escape(name)}截图"><span class="thumbnail"><img src="${escape(frame.src)}" alt="${escape(name)}" loading="lazy" width="${frame.width}" height="${frame.height}"></span></summary><div class="preview" aria-hidden="true"><span class="preview-caption">${escape(name)}</span><img src="${escape(frame.src)}" alt="" loading="lazy" width="${frame.width}" height="${frame.height}"></div></details><div class="frame-label"><span>${escape(frame.label)}</span><span aria-hidden="true">⤢</span></div></div>`;
};
const navigation = catalog.groups.map(group => `<a href="#${group.id}"><span>${escape(group.title)}</span><span>${String(group.items.length).padStart(2, '0')}</span></a>`).join('\n');
const groups = catalog.groups.map((group, index) => {
  const items = group.items.map(item => `<article class="card${item.frames.length === 1 ? ' single' : ''}"><div class="card-head"><div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></div><span class="card-code">${escape(item.code)}</span></div><div class="frames">${item.frames.map(frame => frameHTML(item, frame)).join('')}</div></article>`).join('\n');
  return `<section class="group" id="${group.id}"><div class="group-header"><div><div class="group-number">${String(index + 1).padStart(2, '0')} / ${escape(group.en)}</div><h2>${escape(group.title)}</h2><p>${escape(group.description)}</p></div><span class="group-total">${String(group.items.length).padStart(2, '0')} SCREENS</span></div><div class="cards">${items}</div></section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="zh-Hans">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>InfoHub · iOS 设计档案</title><style>${style}</style></head>
<body><div class="shell"><aside class="sidebar"><a class="brand" href="#top" aria-label="InfoHub 设计档案首页"><img src="logo.png" alt=""><span><strong>InfoHub</strong><small>iOS DESIGN ARCHIVE</small></span></a><div class="nav-label">设计目录</div><nav aria-label="页面分类">${navigation}</nav><div class="sidebar-note"><span class="status-dot"></span><div><strong>原生界面 · ${cards.size} 个页面 / 状态</strong><p>${escape(catalog.device)}<br>更新于 ${escape(catalog.reviewed)}</p></div></div></aside>
<main id="top"><header class="intro"><div><div class="eyebrow">DESIGN ARCHIVE / iOS</div><h1>让资讯，自然地展开。</h1><p>InfoHub 原生界面图册。点击截图放大，查看页面、状态与深浅色呈现。</p></div><span class="intro-meta">${cards.size} SCREENS · ${escape(catalog.reviewed)}</span></header>${groups}<footer><span>InfoHub · iOS 设计档案</span><span>截图来自隔离模拟器；资讯内容和示例状态仅代表采集时画面。</span></footer></main></div></body></html>\n`;

const output = join(directory, 'index.html');
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== html) throw new Error('index.html is out of date; run node build-catalog.mjs');
  console.log(`Verified ${cards.size} cards across ${sections.size} sections.`);
} else {
  writeFileSync(output, html);
  console.log(`Rendered ${cards.size} cards across ${sections.size} sections.`);
}
