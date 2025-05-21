import { useState } from 'react'
import { useHistory, useClipboard, useGraphInstance, useGraphStore } from '@antv/xflow'
import { Button, Space } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined, PlayCircleOutlined, RedoOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import type { Workflow, Task, WorkflowRawData, Node, Edge } from './types'
import { startNodes } from './nodes'
import { startPorts } from './ports'

function convertWorkflow(workflowRawData: WorkflowRawData, workflowName = ''): Workflow {
  const cells = workflowRawData.graphData.cells;
  const nodes = cells.filter((c) => c.shape === 'rect' && c.nodeType) as Node[];
  const edges = cells.filter((c) => c.shape === 'edge') as Edge[];

  const childrenMap: Record<string, string[]> = {};
  edges.forEach((edge) => {
    const src = edge.source.cell;
    const tgt = edge.target.cell;
    if (!childrenMap[src]) childrenMap[src] = [];
    childrenMap[src].push(tgt);
  });

  const nodeMap: Record<string, Node> = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  // 找到 fork 和 join 节点（如果存在）
  const forkNode = nodes.find((n) => n.nodeType?.toLowerCase() === 'fork');
  const joinNode = nodes.find((n) => n.nodeType?.toLowerCase() === 'join');
  const forkId = forkNode?.id;
  const joinId = joinNode?.id;

  // 递归收集单条分支的任务（不包括 join 节点）
  function gatherBranchTasks(
    nodeId: string,
    branchTasks: Task[],
    branchEndRefs: string[]
  ): void {
    const node = nodeMap[nodeId];
    if (!node || !node.nodeType) return;

    const type = node.nodeType;
    // 添加当前节点任务
    branchTasks.push({
      name: type,
      taskReferenceName: nodeId,
      type: type.toUpperCase() as Task['type'],
    });

    // 查看下一步
    const nextIds = childrenMap[nodeId] || [];
    if (nextIds.length === 1) {
      const nextId = nextIds[0];
      const nextNode = nodeMap[nextId];
      // 如果下一节点是 join，则将当前节点视为分支末尾
      if (nextNode?.nodeType?.toLowerCase() === 'join') {
        branchEndRefs.push(nodeId);
      } else {
        gatherBranchTasks(nextId, branchTasks, branchEndRefs);
      }
    } else {
      // 无后继或多后继（不再深入）
      branchEndRefs.push(nodeId);
    }
  }

  const tasks: Task[] = [];

  if (forkId) {
    const forkChildren = childrenMap[forkId] || [];
    const forkTasks: Task[][] = [];
    const branchEnds: string[] = [];

    forkChildren.forEach((childId) => {
      const branchList: Task[] = [];
      gatherBranchTasks(childId, branchList, branchEnds);
      forkTasks.push(branchList);
    });

    // 插入 FORK
    tasks.push({
      name: 'fork',
      taskReferenceName: forkId,
      type: 'FORK',
      forkTasks: forkTasks,
    });

    // 插入 JOIN
    if (joinId) {
      tasks.push({
        name: 'join',
        taskReferenceName: joinId,
        type: 'JOIN',
        joinOn: branchEnds,
      });
    }
  } else {
    // 无分支：处理线性任务，可按需要实现
  }

  return {
    name: workflowName,
    tasks: tasks,
    systemName: 'conductor',
    rawData: JSON.stringify(workflowRawData),
  };
}

export const HandlerArea = ({ options, setOptions }: { options: { readonly: boolean }, setOptions: (options: { readonly: boolean }) => void }) => {
  const graph = useGraphInstance()
  const { undo, redo, canUndo, canRedo } = useHistory()
  const { copy, paste } = useClipboard()
  const nodes = useGraphStore((state) => state.nodes)
  const setInitData = useGraphStore((state) => state.initData)
  const [hasSaved, setHasSaved] = useState(false);
  const onCopy = () => {
    const selected = nodes.filter((node) => node.selected)
    const ids: string[] = selected.map((node) => node.id || '')
    copy(ids)
  }
  
  const save = () => {
    console.log('保存')
    
    // 重置所有节点和边的状态样式
    if (graph) {
      graph.getNodes().forEach(node => {
        node.setAttrByPath('header/fill', '#f5f5f5')
        node.setAttrByPath('statusIndicator/fill', '#f5f5f5')
      })
      
      graph.getEdges().forEach(edge => {
        edge.setAttrByPath('line/stroke', '#A2B1C3')
        edge.setAttrByPath('line/strokeWidth', 1)
        edge.setAttrByPath('line/strokeDasharray', null)
      })
    }
    
    const graphData = graph?.toJSON()
    localStorage.setItem('graphData', JSON.stringify(graphData))
    console.log(graphData)
    const workflowData = convertWorkflow({ graphData: graphData } as WorkflowRawData, 'test')
    console.log(workflowData)
    setOptions({ readonly: true })
  }
  const onPaste = () => {
    paste({ offset: 50 })
  }
  const edit = () => {
    console.log('编辑')
    setOptions({ readonly: false })
  }
  const reset = () => {
    console.log('重置')
    localStorage.removeItem('graphData')
    setInitData({
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
    // 清空history
    graph?.cleanHistory()
  }
  const run = () => {
    console.log('执行')  
    const mockNodeStatus = [
      { id: 'start', status: 'success' },
      { id: '2d8f4c9a-975f-45d7-9c7b-444383281527', status: 'success' },
      { id: '713ee8b8-d008-4690-9de4-2faa33a7bb79', status: 'success' },
      { id: 'd4394e17-8de1-4f6c-a743-d43ac04507ee', status:'success' },
      { id: '88530115-1907-4143-b871-85696d01d69c', status: 'success' },
      { id: '975315ff-3b57-40c6-8b3c-b06255e198d5', status: 'failure' },
      { id: '3a44d518-96ea-47a1-94fe-3552c121a395', status: 'running' },
    ]
    const statusColor = {
      success: '#95de64',
      failure: '#ff7875',
      running: '#69c0ff'
    }
    const graphAddStatus = () => {
      if (!graph) return
      
      // 首先清除所有边的动画样式
      graph.getEdges().forEach(edge => {
        edge.setAttrByPath('line/stroke', '#A2B1C3')
      })
      
      mockNodeStatus.forEach(({ id, status }) => {
        const node = graph.getCellById(id)
        if (node) {
          node.setData({
            ...node.getData(),
            status
          })
          
          node.setAttrByPath('header/fill', statusColor[status as keyof typeof statusColor] || '#f5f5f5')
          node.setAttrByPath('statusIndicator/fill', statusColor[status as keyof typeof statusColor] || '#f5f5f5')
          
          // 如果是running状态的节点，处理其前置边
          if (status === 'success') {
            const incomingEdges = graph.getIncomingEdges(node)
            incomingEdges?.forEach(edge => {
              edge.setAttrByPath('line/stroke', statusColor['success'])
              edge.setAttrByPath('line/strokeWidth', 2)
            })
          } else if (status === 'failure') {
            const incomingEdges = graph.getIncomingEdges(node)
            const outgoingEdges = graph.getOutgoingEdges(node)
            incomingEdges?.forEach(edge => {
              edge.setAttrByPath('line/stroke', statusColor['failure'])
              edge.setAttrByPath('line/strokeWidth', 2)
            })
            outgoingEdges?.forEach(edge => {
              edge.setAttrByPath('line/stroke', statusColor['failure'])
              edge.setAttrByPath('line/strokeWidth', 2)
            })
          } else if (status === 'running') {
            const incomingEdges = graph.getIncomingEdges(node)
            incomingEdges?.forEach(edge => {
              edge.setAttrByPath('line/stroke', statusColor['running'])
              edge.setAttrByPath('line/strokeWidth', 2)
              edge.setAttrByPath('line/strokeDasharray', '5,5')
            })
          }
        }
      })
    }
    
    graphAddStatus()

    // 画布设置只读
    // setOptions({ readonly: true })
  }
  return (
    <div className="xflow-header">
      <Space>
        {!options.readonly && (
          <>
            <Button 
              onClick={onCopy} 
              disabled={!nodes.some(n => n.selected)}
              icon={<CopyOutlined />}
              type="primary"
              ghost
            >
              复制节点
            </Button>
            <Button 
              onClick={onPaste} 
              icon={<CopyOutlined />}
              type="primary"
              ghost
            >
              粘贴节点
            </Button>
          </>
        )}
        <Button 
          onClick={undo} 
          disabled={!canUndo}
          icon={<UndoOutlined />}
        >
          撤销
        </Button>
        <Button 
          onClick={redo} 
          disabled={!canRedo}
          icon={<RedoOutlined />}
        >
          还原
        </Button>
        {options.readonly ? (
          <Button 
            onClick={edit} 
            icon={<EditOutlined />}
            type="primary"
          >
            编辑
          </Button>
        ) : (
          <Button 
            onClick={() => {
              save();
              setHasSaved(true);
            }} 
            icon={<SaveOutlined />}
            type="primary"
          >
            保存
          </Button>
        )}
        <Button 
          onClick={reset} 
          icon={<DeleteOutlined />}
          danger
        >
          重置
        </Button>
        <Button 
          onClick={run} 
          icon={<PlayCircleOutlined />}
          type="primary"
          disabled={!hasSaved}
        >
          执行
        </Button>
      </Space>
    </div>
  )
}