import React, { useState } from "react";
import {
  useHistory,
  useClipboard,
  useGraphInstance,
  useGraphStore,
} from "@antv/xflow";
import { Button, Space, Select, Input, Modal } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import type { Workflow, Task, WorkflowRawData, Node, Edge } from "./types";
import { startNodes } from "./nodes";
import { startPorts } from "./ports";
import dayjs from "dayjs";

function convertWorkflow(
  workflowRawData: WorkflowRawData,
  workflowName = '',
  systemName = ''
): Workflow {
  const cells = workflowRawData.graphData.cells;
  const nodes = cells.filter((c) => c.shape === "rect" && c.nodeType) as Node[];
  const edges = cells.filter((c) => c.shape === "edge") as Edge[];

  // 构造子节点映射（source -> [target]）和父节点映射（target -> [source]）
  const childrenMap: Record<string, string[]> = {};
  const parentMap: Record<string, string[]> = {};
  edges.forEach((edge) => {
    const src = edge.source.cell;
    const tgt = edge.target.cell;
    if (!childrenMap[src]) childrenMap[src] = [];
    childrenMap[src].push(tgt);
    if (!parentMap[tgt]) parentMap[tgt] = [];
    parentMap[tgt].push(src);
  });

  // 构造节点映射 id -> Node
  const nodeMap: Record<string, Node> = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  // 找到起始节点：优先找 "start" 的直接子节点，否则找无父节点的节点
  let startId: string | undefined;
  if (childrenMap['start'] && childrenMap['start'].length > 0) {
    startId = childrenMap['start'][0];
  } else {
    startId = Object.keys(nodeMap).find((id) => !parentMap[id]);
  }

  const tasks: Task[] = [];

  // 递归收集分支任务（支持嵌套 fork）
  function gatherBranch(startNodeId: string): { tasks: Task[]; endRef: string | undefined; next: string | undefined } {
    const branchTasks: Task[] = [];
    let branchEndRef: string | undefined = undefined;
    let currentId: string | undefined = startNodeId;
    while (currentId) {
      const node = nodeMap[currentId];
      if (!node || !node.nodeType) break;
      const type = node.nodeType.toLowerCase();
      // 遇到 join 表示分支结束
      if (type === 'join') {
        break;
      }
      // 遇到嵌套 fork，递归处理该 fork
      if (type === 'fork') {
        const forkResult = processFork(currentId);
        // 将嵌套 fork 和嵌套 join 插入分支任务中
        branchTasks.push(forkResult.forkTask);
        branchTasks.push(forkResult.joinTask);
        // 嵌套分支在嵌套 join 后结束
        branchEndRef = forkResult.joinTask.taskReferenceName;
        currentId = forkResult.next;
        continue;
      }
      // 忽略 start/end
      if (type === 'start' || type === 'end') break;
      // 普通任务
      branchTasks.push({
        name: node.nodeType,
        taskReferenceName: node.id,
        type: node.nodeType.toUpperCase() as Task['type'],
      });
      branchEndRef = node.id;
      const nextIds = childrenMap[currentId] || [];
      if (nextIds.length === 1) {
        currentId = nextIds[0];
      } else {
        // 无后续或多后续时结束
        break;
      }
    }
    return { tasks: branchTasks, endRef: branchEndRef, next: currentId };
  }

  // 处理 fork 节点：收集所有分支的任务，生成 forkTask 和 joinTask
  function processFork(forkId: string): { forkTask: Task; joinTask: Task; next: string | undefined } {
    // 按输出端口顺序排序 fork 边，以保证分支顺序
    const forkEdges = edges.filter((e) => e.source.cell === forkId);
    forkEdges.sort((a, b) => {
      const pa = a.source.port;
      const pb = b.source.port;
      const na = pa.match(/\d+/)?.[0] || '';
      const nb = pb.match(/\d+/)?.[0] || '';
      return na.localeCompare(nb, undefined, { numeric: true });
    });
    const forkTasksArr: Task[][] = [];
    const branchEnds: string[] = [];
    // 收集每个分支的任务序列和末尾任务
    forkEdges.forEach((edge) => {
      const childId = edge.target.cell;
      const branchResult = gatherBranch(childId);
      forkTasksArr.push(branchResult.tasks);
      // 如果分支没有任何任务，视为节点本身
      branchEnds.push(branchResult.endRef || childId);
    });
    // 找到所有分支末尾共同指向的节点作为 join 节点
    let joinId: string | undefined;
    if (branchEnds.length > 0) {
      const common = branchEnds
        .map((end) => new Set(childrenMap[end] || []))
        .reduce((acc, set) => (acc === null ? set : new Set([...acc].filter((x) => set.has(x)))), null as Set<string> | null);
      if (common && common.size > 0) {
        joinId = common.values().next().value;
      }
    }
    const nextAfterJoin = joinId ? (childrenMap[joinId] || [undefined])[0] : undefined;
    const forkTask: Task = {
      name: 'fork',
      taskReferenceName: forkId,
      type: 'FORK',
      forkTasks: forkTasksArr,
    };
    const joinTask: Task = {
      name: 'join',
      taskReferenceName: joinId as string,
      type: 'JOIN',
      joinOn: branchEnds,
    };
    return { forkTask, joinTask, next: nextAfterJoin };
  }

  // 从起始节点开始遍历构建任务序列
  let currentId = startId;
  while (currentId) {
    const node = nodeMap[currentId];
    if (!node || !node.nodeType) break;
    const type = node.nodeType.toLowerCase();
    if (type === 'fork') {
      // 处理 fork，插入 forkTask 和 joinTask
      const forkResult = processFork(currentId);
      tasks.push(forkResult.forkTask);
      tasks.push(forkResult.joinTask);
      currentId = forkResult.next;
      continue;
    }
    if (type === 'join') {
      // 遇到 join（应在 fork 中已处理），跳过
      currentId = (childrenMap[currentId] || [undefined])[0];
      continue;
    }
    if (type === 'start') {
      currentId = (childrenMap[currentId] || [undefined])[0];
      continue;
    }
    if (type === 'end') {
      break;
    }
    // 普通线性任务
    tasks.push({
      name: node.nodeType,
      taskReferenceName: node.id,
      type: node.nodeType.toUpperCase() as Task['type'],
    });
    const nextIds = childrenMap[currentId] || [];
    if (nextIds.length === 1) {
      currentId = nextIds[0];
    } else {
      break;
    }
  }

  return {
    name: workflowName,
    tasks: tasks,
    systemName: systemName,
    rawData: JSON.stringify(workflowRawData),
  };
}


export const HandlerArea: React.FC<{
  options: { readonly: boolean };
  setOptions: (options: { readonly: boolean }) => void;
}> = ({
  options,
  setOptions,
}: {
  options: { readonly: boolean };
  setOptions: (options: { readonly: boolean }) => void;
}) => {
  const graph = useGraphInstance();
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { copy, paste } = useClipboard();
  const [systemName, setSystemName] = useState('');
  const systemOptions = [
    {
      value: "conductor",
      label: "Conductor",
    },
    {
      value: "airflow",
      label: "Airflow",
    },
  ];
  const [workflowName, setWorkflowName] = useState(
    `新建作业${dayjs().format("YYYYMMDDHHmmss")}`
  );
  const [isEditName, setIsEditName] = useState(false);
  const handleChangeSystem = (value: string) => {
    if (systemName === '') {
      setSystemName(value)
    } else {
      const { confirm } = Modal
      confirm({
        title: '该操作会重置画布内容，请确认?',
        icon: <ExclamationCircleFilled />,
        onOk() {
          setSystemName(value)
          reset()
        },
        onCancel() {
          console.log('Cancel')
        },
      })
    }
  }
  const saveWorkflowName = () => {
    setIsEditName(false);
  };
  const editWorkflowName = () => {
    setIsEditName(true);
  };

  const [hasSaved, setHasSaved] = useState(false);
  const nodes = useGraphStore((state) => state.nodes);
  const setInitData = useGraphStore((state) => state.initData);
  const onCopy = () => {
    const selected = nodes.filter((node) => node.selected);
    const ids: string[] = selected.map((node) => node.id || "");
    copy(ids);
  };

  const validateWorkflow = () => {
    if (!graph) return { isValid: false, error: '图形实例未初始化' };

    const nodes = graph.getNodes();
    // const edges = graph.getEdges();

    // 1. 检查所有端口是否都有连接
    let unconnectedPorts = false;
    let unconnectedPortNodeId = '';
    nodes.forEach(node => {
      const ports = node.getPorts();
      ports.forEach(port => {
        const connectedEdges = graph.getConnectedEdges(node, { portId: port.id });
        if (connectedEdges.length === 0) {
          unconnectedPorts = true;
          unconnectedPortNodeId = node.id;
        }
      });
    });
    if (unconnectedPorts) {
      return { isValid: false, error: `节点 ${unconnectedPortNodeId} 存在未连接的端口` };
    }

    // 2. 检查是否有end节点
    const hasEndNode = nodes.some(node => node.store?.data?.nodeType === 'end');
    if (!hasEndNode) {
      return { isValid: false, error: '工作流缺少结束节点' };
    }

    // 3. 检查是否有至少一个程序节点
    const programNodes = ['shell', 'python', 'promql'];
    const hasProgramNode = nodes.some(node => {
      const nodeType = node.store?.data?.nodeType?.toLowerCase()
      return programNodes.includes(nodeType);
    });
    if (!hasProgramNode) {
      return { isValid: false, error: '工作流至少需要一个程序节点（shell、python或promql）' };
    }

    return { isValid: true };
  };

  const save = () => {
    console.log("保存");
    
    // 验证工作流
    const validation = validateWorkflow();
    if (!validation.isValid) {
      Modal.error({
        title: '保存失败提醒',
        content: validation.error,
      });
      return;
    }

    setHasSaved(true);
    // 重置所有节点和边的状态样式
    if (graph) {
      // graph.getNodes().forEach((node) => {
      //   node.setAttrByPath("header/fill", "#f5f5f5");
      //   node.setAttrByPath("statusIndicator/fill", "#f5f5f5");
      // });

      graph.getEdges().forEach((edge) => {
        edge.setAttrByPath("line/stroke", "#A2B1C3");
        edge.setAttrByPath("line/strokeWidth", 1);
        edge.setAttrByPath("line/strokeDasharray", null);
      });
    }

    const graphData = graph?.toJSON();
    localStorage.setItem("graphData", JSON.stringify(graphData));
    console.log(graphData);
    const workflowData = convertWorkflow(
      { graphData: graphData } as WorkflowRawData,
      workflowName,
      systemName
    );
    console.log(workflowData);
    setOptions({ readonly: true });
  };
  const onPaste = () => {
    paste({ offset: 50 });
  };
  const edit = () => {
    console.log("编辑");
    setOptions({ readonly: false });
    setHasSaved(false);
  };
  const reset = () => {
    console.log("重置");
    localStorage.removeItem("graphData");
    setInitData({
      nodes: [
        {
          id: "start",
          label: "开始",
          x: 100,
          y: 50,
          ...startNodes,
          ports: {
            ...startPorts,
          },
        },
      ],
      edges: [],
    });
    // 清空history
    graph?.cleanHistory();
    setHasSaved(false);
  };
  const initMockNodeStatus = () => {
    const nodes = graph?.getNodes();
    if (nodes && nodes.length) {
      console.log(nodes);
      return nodes.map((node, index) => {
        if (node.id === 'start') {
          return { id: 'start', status: "success" };
        } else if (node.id === 'end') {
          return { id: 'end', status: "running" };
        } else {
          if (index < nodes.length - 3) {
            return { id: node.id, status: "success" };
          } else if (index === nodes.length - 2) {
            return { id: node.id, status: "running" };
          } else {
            return { id: node.id, status: "success" };
          }
        }
      })
    } else {
      return []
    }
  };
  const run = () => {
    console.log("执行");
    setHasSaved(true);
    const mockNodeStatus = initMockNodeStatus();
    const statusColor = {
      success: "#95de64",
      failure: "#ff7875",
      running: "#69c0ff",
    };
    const graphAddStatus = () => {
      if (!graph) return;

      // 首先清除所有边的动画样式
      graph.getEdges().forEach((edge) => {
        edge.setAttrByPath("line/stroke", "#A2B1C3");
      });

      mockNodeStatus.forEach(({ id, status }) => {
        const node = graph.getCellById(id);
        if (node) {
          node.setData({
            ...node.getData(),
            status,
          });

          node.setAttrByPath(
            "header/fill",
            statusColor[status as keyof typeof statusColor] || "#f5f5f5"
          );
          node.setAttrByPath(
            "statusIndicator/fill",
            statusColor[status as keyof typeof statusColor] || "#f5f5f5"
          );

          // 如果是running状态的节点，处理其前置边
          if (status === "success") {
            const incomingEdges = graph.getIncomingEdges(node);
            incomingEdges?.forEach((edge) => {
              edge.setAttrByPath("line/stroke", statusColor["success"]);
              edge.setAttrByPath("line/strokeWidth", 2);
            });
          } else if (status === "failure") {
            const incomingEdges = graph.getIncomingEdges(node);
            const outgoingEdges = graph.getOutgoingEdges(node);
            incomingEdges?.forEach((edge) => {
              edge.setAttrByPath("line/stroke", statusColor["failure"]);
              edge.setAttrByPath("line/strokeWidth", 2);
            });
            outgoingEdges?.forEach((edge) => {
              edge.setAttrByPath("line/stroke", statusColor["failure"]);
              edge.setAttrByPath("line/strokeWidth", 2);
            });
          } else if (status === "running") {
            const incomingEdges = graph.getIncomingEdges(node);
            incomingEdges?.forEach((edge) => {
              edge.setAttrByPath("line/stroke", statusColor["running"]);
              edge.setAttrByPath("line/strokeWidth", 2);
              edge.setAttrByPath("line/strokeDasharray", "5,5");
            });
          }
        }
      });
    };

    graphAddStatus();

    // 画布设置只读
    // setOptions({ readonly: true })
  };
  return (
    <div className="xflow-header">
      <Space>
        <Select
          placeholder="请选择业务系统"
          style={{ width: 150 }}
          options={systemOptions}
          allowClear
          onChange={handleChangeSystem}
        ></Select>
        <Input.Group compact style={{ display: "flex" }}>
          <Input readOnly={!isEditName} style={{ width: 200 }} value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
          {isEditName ? (
            <Button
              onClick={saveWorkflowName}
              icon={<SaveOutlined />}
              type="primary"
            ></Button>
          ) : (
            <Button
              onClick={editWorkflowName}
              icon={<EditOutlined />}
              type="primary"
            ></Button>
          )}
        </Input.Group>

        <Button onClick={undo} disabled={!canUndo} icon={<UndoOutlined />}>
          撤销操作
        </Button>
        <Button onClick={redo} disabled={!canRedo} icon={<RedoOutlined />}>
          还原操作
        </Button>
        {!options.readonly && (
          <>
            <Button
              onClick={onCopy}
              disabled={!nodes.some((n) => n.selected)}
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
        {options.readonly ? (
          <Button onClick={edit} icon={<EditOutlined />} type="primary">
            编辑
          </Button>
        ) : (
          <Button onClick={save} icon={<SaveOutlined />} type="primary">
            保存
          </Button>
        )}
        <Button onClick={reset} icon={<DeleteOutlined />} danger>
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
  );
};
