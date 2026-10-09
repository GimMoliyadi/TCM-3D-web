const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const points = readJson('source/data/acupoints_data.json');
const relations = readJson('source/data/dietary/zangfu_relations.json');
const catalogModule = import(pathToFileURL(path.join(root, 'source/utils/acupointCatalog.mjs')).href);
const categoriesModule = import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(
    fs.readFileSync(path.join(root, 'source/data/acupoint_categories.js'), 'utf8'),
  )}`,
);

const expectedMissingNames = [
  '安眠穴', '臂臑穴', '承山穴', '瘛脉穴', '冲阳穴', '大巨穴', '地机穴', '定喘穴',
  '独阴穴', '犊鼻穴', '耳门穴', '二间穴', '风门穴', '复溜穴', '关门穴', '归来穴',
  '鹤顶穴', '滑肉门穴', '会宗穴', '箕门穴', '颊车穴', '肩髎穴', '肩髃穴', '交信穴',
  '角孙穴', '龈交穴', '库房穴', '昆仑穴', '厉兑穴', '梁丘穴', '漏谷穴', '颅息穴',
  '臑会穴', '偏历穴', '气端穴', '气户穴', '气门穴', '气舍穴', '清冷渊穴', '人迎穴',
  '三间穴', '三阳络穴', '上巨虚穴', '上廉穴', '食窦穴', '水道穴', '水突穴', '四渎穴',
  '天井穴', '天髎穴', '天枢穴', '天溪穴', '天牖穴', '条口穴', '外关穴', '外陵穴',
  '温溜穴', '屋翳穴', '膝眼穴', '下关穴', '下巨虚穴', '下廉穴', '陷谷穴', '消泺穴',
  '胸乡穴', '阳溪穴', '液门穴', '阴谷穴', '阴市穴', '印堂穴', '膺窗穴', '中渚穴',
  '周荣穴', '肘髎穴', '筑宾穴',
];

const expectedCategoryCounts = {
  head: [43, 2],
  neck: [11, 3],
  upper_limb: [42, 26],
  chest_abdomen: [40, 16],
  back: [74, 3],
  lower_limb: [46, 20],
  headache: [7, 1],
  insomnia: [7, 1],
  neck_shoulder: [7, 1],
  low_back_pain: [6, 2],
  stomach: [7, 1],
  cough: [7, 1],
  eye_fatigue: [8, 0],
  nasal: [7, 1],
  toothache: [6, 2],
  menstrual: [7, 1],
  anxiety: [8, 0],
  constipation: [6, 2],
  knee_pain: [6, 2],
  dizziness: [7, 1],
  fatigue: [8, 0],
};

test('catalog filters the seven confirmed model nodes and preserves point identity', async () => {
  const { buildAcupointCatalog } = await catalogModule;
  const catalog = buildAcupointCatalog(points);
  const expectedExcludedIds = [
    'Cube.001',
    'Cube.002',
    'Cube.003',
    'Cube.004',
    'xuewei.HighPolyEyes',
    'xuewei.HighPolyEyes.001',
    'xuewei.sport-briefs01.001',
  ];

  assert.equal(points.length, 290);
  assert.equal(catalog.points.length, 283);
  assert.deepEqual(catalog.excludedPoints.map(point => point.id).sort(), expectedExcludedIds.sort());
  assert.equal(catalog.excludedPoints.every(point => !catalog.byId.has(point.id)), true);

  const point = points.find(item => item.id === '肝俞穴');
  const relativePosBefore = { ...point.relativePos };
  assert.strictEqual(catalog.byId.get(point.id), point);
  assert.strictEqual(catalog.byName.get(point.name), point);
  assert.deepEqual(point.relativePos, relativePosBefore);
  assert.deepEqual(catalog.points.find(item => item.id === point.id).relativePos, relativePosBefore);
});

test('category resolution reports the audited 75-name missing set and stable counts', async () => {
  const { buildAcupointCatalog, resolveCategory } = await catalogModule;
  const { bodyPartCategories, symptomCategories } = await categoriesModule;
  const catalog = buildAcupointCatalog(points);
  const categories = [...bodyPartCategories, ...symptomCategories];
  const missingNames = new Set();

  assert.equal(categories.length, 21);
  for (const category of categories) {
    const result = resolveCategory(category, catalog);
    const [availableCount, missingCount] = expectedCategoryCounts[category.id];
    assert.equal(result.availablePoints.length, availableCount, category.id);
    assert.equal(result.unavailableNames.length, missingCount, category.id);
    for (const name of result.unavailableNames) missingNames.add(name);
  }

  assert.equal(missingNames.size, 75);
  assert.deepEqual([...missingNames].sort(), [...expectedMissingNames].sort());
});

test('category resolution deduplicates available points and missing names without alias guessing', async () => {
  const { buildAcupointCatalog, resolveCategory } = await catalogModule;
  const catalog = buildAcupointCatalog(points);
  const result = resolveCategory(
    { points: ['百会穴', '百会穴', '缺失穴', '缺失穴', '风门穴'] },
    catalog,
  );

  assert.deepEqual(result.availablePoints.map(point => point.id), ['百会穴']);
  assert.deepEqual(result.unavailableNames, ['缺失穴', '风门穴']);
  assert.equal(catalog.byName.has('风门穴'), false);
  assert.equal(catalog.byName.has('风门穴2'), true);
  assert.equal(catalog.byName.has('承山穴'), false);
  assert.equal(catalog.byName.has('承山穴2'), true);
  assert.equal(catalog.byName.has('昆仑穴'), false);
  assert.equal(catalog.byName.has('昆仑穴.001'), true);
  assert.equal(catalog.byName.has('昆仑穴2'), true);
});

test('dietary relation anchors resolve to retained acupoint objects', async () => {
  const { buildAcupointCatalog } = await catalogModule;
  const catalog = buildAcupointCatalog(points);

  assert.equal(relations.length, 3);
  for (const relation of relations) {
    const anchor = catalog.byId.get(relation.anchorAcupointId);
    assert.ok(anchor, relation.anchorAcupointId);
    assert.strictEqual(anchor, points.find(point => point.id === relation.anchorAcupointId));
    assert.equal(catalog.excludedPoints.includes(anchor), false);
  }
});
