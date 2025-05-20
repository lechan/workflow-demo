import { useHistory, useClipboard, useGraphInstance, useGraphStore } from '@antv/xflow'
import { Button, Space } from 'antd'
import type { Workflow, Task, WorkflowRawData, Node, Edge } from './types'

function convertWorkflow(workflowRawData: WorkflowRawData, workflowName = ""): Workflow {
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
      taskReferenceName: `${type}_ref_${nodeId}`,
      type: type.toUpperCase() as Task['type'],
    });

    // 查看下一步
    const nextIds = childrenMap[nodeId] || [];
    if (nextIds.length === 1) {
      const nextId = nextIds[0];
      const nextNode = nodeMap[nextId];
      // 如果下一节点是 join，则将当前节点视为分支末尾
      if (nextNode?.nodeType?.toLowerCase() === 'join') {
        branchEndRefs.push(`${type}_ref_${nodeId}`);
      } else {
        gatherBranchTasks(nextId, branchTasks, branchEndRefs);
      }
    } else {
      // 无后继或多后继（不再深入）
      branchEndRefs.push(`${type}_ref_${nodeId}`);
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
      taskReferenceName: `fork_ref_${forkId}`,
      type: 'FORK',
      forkTasks: forkTasks,
    });

    // 插入 JOIN
    if (joinId) {
      tasks.push({
        name: 'join',
        taskReferenceName: `join_ref_${joinId}`,
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
    const workflowData = convertWorkflow({ graphData: graphData } as WorkflowRawData, 'test')
    console.log(workflowData)
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