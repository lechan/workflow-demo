import { Graph } from '@antv/x6'
export const defaultNodes = {
  width: 180,
  height: 80,
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'rect',
      selector: 'header',
    },
    {
      tagName: 'text',
      selector: 'label',
    },
    {
      tagName: 'text',
      selector: 'nodeName',
    }
  ],
  attrs: {
    body: {
      stroke: '#d9d9d9',
      strokeWidth: 1,
      fill: '#fff',
      rx: 6,
      ry: 6,
      refWidth: '100%',
      refHeight: '100%',
    },
    header: {
      stroke: '#d9d9d9',
      strokeWidth: 1,
      fill: '#f5f5f5',
      rx: 6,
      ry: 6,
      refWidth: '100%',
      height: 32,
    },
    label: {
      fontSize: 16,
      fill: '#333',
      refX: 56,
      refY: 16,
    },
    nodeName: {
      fontSize: 12,
      fill: '#666',
      refX: '20',
      refY: 50,
      style: {
        display: 'block',
        width: '80%',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        textOverflow: 'ellipsis',
      },
    },
  },
}

export const startNodes = {
  shape: 'rect',
  ...defaultNodes,
  width: 50,
  height: 50,
  attrs: {
    body: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
      fill: '#e6f7ff',  // 浅蓝色背景
      rx: 6,
      ry: 6,
    },
  },
}

export const endNodes = {
  width: 50,
  height: 50,
  attrs: {
    body: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
      fill: '#fff1f0',  // 浅红色背景
      rx: 6,
      ry: 6,
    },
  },
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
}

// 在全局注册自定义按钮工具：
Graph.registerNodeTool('outputPortsPlusBtn', {
  inherit: 'button',   // 基于内置 button 工具
  markup: [
    {
      tagName: 'circle',
      selector: 'button',
      attrs: {
        r: 8,
        stroke: '#fe854f',
        fill: '#f0f0f0',
        cursor: 'pointer',
      },
    },
    {
      tagName: 'text',
      textContent: '+',
      selector: 'icon',
      attrs: {
        fill: '#fe854f',
        fontSize: 12,
        fontWeight: 'bold',
        textAnchor: 'middle',
        pointerEvents: 'none',
        y: '0.3em',
      },
    },
  ],
  x: '100%',
  y: '33%',
  offset: { x: -20, y: -10 },
  // @ts-ignore
  onClick: ({ cell }) => {
    const ports = cell.getPorts()
    const outputPorts = ports.filter((port: { group: string }) => port.group === 'output')
    if (outputPorts.length < 10) {
      cell.addPort({
        id: `output${outputPorts.length + 1}`,
        group: 'output',
      })
      // 动态调整节点高度，基础高度120，每个端口增加20的高度
      const newHeight = Math.max(120, 120 + (outputPorts.length + 1) * 20)
      cell.resize(120, newHeight)
    }
  },
}, true)

Graph.registerNodeTool('outputPortsMinusBtn', {
  inherit: 'button',   // 基于内置 button 工具
  markup: [
    {
      tagName: 'circle',
      selector: 'button',
      attrs: {
        r: 8,
        stroke: '#fe854f',
        fill: '#f0f0f0',
        cursor: 'pointer',
      },
    },
    {
      tagName: 'text',
      textContent: '-',
      selector: 'icon',
      attrs: {
        fill: '#fe854f',
        fontSize: 12,
        fontWeight: 'bold',
        textAnchor: 'middle',
        pointerEvents: 'none',
        y: '0.3em',
      },
    },
  ],
  x: '100%',
  y: '66%',
  offset: { x: -20, y: 10 },
  // @ts-ignore
  onClick({ cell }) {
    const ports = cell.getPorts()
    const outputPorts = ports.filter((port: { group: string }) => port.group === 'output')
    if (outputPorts.length > 2) {
      const lastPort = outputPorts[outputPorts.length - 1]
      cell.removePort(lastPort.id)
      // 动态调整节点高度
      const newHeight = Math.max(120, 120 + (outputPorts.length - 1) * 20)
      cell.resize(120, newHeight)
    }
  },
}, true)

Graph.registerNodeTool('inputPortsPlusBtn', {
  inherit: 'button',   // 基于内置 button 工具
  markup: [
    {
      tagName: 'circle',
      selector: 'button',
      attrs: {
        r: 8,
        stroke: '#fe854f',
        fill: '#f0f0f0',
        cursor: 'pointer',
      },
    },
    {
      tagName: 'text',
      textContent: '+',
      selector: 'icon',
      attrs: {
        fill: '#fe854f',
        fontSize: 12,
        fontWeight: 'bold',
        textAnchor: 'middle',
        pointerEvents: 'none',
        y: '0.3em',
      },
    },
  ],
  x: '0%',
  y: '33%',
  offset: { x: 20, y: -10 },
  // @ts-ignore
  onClick({ cell }) {
    const ports = cell.getPorts()
    const inputPorts = ports.filter((port: { group: string }) => port.group === 'input')
    if (inputPorts.length < 10) {
      cell.addPort({
        id: `input${inputPorts.length + 1}`,
        group: 'input',
      })
      // 动态调整节点高度
      const newHeight = Math.max(120, 120 + (inputPorts.length + 1) * 20)
      cell.resize(120, newHeight)
    }
  },
}, true)

Graph.registerNodeTool('inputPortsMinusBtn', {
  inherit: 'button',   // 基于内置 button 工具
  markup: [
    {
      tagName: 'circle',
      selector: 'button',
      attrs: {
        r: 8,
        stroke: '#fe854f',
        fill: '#f0f0f0',
        cursor: 'pointer',
      },
    },
    {
      tagName: 'text',
      textContent: '-',
      selector: 'icon',
      attrs: {
        fill: '#fe854f',
        fontSize: 12,
        fontWeight: 'bold',
        textAnchor: 'middle',
        pointerEvents: 'none',
        y: '0.3em',
      },
    },
  ],
  x: '0%',
  y: '66%',
  offset: { x: 20, y: 10 },
  // @ts-ignore
  onClick: ({ cell }) => {
    const ports = cell.getPorts()
    const inputPorts = ports.filter((port: { group: string }) => port.group === 'input')
    if (inputPorts.length > 2) {
      const lastPort = inputPorts[inputPorts.length - 1]
      cell.removePort(lastPort.id)
      // 动态调整节点高度
      const newHeight = Math.max(120, 120 + (inputPorts.length - 1) * 20)
      cell.resize(120, newHeight)
    }
  },
}, true)

export const forkNodes = {
  width: 120,
  height: 120,
  attrs: {
    body: {
      stroke: '#d9d9d9',
      strokeWidth: 1,
      fill: '#f6ffed',  // 浅绿色背景
      rx: 6,
      ry: 6,
      refWidth: '100%',
      refHeight: '100%',
    },
  },
  tools: [
    {
      name: 'button-remove',
      args: {
        x: '100%',
        y: 0,
        offset: { x: 0, y: 0 },
      },
    },
    {
      name: 'outputPortsPlusBtn'
    },
    {
      name: 'outputPortsMinusBtn',
    },
  ],
}

export const joinNodes = {
  width: 120,
  height: 120,
  attrs: {
    body: {
      stroke: '#d9d9d9',
      strokeWidth: 1,
      fill: '#fff7e6',  // 浅橙色背景
      rx: 6,
      ry: 6,
      refWidth: '100%',
      refHeight: '100%',
    },
  },
  tools: [
    {
      name: 'button-remove',
      args: {
        x: '100%',
        y: 0,
        offset: { x: 0, y: 0 },
      },
    },
    {
      name: 'inputPortsPlusBtn',
    },
    {
      name: 'inputPortsMinusBtn',
    },
  ],
}
