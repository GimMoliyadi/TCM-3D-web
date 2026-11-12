/**
 * 数据访问层（repository）
 *
 * 组件只依赖本文件暴露的接口，不直接 import JSON。
 *
 * 数据来源有两种模式，由环境变量 VITE_API_BASE 决定：
 *   - 未配置（默认）：走内置 JSON，纯静态托管，零延迟、零依赖。
 *   - 已配置：走 FastAPI 后端（backend/），失败时自动回退到内置 JSON。
 *
 * 回退是必须的：后端是独立服务，挂了不能让页面白屏。调用方拿到的一定是
 * 可用数据，只是不知道、也不需要知道数据来自哪里。
 *
 * ⚠️ 保护清单：本目录下的 acupoints_data.json / acupoint_categories.js /
 * dietary/* 是项目基线数据，其内容与字节不得修改（由 tests/dietary.test.cjs 守护）。
 * 本文件只做「读取与派生」，不复制坐标、不新增穴位、不改搜索语义。
 */

import acupointsData from './acupoints_data.json';
import { bodyPartCategories, symptomCategories } from './acupoint_categories';

/** 原始穴位数据（290 条）。冻结以防被误改。 */
export const ACUPOINTS = Object.freeze(acupointsData);

export const CATEGORY_KINDS = Object.freeze({ BODY: 'body', SYMPTOM: 'symptom' });

/** 后端地址；空字符串表示不启用后端。 */
const API_BASE = (import.meta.env?.VITE_API_BASE ?? '').replace(/\/$/, '');

/** 后端是否启用（仅表示配置了地址，不代表此刻可达）。 */
export const BACKEND_ENABLED = API_BASE !== '';

/** 最近一次数据来源，供调试与页脚显示。 */
let lastSource = 'local';
export function dataSource() {
  return lastSource;
}

/** 带超时的 fetch，避免后端无响应时页面一直转圈。 */
async function fetchWithTimeout(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 把后端返回的记录适配成前端内部结构。
 *
 * 后端字段平铺（relative_x/y/z），前端要嵌套的 relativePos —— 这个转换只在
 * 这里做一次，UI 组件不用关心数据从哪来。
 */
function adaptAcupoint(row) {
  return {
    id: row.id,
    name: row.name,
    relativePos:
      row.relative_x == null
        ? undefined
        : { x: row.relative_x, y: row.relative_y, z: row.relative_z },
    location: row.location,
    massage: row.massage,
    contraindications: row.contraindications,
    efficacy: row.efficacy,
  };
}

let cache = null;

/**
 * 取穴位数据。
 *
 * 配置了 VITE_API_BASE 时优先请求后端；任何失败（网络、超时、4xx/5xx、
 * 返回体异常）都回退到内置 JSON，并保证字段形状一致。
 * @returns {Promise<Array>}
 */
export async function fetchAcupoints() {
  if (cache) return cache;

  if (BACKEND_ENABLED) {
    try {
      const rows = await fetchWithTimeout(`${API_BASE}/api/acupoints?limit=290`);
      if (Array.isArray(rows) && rows.length > 0) {
        // 后端不返回空内容记录，字段少的用本地数据补齐（如缺 massage）
        const byId = new Map(ACUPOINTS.map((p) => [p.id, p]));
        cache = rows.map((row) => {
          const adapted = adaptAcupoint(row);
          const local = byId.get(adapted.id);
          return local
            ? { ...local, ...adapted, relativePos: adapted.relativePos ?? local.relativePos }
            : adapted;
        });
        lastSource = 'backend';
        return cache;
      }
      // 空数组说明后端没有数据，视为不可用
      throw new Error('后端返回空数据');
    } catch (err) {
      // 回退不是静默失败：留下痕迹便于排查，但用户侧无感。
      console.warn('[repository] 后端不可用，回退到内置数据：', err.message);
    }
  }

  cache = ACUPOINTS;
  lastSource = 'local';
  return cache;
}

/** 后端健康检查（供设置页/调试用；失败返回 false，不抛异常）。 */
export async function checkBackend() {
  if (!BACKEND_ENABLED) return false;
  try {
    const body = await fetchWithTimeout(`${API_BASE}/health`, 2000);
    return body?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * 按名称精确查找（分类菜单「点击穴位名 → 定位」用的就是这套语义）。
 * @param {Array} list
 * @param {string} name
 */
export function findPointByName(list, name) {
  return list.find((p) => p.name === name) || null;
}

/** 按 id 查找（食养知识层的 anchorAcupointId 走这条路径）。 */
export function findPointById(list, id) {
  return list.find((p) => p.id === id) || null;
}

/**
 * 搜索。谓词与改造前的实现逐字一致：
 * name / text / location / efficacy 四个字段做 includes 匹配。
 * （数据里目前没有 text 字段，保留是为了兼容后续数据扩充。）
 */
export function searchAcupoints(list, term) {
  if (!term || term.trim() === '') return [];
  return list.filter(
    (pt) =>
      (pt.name && pt.name.includes(term)) ||
      (pt.text && pt.text.includes(term)) ||
      (pt.location && pt.location.includes(term)) ||
      (pt.efficacy && pt.efficacy.includes(term))
  );
}

/**
 * 搜索（异步版）。
 *
 * 配置了后端时走后端全文检索（后端按「名称 > 功效 > 定位 > 手法」排序），
 * 未配置或后端失败时等价于本地 searchAcupoints。返回的始终是穴位对象数组，
 * 调用方不需要区分数据来源。
 */
export async function searchAcupointsAsync(list, term) {
  const keyword = (term ?? '').trim();
  if (!keyword) return [];

  if (BACKEND_ENABLED) {
    try {
      const body = await fetchWithTimeout(
        `${API_BASE}/api/acupoints/search?q=${encodeURIComponent(keyword)}&limit=50`
      );
      if (Array.isArray(body?.results)) {
        // 后端只返回匹配字段，用本地数据补齐 UI 需要的其余字段与坐标
        const byId = new Map(list.map((p) => [p.id, p]));
        return body.results
          .map((row) => {
            const adapted = adaptAcupoint(row);
            const local = byId.get(adapted.id);
            return local ? { ...local, ...adapted, relativePos: adapted.relativePos ?? local.relativePos } : adapted;
          })
          .filter(Boolean);
      }
      throw new Error('返回体缺 results');
    } catch (err) {
      console.warn('[repository] 后端搜索失败，回退本地搜索：', err.message);
    }
  }

  return searchAcupoints(list, keyword);
}

/** 取某一类分类定义（'body' | 'symptom'）。 */
export function categoriesFor(kind) {
  return kind === CATEGORY_KINDS.SYMPTOM ? symptomCategories : bodyPartCategories;
}

/** 分类展开后，把穴位名列表解析成真实穴位对象（找不到的忽略）。 */
export function pointsForCategory(category, list) {
  if (!category) return [];
  return category.points
    .map((name) => findPointByName(list, name))
    .filter(Boolean);
}

/** 某穴位所属的部位分类 / 症状分类 —— 用于详情页展示「相关分类」。 */
export function bodyPartsOf(name) {
  return bodyPartCategories.filter((c) => c.points.includes(name)).map((c) => c.name);
}

export function symptomsOf(name) {
  return symptomCategories.filter((c) => c.points.includes(name)).map((c) => c.name);
}

/** 数据集统计信息，用于页头/空状态文案。 */
export function datasetStats(list) {
  return {
    total: list.length,
    bodyCategories: bodyPartCategories.length,
    symptomCategories: symptomCategories.length,
  };
}