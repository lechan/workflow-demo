import React, { useState } from 'react';
import NodeDrawer from './NodeDrawer';
import ExecuteDrawer from './ExecuteDrawer';
import { useGraphEvent, useGraphInstance } from '@antv/xflow';
import { useAppContext } from './AppContext';

export const NodeClick: React.FC = () => {
  const { globalState } = useAppContext();
  const { isExecuting } = globalState;
  useGraphEvent('node:click', ({ node }) => {
    handleNodeClick(node);
  })

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [preNodeData, setPreNodeData] = useState([]);

  const graph = useGraphInstance();

  // 查找连接到当前节点之前的所有节点
  const findPreviousNodes = (node: any) => {
    if (!graph) return [];
    
    const visitedNodes: any[] = [];
    const queue: any[] = [node];
    const visited = new Set([node.id]);
    
    // 广度优先搜索，查找所有连接到当前节点的前置节点
    while (queue.length > 0) {
      const currentNode = queue.shift();
      
      // 获取连接到当前节点的所有入边
      const incomingEdges = graph.getIncomingEdges(currentNode);
      
      if (incomingEdges) {
        for (const edge of incomingEdges) {
          const sourceNode = edge.getSourceNode();
          if (sourceNode && !visited.has(sourceNode.id)) {
            visited.add(sourceNode.id);
            queue.push(sourceNode);
            // 只添加非当前节点到结果中
            if (sourceNode.id !== node.id) {
              visitedNodes.push(sourceNode);
            }
          }
        }
      }
    }
    // 过滤出类型为 'Shell', 'Python', 'PromQL', 'LocalFile', 'RemoteFile' 的节点
    const functionNodeTypes = ['Shell', 'Python', 'PromQL', 'LocalFile', 'RemoteFile'];
    const filteredNodes = visitedNodes.filter(node => functionNodeTypes.includes(node.store.data.nodeType));
    
    return filteredNodes;
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    
    // 查找并设置前置节点数据
    const previousNodes = findPreviousNodes(node);
    setPreNodeData(previousNodes);
    console.log(previousNodes);
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
        preNodeData={preNodeData}
      />
      <ExecuteDrawer
        visible={executeVisible}
        onClose={handleExecuteClose}
        nodeData={selectedNode}
      />
    </>
  )
}
