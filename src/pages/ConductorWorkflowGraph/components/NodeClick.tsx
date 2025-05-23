import React, { useState } from 'react';
import NodeDrawer from './NodeDrawer';
import { useGraphEvent } from '@antv/xflow';

export const NodeClick: React.FC = () => {
  useGraphEvent('node:click', ({ node }) => {
    handleNodeClick(node);
  })

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
    const { store: { data: { nodeType } } } = node
    if (nodeType && (nodeType !== 'fork' && nodeType!== 'join' && nodeType!== 'end')) {
      setDrawerVisible(true);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedNode(null);
  };

  return (
    <NodeDrawer
      visible={drawerVisible}
      onClose={handleDrawerClose}
      nodeData={selectedNode}
    />
  )
}
