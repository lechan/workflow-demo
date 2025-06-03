import React, { useState } from 'react';
import NodeDrawer from './NodeDrawer';
import ExecuteDrawer from './ExecuteDrawer';
import { useGraphEvent } from '@antv/xflow';
import { useAppContext } from './AppContext';

export const NodeClick: React.FC = () => {
  const { globalState } = useAppContext();
  const { isExecuting } = globalState;
  useGraphEvent('node:click', ({ node }) => {
    handleNodeClick(node);
  })

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    const { store: { data: { nodeType } } } = node
    if (nodeType && (nodeType !== 'fork' && nodeType!== 'join' && nodeType!== 'end')) {
      if (isExecuting) {
        setExecuteVisible(true);
      } else {
        setDrawerVisible(true);
      }
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedNode(null);
  };

  const [executeVisible, setExecuteVisible] = useState(false);
  const handleExecuteClose = () => {
    setExecuteVisible(false);
  };

  return (
    <>
      <NodeDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        nodeData={selectedNode}
      />
      <ExecuteDrawer
        visible={executeVisible}
        onClose={handleExecuteClose}
        nodeData={selectedNode}
      />
    </>
  )
}
