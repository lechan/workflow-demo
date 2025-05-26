import { useGraphStore, useGraphInstance } from '@antv/xflow'
import { useEffect, useCallback } from 'react'
import { startNodes } from './nodes'
import { startPorts } from './ports'
// import { defaultEdges } from './edges'

export const InitNode = () => {
  const graph = useGraphInstance()
  const initData = useGraphStore((state) => state.initData)
  const getStorageData = JSON.parse(localStorage.getItem('graphData') || 'null')
  const setInitData = useCallback(() => {
    initData({
      nodes: [
        {
          id: 'start',
          label: '开始',
          x: 100,
          y: 50,
          ...startNodes,
          ports: {
            ...startPorts,
          }
        },],
      edges: [],
    })
  }, [initData])

  // 处理边的选中／取消选中，动态添加或移除删除按钮
  graph?.on('edge:selected', ({ cell }) => {
    cell.addTools([{
      name: 'edge-remove',
      args: { distance: '50%' },  // 或 0.5
    }])
  })

  graph?.on('edge:unselected', ({ cell }) => {
    if (cell.hasTool('edge-remove')) {
      cell.removeTool('edge-remove')
    }
  })

  useEffect(() => {
    if (getStorageData !== null) {
      graph?.fromJSON(getStorageData)
    } else {
      setInitData()
    }
  }, [setInitData, getStorageData, graph])

  return null
}