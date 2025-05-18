import { XFlow, XFlowGraph, Grid, Background, Snapline, History, Clipboard, Control } from "@antv/xflow";
import { InitNode } from "./InitNode";
import { defaultEdges } from "./edges";
import { HistoryButton } from './header'
import { DndPanel } from './DndPanel';
import "./index.less";
import { NodeClick } from "./NodeClick";
import { KeyboardBehavior } from "./KeyboardBehavior";

const ConductorWorkflowGraph = () => {
  
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
              validateConnection({ sourcePort, targetPort }) {
                // 仅允许 out -> in 的连接
                const sourceGroup = sourcePort
                const targetGroup = targetPort
                return sourceGroup?.includes('output') && targetGroup?.includes('input') || false
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
