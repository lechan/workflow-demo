import { useDnd } from '@antv/xflow'
import './index.less'
import React from 'react'
import { Space } from 'antd'
import { defaultNodes, forkNodes, joinNodes, endNodes } from './nodes'
import { defaultPorts, forkPorts, joinPorts, endPorts } from './ports'
import { v4 as uuidv4 } from 'uuid'

interface NodeType {
  id: string
  label: string
  icon: string
  background: string
}

const DndPanel = () => {
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
    }
  ]

  const functionNodeTypes: NodeType[] = [
    {
      id: 'fork',
      label: '分支节点',
      icon: '🔧',
      background: '#fff1f0'
    },
    {
      id: 'join',
      label: '汇聚节点',
      icon: '🔗',
      background: '#e6f7ff'
    },
    {
      id: 'end',
      label: '结束',
      icon: '🏁',
      background: '#e6f7ff'
    }
  ]

  const handleMouseDown = (
    e: React.MouseEvent<Element, MouseEvent>,
    node: NodeType,
  ) => {
    console.log(node.id)
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
        }
      },
      e,
    )
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
    startDrag(
      {
        id: uuidv4(),
        label: node.label,
        ...functionNode[node.id as keyof typeof functionNode],
        nodeType: node.id,
        ports: {
          ...functionPort[node.id as keyof typeof functionNode],
        }
      },
      e,
    )
  }

  return (
    <div className="workflow-dnd-panel">
      <h3>程序节点</h3>
      <Space direction="vertical">
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            className="dnd-item"
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
            className="dnd-item"
            style={{ background: node.background }}
            onMouseDown={(e) => handleSelectFunctionNode(e, node)}
          >
            {node.icon} {node.label}
          </div>
        ))}
      </Space>
    </div>
  )
}

export { DndPanel }