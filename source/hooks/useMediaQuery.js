import { useEffect, useState } from 'react';

/**
 * 匹配 CSS 媒体查询并随窗口变化更新。
 * 布局的「真相」仍然在 CSS 断点里，这里只用于需要按设备差异渲染不同结构的场景
 * （例如手机上把右栏变成底部 sheet）。
 *
 * @param {string} query 例如 '(max-width: 860px)'
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // 兼容旧版 Safari
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

/** 布局断点，与 styles/layout.css 保持一致。 */
export const BREAKPOINTS = {
  compact: '(max-width: 860px)',
  tablet: '(max-width: 1180px)',
};
