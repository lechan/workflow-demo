import React, { useEffect, useState } from 'react';
import { XFlow, XFlowGraph, Grid, Background, Snapline, History, Clipboard, Control } from "@antv/xflow";
import { LockOutlined } from '@ant-design/icons';
import { InitNode } from "./components/InitNode";
import { defaultEdges } from "./components/edges";
import { HandlerArea } from './components/HandlerArea'
import { DndPanel } from './components/DndPanel';
import { AppProvider } from './components/AppContext';
import { NodeClick } from "./components/NodeClick";
import { KeyboardBehavior } from './components/KeyboardBehavior';
import { Tips } from './components/Tips';
import type { Cell } from '@antv/x6';
import "./components/index.less";

const ConductorWorkflowGraph: React.FC = () => {
  const query = new URLSearchParams(window.location.search);
  const type = query.get('type');
  const [options, setOptions] = useState({
    readonly: !!type,
  });
  const [systemName, setSystemName] = useState('');
  useEffect(() => {
    console.log(options)
  }, [options])
  return (
    <AppProvider>
      <div className="xflow-guide">
        <XFlow key={options.readonly}>
          <HandlerArea
            options={options}
            setOptions={setOptions}
            systemName={systemName}
            setSystemName={setSystemName}
          />
          <History />
          <Clipboard useLocalStorage />
          <div className="xflow-container">
            {!systemName && (
              <div className="disabled-cover">
                <LockOutlined className="lock-icon" />
                请先选择作业所属业务系统
              </div>
            )}
            <DndPanel />
            <XFlowGraph
              className="xflow-graph"
              zoomable
              minScale={0.5}
              readonly={options.readonly}
              pannable
              panOptions={{
                eventTypes: ["leftMouseDown"],
                modifiers: ['ctrl']
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
              selectOptions={options.readonly ? {
                multiple: false,
                rubberband: false,
                showNodeSelectionBox: false,
              } : {
                multiple: true,
                rubberband: true,
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
            <Tips />
          </div>
        </XFlow>
      </div>
    </AppProvider>
  );
};

export default ConductorWorkflowGraph;
