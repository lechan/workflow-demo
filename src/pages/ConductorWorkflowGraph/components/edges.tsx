import { Graph } from '@antv/x6'
Graph.registerEdgeTool('edge-remove', {
  inherit: 'button',
  markup: [
    {
      tagName: 'circle',
      selector: 'button',
      attrs: {
        r: 8,
        fill: '#f5222d',
        cursor: 'pointer',
        stroke: '#fff',
      },
    },
    {
      tagName: 'text',
      textContent: '×',
      selector: 'icon',
      attrs: {
        fill: '#fff',
        fontSize: 10,
        textAnchor: 'middle',
        pointerEvents: 'none',
        y: '0.3em',
      },
    },
  ],
  distance: '50%',
  // @ts-ignore
  onClick({ cell }) {
    cell.remove()
  },
})

export const defaultEdges = {
  connector: { name: 'smooth' },
  sourcePort: 'output',
  targetPort: 'input',
  attrs: {
    line: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
      targetMarker: {
        name: 'block',
        size: 4,
      },
    },
  },
}
