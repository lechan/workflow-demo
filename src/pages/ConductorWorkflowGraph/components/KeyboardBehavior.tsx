// @ts-nocheck
import React, { useEffect } from 'react';
import { useGraphInstance, useHistory } from '@antv/xflow';
import type { Graph } from '@antv/x6';
import { useAppContext } from './AppContext';

/**
 * 键盘按钮行为组件
 *
 * 这个组件是一个 React 函数组件，它绑定 'delete' 和 'backspace' 键以删除选中的单元格。
 *
 * @returns 无返回值
 */
export const KeyboardBehavior: React.FC = () => {
  const graph = useGraphInstance<Graph>();
  const { globalState } = useAppContext(); // 获取全局 state
  const { undo, redo } = useHistory();
  useEffect(() => {
    if (!graph) return;

    // Bind Delete and Backspace to removal
    graph.bindKey(['delete', 'backspace'], (): boolean => {
      const { hasSaved } = globalState;
      if (hasSaved) return false;
      const cells = graph.getSelectedCells();
      if (cells.length > 0) {
        // 过滤掉开始节点
        const filteredCells = cells.filter(cell => 
          !(cell.shape === 'rect' && cell.id === 'start')
        );
        if (filteredCells.length > 0) {
          graph.removeCells(filteredCells);
        }
      }
      return false;
    });

    // Bind Ctrl+Z to undo
    graph.bindKey('ctrl+z', () => {
      undo();
      return false;
    });

    // Bind Ctrl+Y to redo
    graph.bindKey('ctrl+y', () => {
      redo();
      return false;
    });

    // Cleanup on unmount
    return () => {
      graph.unbindKey(['delete', 'backspace']);
      graph.unbindKey('ctrl+z');
      graph.unbindKey('ctrl+y');
    };
  }, [graph, globalState, undo, redo]);

  return null;
};
