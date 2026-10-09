const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = require('./fixtures/preserved-assets.json');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readDietary = name => readJson(`source/data/dietary/${name}.json`);
const foods = readDietary('foods');
const relations = readDietary('zangfu_relations');
const sources = readDietary('dietary_sources');

const protectedRoots = ['models', 'draco', 'hdri', 'static', 'source/data'];
const rootProtectedFiles = ['index.html', 'asset-manifest.json'];

function listFiles(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });
  return entries.flatMap(entry => {
    const relativePath = path.posix.join(relativeDirectory.replaceAll(path.sep, '/'), entry.name);
    return entry.isDirectory() ? listFiles(relativePath) : [relativePath];
  });
}

function normalizedBytes(file, kind) {
  const bytes = fs.readFileSync(path.join(root, file));
  return kind === 'text' ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8') : bytes;
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

test('protected source, model, decoder, build and data assets match the committed manifest', () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.sourceRevision, '4614879bc908b0b00b8ef4cf52cb2c3e8ec4df17');
  assert.equal(manifest.textNormalization, 'CRLF to LF before hashing text entries');
  assert.equal(manifest.files.length, 30);

  const expectedPaths = manifest.files.map(file => file.path).sort();
  const actualPaths = [...rootProtectedFiles, ...protectedRoots.flatMap(listFiles)].sort();
  assert.deepEqual(actualPaths, expectedPaths);

  for (const entry of manifest.files) {
    assert.equal(entry.mode, '100644', entry.path);
    assert.ok(entry.kind === 'text' || entry.kind === 'binary', entry.path);
    assert.equal(sha256(normalizedBytes(entry.path, entry.kind)), entry.sha256, entry.path);
  }
});

test('preserves all 290 source acupoint records', () => {
  const points = readJson('source/data/acupoints_data.json');
  // Any 283-point subset is only a display candidate filter, not a medical validation count.
  assert.equal(points.length, 290, 'the source dataset must retain all 290 original records');
});

test('three foods have complete source-backed relations and resolve existing IDs', () => {
  const points = readJson('source/data/acupoints_data.json');
  assert.equal(foods.length, 3);
  assert.equal(relations.length, 3);
  for (const collection of [foods, relations, sources]) {
    assert.equal(new Set(collection.map(item => item.id)).size, collection.length);
  }
  for (const relation of relations) {
    assert(foods.some(food => food.id === relation.foodId));
    assert(points.some(point => point.id === relation.anchorAcupointId));
    assert.equal(relation.target, '肝');
    assert.equal(relation.confidence, 'source_verified');
    for (const sourceId of relation.sourceIds) {
      const source = sources.find(item => item.id === sourceId);
      assert(source);
      for (const key of ['book', 'chapter', 'entry', 'quote', 'repository', 'path', 'fileSha256', 'verification']) {
        assert(source[key], key);
      }
    }
  }
});

test('knowledge layer contains no duplicate spatial coordinates or modern textbook excerpts', () => {
  for (const collection of [foods, relations, sources]) {
    for (const item of collection) {
      for (const key of ['x', 'y', 'z', 'relativePos', 'position']) {
        assert.equal(item[key], undefined);
      }
    }
  }
  assert(sources.every(source => source.sourceKind === 'classical_text'));
  assert.deepEqual(readDietary('dietary_recipes'), []);
});
