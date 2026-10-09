const MODEL_NODE_IDS = new Set([
  'Cube.001',
  'Cube.002',
  'Cube.003',
  'Cube.004',
  'xuewei.HighPolyEyes',
  'xuewei.HighPolyEyes.001',
  'xuewei.sport-briefs01.001',
]);

export function buildAcupointCatalog(rawPoints) {
  if (!Array.isArray(rawPoints)) {
    throw new TypeError('rawPoints must be an array');
  }

  const excludedPoints = rawPoints.filter(point => MODEL_NODE_IDS.has(point.id));
  const points = rawPoints.filter(point => !MODEL_NODE_IDS.has(point.id));
  const byId = new Map(points.map(point => [point.id, point]));
  const byName = new Map(points.map(point => [point.name, point]));

  return { points, byId, byName, excludedPoints };
}

export function resolveCategory(category, catalog) {
  if (!category || !Array.isArray(category.points)) {
    throw new TypeError('category.points must be an array');
  }

  const availablePoints = [];
  const unavailableNames = [];
  const seenPoints = new Set();
  const seenUnavailableNames = new Set();

  for (const name of category.points) {
    const point = catalog.byName.get(name);
    if (point) {
      if (!seenPoints.has(point)) {
        seenPoints.add(point);
        availablePoints.push(point);
      }
    } else if (!seenUnavailableNames.has(name)) {
      seenUnavailableNames.add(name);
      unavailableNames.push(name);
    }
  }

  return { availablePoints, unavailableNames };
}
