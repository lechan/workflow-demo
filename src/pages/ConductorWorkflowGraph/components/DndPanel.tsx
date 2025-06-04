import { useDnd } from '@antv/xflow'
import { useAppContext } from './AppContext'
import './index.less'
import React, { useState } from 'react'
import { Space } from 'antd'
import SelectHistoryTask from './SelectHistoryTask'
import { defaultNodes, forkNodes, joinNodes, endNodes } from './nodes'
import { defaultPorts, forkPorts, joinPorts, endPorts } from './ports'
import { v4 as uuidv4 } from 'uuid'

interface NodeType {
  id: string
  label: string
  icon: string
  background: string
}

interface DndPanelProps {
  hasSaved?: boolean;
}

const DndPanel: React.FC<DndPanelProps> = () => {
  const { globalState } = useAppContext(); // 获取全局 state
  const { hasSaved } = globalState;
  const { startDrag } = useDnd()
  const nodeTypes: NodeType[] = [
    {
      id: 'Shell',
      label: 'Shell',
      icon: '⌨️',
      background: '#f0f0f0'
    },
    {
      id: 'Python',
      label: 'Python',
      icon: '🐍',
      background: '#e6f7ff'
    },
    {
      id: 'PromQL',
      label: 'PromQL',
      icon: '📊',
      background: '#f6ffed'
    },
    {
      id: 'LocalFile',
      label: '本地文件',
      icon: '📁',
      background: '#f9f0ff'
    },{
      id: 'RemoteFile',
      label: '远程抓取',
      icon: '☁️',
      background: '#e6fffb'
    }
  ]

  const functionNodeTypes: NodeType[] = [
    {
      id: 'fork',
      label: '分支节点',
      icon: '🔧',
      background: '#f6ffed'
    },
    {
      id: 'join',
      label: '汇聚节点',
      icon: '🔗',
      background: '#fff7e6'
    },
    {
      id: 'end',
      label: '结束',
      icon: '🏁',
      background: '#fff1f0'
    }
  ]

  const handleMouseDown = (
    e: React.MouseEvent<Element, MouseEvent>,
    node: NodeType,
  ) => {
    if (!hasSaved) {
      startDrag(
        {
          id: uuidv4(),
          label: node.label,
          nodeType: node.id,
          ...defaultNodes,
          attrs: {
            ...defaultNodes.attrs,
            label: {
              ...defaultNodes.attrs.label,
              text: node.icon + node.label,
            },
            header: {
              ...defaultNodes.attrs.header,
              fill: node.background,
            },
            nodeName: {
              ...defaultNodes.attrs.nodeName,
              text: '未命名'
            }
          },
          ports: {
            ...defaultPorts,
          },
          // draggable: hasSaved,
          tools: [
            {
              name: 'button-remove',
              args: {
                x: '100%',
                y: 0,
                offset: { x: 0, y: 0 },
              },
            },
          ],
        },
        e,
      )
    }
  }

  const functionNode = {
    'fork': forkNodes,
    'join': joinNodes,
    'end': endNodes
  }

  const functionPort = {
    'fork': forkPorts,
    'join': joinPorts,
    'end': endPorts
  }

  const handleSelectFunctionNode = (
    e: React.MouseEvent<Element, MouseEvent>,
    node: NodeType,
  ) => {
    if (!hasSaved) {
      startDrag(
        {
          id: node.id === 'end' ? 'end' : uuidv4(),
          label: node.label,
          ...functionNode[node.id as keyof typeof functionNode],
          nodeType: node.id,
          // draggable: hasSaved,
          ports: {
            ...functionPort[node.id as keyof typeof functionNode],
          }
        },
        e,
      )
    }
  }

  const [historyTaskVisible, setHistoryTaskVisible] = useState(false);

  const showHistoryTask = () => {
    setHistoryTaskVisible(true);
  };

  const handleHistoryTaskClose = () => {
    setHistoryTaskVisible(false);
  };

  return (
    <div className="workflow-dnd-panel">
      <h3>导入作业</h3>
      <Space direction="vertical" style={{ marginBottom: '20px' }}>
        <div
          className={hasSaved ? 'dnd-item disabled' : 'dnd-item'}
          style={{ background: '#f0f7ff', cursor: 'pointer' }}
          onClick={showHistoryTask}
        >📦 作业集</div>
      </Space>
      <h3>程序节点</h3>
      <Space direction="vertical" style={{ marginBottom: '20px' }}>
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            className={hasSaved ? 'dnd-item disabled' : 'dnd-item'}
            style={{ background: node.background }}
            onMouseDown={(e) => handleMouseDown(e, node)}
          >
            {node.icon} {node.label}
          </div>
        ))}
      </Space>
      <h3>功能节点</h3>
      <Space direction="vertical">
        {functionNodeTypes.map((node) => (
          <div
            key={node.id}
            className={hasSaved ? 'dnd-item disabled' : 'dnd-item'}
            style={{ background: node.background }}
            onMouseDown={(e) => handleSelectFunctionNode(e, node)}
          >
            {node.icon} {node.label}
          </div>
        ))}
      </Space>
      <SelectHistoryTask
        visible={historyTaskVisible}
        onClose={handleHistoryTaskClose}
      />
    </div>
  )
}

export { DndPanel }