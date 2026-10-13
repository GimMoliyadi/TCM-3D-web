/**
 * 数据访问层（repository）
 *
 * 组件只依赖本文件暴露的接口，不直接 import JSON。
 * 这样做的目的：将来把数据源换成 FastAPI 接口时，只需改这一个文件，
 * UI 组件与 hooks 完全不用动。
 *
 * 迁移示例（未来）：
 *   export async function fetchAcupoints() {
 *     const res = await fetch(`${API_BASE}/acupoints`);
 *     if (!res.ok) throw new Error(`穴位数据请求失败：${res.status}`);
 *     return res.json();
 *   }
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

/**
 * 取穴位数据。
 * 现阶段直接返回本地 JSON；未来替换为后端请求时保持函数签名不变。
 * @returns {Promise<Array>}
 */
export async function fetchAcupoints() {
  return ACUPOINTS;
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
