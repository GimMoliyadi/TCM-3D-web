const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, process.env.TEST_DIST_DIR || 'dist');
const output = path.join(root, '.test-output');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm',
  '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary',
};
const prefix = '/TCM-3D-web/';

// Exercise the same artifact at a domain root and a Pages subpath.
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname.startsWith(prefix)) pathname = pathname.slice(prefix.length);
  const file = path.resolve(dist, pathname.replace(/^\/+/, '') || 'index.html');
  const relative = path.relative(dist, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

async function checkCategories(page, all) {
  await page.getByTitle('展开分类菜单').click();
  for (const tab of all ? ['按部位', '按症状'] : ['按部位']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    const groups = page.locator('[data-category-id]');
    const count = all ? await groups.count() : 1;
    for (let index = 0; index < count; index++) {
      const group = groups.nth(index);
      await group.locator(':scope > button').click();
      const available = group.locator('button[data-acupoint-id]');
      const badge = group.locator('[aria-label$="个可定位穴位"]');
      assert.equal(Number(await badge.innerText()), await available.count());
      const pending = group.locator('details');
      if (await pending.count()) {
        await pending.locator('summary').click();
        assert.match(await pending.innerText(), /待补充/);
        assert.equal(await pending.locator('button').count(), 0);
      }
    }
  }
  await page.getByRole('button', { name: '按部位', exact: true }).click();
  const back = page.locator('[data-category-id="back"]');
  if (await back.locator(':scope > button').getAttribute('aria-expanded') !== 'true') {
    await back.locator(':scope > button').click();
  }
  await back.locator('[data-acupoint-id="肝俞穴"]').click();
  await page.getByTitle('收起分类菜单').click();
  await page.getByRole('heading', { name: '肝俞穴', exact: true }).waitFor();
  await page.keyboard.press('Escape');
}

async function checkPage(browser, origin, viewport, subpath) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [], failedRequests = [], badResponses = [], responses = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url() + ': ' + request.failure()?.errorText));
  page.on('response', response => {
    responses.add(new URL(response.url()).pathname);
    if (response.status() >= 400) badResponses.push(response.status() + ' ' + response.url());
  });
  const base = subpath ? prefix : '/';
  await page.goto(origin + base);
  await page.getByRole('note', { name: '医疗免责声明' }).waitFor();
  await page.locator('#boot-loading').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: '食养', exact: true }).click();
  await page.getByRole('button', { name: '肝 · 食养', exact: true }).click();
  await page.getByRole('heading', { name: '肝 · 传统食养', exact: true }).waitFor();
  assert.equal(await page.locator('.dietary-card').count(), 3);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas')?.getBoundingClientRect();
    const panel = document.querySelector('.dietary-panel')?.getBoundingClientRect();
    return canvas && panel && (innerWidth > 640 ? canvas.right <= panel.left + 1 : canvas.bottom <= panel.top + 1);
  });
  const canvas = await page.locator('canvas').boundingBox();
  const panel = await page.locator('.dietary-panel').boundingBox();
  assert(canvas.width > 100 && canvas.height > 100);
  assert(viewport.width > 640 ? canvas.x + canvas.width <= panel.x + 1 : canvas.y + canvas.height <= panel.y + 1, JSON.stringify({ viewport, canvas, panel }));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const tag = viewport.width + '-' + (subpath ? 'subpath' : 'root');
  await page.screenshot({ path: path.join(output, 'dietary-' + tag + '.png') });

  for (const name of ['小麦', '粳米', '牛肉']) {
    await page.getByPlaceholder('搜索食物名称').fill(name);
    assert.equal(await page.locator('.dietary-card').count(), 1);
    await page.locator('.dietary-card').click();
    await page.locator('.dietary-panel summary').click();
    assert(await page.locator('blockquote').isVisible());
    assert((await page.locator('blockquote').innerText()).length > 5);
    await page.getByRole('button', { name: '← 返回肝 · 传统食养' }).click();
  }
  await page.getByPlaceholder('搜索食物名称').fill('不存在');
  await page.getByRole('status').waitFor();
  await page.getByPlaceholder('搜索食物名称').fill('');
  await page.locator('.dietary-card').first().click();
  await page.getByRole('button', { name: '关联：肝 · 定位空间锚点' }).click();
  await page.getByRole('heading', { name: '肝 · 传统食养', exact: true }).waitFor();
  await page.getByRole('button', { name: '关闭食养面板' }).click();
  assert.equal(await page.locator('.dietary-panel').count(), 0);
  await page.getByRole('button', { name: '肝 · 食养', exact: true }).click();
  await page.getByRole('heading', { name: '肝 · 传统食养', exact: true }).waitFor();

  await page.getByRole('button', { name: '穴位', exact: true }).click();
  await page.getByPlaceholder('搜索穴位名称...').fill('Cube');
  assert.equal(await page.locator('button[data-acupoint-id]:visible').count(), 0);
  await page.getByPlaceholder('搜索穴位名称...').fill('肝俞');
  await page.locator('button[data-acupoint-id="肝俞穴"]:visible').click();
  await page.getByRole('heading', { name: '肝俞穴', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await checkCategories(page, viewport.width > 640);
  await page.screenshot({ path: path.join(output, 'acupoints-' + tag + '.png') });
  for (const resource of ['models/human_body.glb', 'draco/draco_decoder.wasm', 'hdri/studio_small_03_1k.hdr']) {
    assert(responses.has(base + resource), 'missing resource: ' + base + resource);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);
  assert.deepEqual(badResponses, []);
  const result = { viewport, subpath, canvas, panel, errors, failedRequests, badResponses };
  await context.close();
  return result;
}

async function checkFailures(browser, origin) {
  const results = [];
  for (const kind of ['model', 'hdr', 'script']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const route = kind === 'model' ? '**/models/human_body.glb' : kind === 'hdr' ? '**/*.hdr' : '**/assets/*.js';
    await page.route(route, request => request.fulfill({ status: 404, body: 'expected test failure' }));
    await page.goto(origin);
    if (kind === 'model') {
      await page.getByRole('alert').filter({ hasText: '3D 场景加载失败' }).waitFor({ timeout: 30000 });
      await page.getByRole('button', { name: '重新加载', exact: true }).waitFor();
    } else if (kind === 'hdr') {
      await page.locator('#boot-loading').waitFor({ state: 'detached' });
      await page.getByRole('button', { name: '食养', exact: true }).click();
      await page.getByRole('button', { name: '肝 · 食养', exact: true }).click();
      await page.getByRole('heading', { name: '肝 · 传统食养', exact: true }).waitFor();
    } else {
      await page.getByRole('button', { name: '刷新重试', exact: true }).waitFor({ timeout: 22000 });
    }
    results.push({ kind, passed: true });
    await context.close();
  }
  return results;
}

(async () => {
  assert(fs.existsSync(path.join(dist, 'index.html')), 'Run npm run build first.');
  fs.mkdirSync(output, { recursive: true });
  server.listen(Number(process.env.TEST_PORT || 0), '127.0.0.1');
  await once(server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const pages = [];
    for (const [viewport, subpath] of [
      [{ width: 1280, height: 900 }, false],
      [{ width: 390, height: 844 }, false],
      [{ width: 1280, height: 900 }, true],
    ]) {
      pages.push(await checkPage(browser, origin, viewport, subpath));
      console.log('Passed viewport ' + viewport.width + ' at ' + (subpath ? prefix : '/'));
    }
    const failures = await checkFailures(browser, origin);
    const result = { passed: true, pages, failures };
    fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
