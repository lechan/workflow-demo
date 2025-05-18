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

  useEffect(() => {
    if (getStorageData !== null) {
      graph?.fromJSON(getStorageData)
    } else {
      setInitData()
    }
  }, [setInitData, getStorageData, graph])

  return null
}