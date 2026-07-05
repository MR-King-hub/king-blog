"use client";

import { useState, useEffect } from "react";

/**
 * 返回是否已完成客户端水合。
 * 在 SSG/静态导出模式下，可用来避免 Motion 动画导致的水合闪烁：
 * - 水合前：内容以正常可见状态渲染（不设置 opacity:0）
 * - 水合后：才启用入场动画
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
