import { useHistory, useClipboard, useGraphInstance, useGraphStore } from '@antv/xflow'
import { Button, Space } from 'antd'

export const HistoryButton = () => {
  const graph = useGraphInstance()
  const { undo, redo, canUndo, canRedo } = useHistory()
  const { copy, paste } = useClipboard()
  const nodes = useGraphStore((state) => state.nodes)
  const onCopy = () => {
    const selected = nodes.filter((node) => node.selected)
    const ids: string[] = selected.map((node) => node.id || '')
    copy(ids)
  }
  const save = () => {
    console.log('保存')
    const graphData = graph?.toJSON()
    localStorage.setItem('graphData', JSON.stringify(graphData))
    console.log(graphData)
  }
  const onPaste = () => {
    paste({ offset: 50 })
  }
  return (
    <div className="xflow-header">
      <Space>
        <Button onClick={onCopy}>
          复制节点
        </Button>
        <Button onClick={onPaste}>
          粘贴节点
        </Button>
        <Button onClick={undo} disabled={!canUndo}>
          撤销
        </Button>
        <Button onClick={redo} disabled={!canRedo}>
          还原
        </Button>
        <Button onClick={save}>
          保存
        </Button>
      </Space>
    </div>
  )
}