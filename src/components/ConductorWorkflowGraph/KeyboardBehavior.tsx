// @ts-nocheck
import React, { useEffect } from 'react';
import { useGraphInstance } from '@antv/xflow';
import type { Graph } from '@antv/x6';

/**
 * 键盘按钮行为组件
 *
 * 这个组件是一个 React 函数组件，它绑定 'delete' 和 'backspace' 键以删除选中的单元格。
 *
 * @returns 无返回值
 */
export const KeyboardBehavior: React.FC = () => {
  const graph = useGraphInstance<Graph>();

  useEffect(() => {
    if (!graph) return;

    // Bind Delete and Backspace to removal
    graph.bindKey(['delete', 'backspace'], (): boolean => {
      const cells = graph.getSelectedCells();
      if (cells.length > 0) {
        graph.removeCells(cells);
      }
      // Prevent default browser behavior (e.g. navigating back)
      return false;
    });

    // Cleanup on unmount
    return () => {
      graph.unbindKey(['delete', 'backspace']);
    };
  }, [graph]);

  return null;
};
