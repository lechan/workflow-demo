import React from 'react';
import { XFlow, XFlowGraph, Grid, Background, Snapline, History, Clipboard, Control } from "@antv/xflow";
import { InitNode } from "./components/InitNode";
import { defaultEdges } from "./components/edges";
import { HistoryButton } from './components/header'
import { DndPanel } from './components/DndPanel';
import "./components/index.less";
import { NodeClick } from "./components/NodeClick";
import { KeyboardBehavior } from "./components/KeyboardBehavior";
import type { Cell } from '@antv/x6';

const ConductorWorkflowGraph: React.FC = () => {
  return (
    <div className="xflow-guide">
      <XFlow>
        <HistoryButton />
        <History />
        <Clipboard useLocalStorage />
        <div className="xflow-container">
          <DndPanel />
          <XFlowGraph
            className="xflow-graph"
            zoomable
            minScale={0.5}
            pannable
            panOptions={{
              eventTypes: ["leftMouseDown"],
            }}
            connectionOptions={{
              snap: true,
              allowBlank: false,
              allowLoop: false,
              allowNode: false,
              allowEdge: false,
              allowMulti: false,
              allowPort: true,
              highlight: true,
              anchor: "center",
              connectionPoint: 'anchor',
              connector: "rounded",
              validateConnection(graph) {
                // 1. 仅允许 out -> in 的连接
                const sourceGroup = graph.sourcePort
                const targetGroup = graph.targetPort
                const targetCell = graph.targetCell
                // 检查连接是否合法（output -> input）
                const isValidConnection = sourceGroup?.includes('output') && targetGroup?.includes('input') || false
                if (!isValidConnection) {
                  return false
                }
                // 2. 检查input是否已经连接
                // 使用graph对象获取目标端口的连接信息
                const targetPortId = graph.targetPort
                const connectedEdges = this.getConnectedEdges(targetCell as Cell, {
                  incoming: true,
                  outgoing: false
                })
                // 检查是否已有边连接到该input端口
                const hasConnection = connectedEdges.some(edge => {
                  return edge.getTargetPortId() === targetPortId
                })
                if (hasConnection) {
                  return false
                }

                return true
              },
            }}
            connectionEdgeOptions={{
              ...defaultEdges,
            }}
            selectOptions={{
              multiple: true,
              strict: true,
              rubberband: false,
              showNodeSelectionBox: true,
            }}
            magnetAdsorbedHighlightOptions={{
              name: 'stroke',
              args: {
                attrs: {
                  fill: '#5F95FF',
                  stroke: '#5F95FF',
                },
              },
            }}
          />
          <Grid type="mesh" options={{ color: '#ccc', thickness: 1 }} />
          <Background color="#F2F7FA" />
          <div className="control-bar">
            <Control
              items={['zoomOut', 'zoomTo', 'zoomIn', 'zoomToFit', 'zoomToOrigin']}
              direction='horizontal'
              placement='top'
            />
          </div>
          <Snapline sharp />
          <InitNode />
          <NodeClick />
          <KeyboardBehavior />
        </div>
      </XFlow>
    </div>
  );
};

export default ConductorWorkflowGraph;
