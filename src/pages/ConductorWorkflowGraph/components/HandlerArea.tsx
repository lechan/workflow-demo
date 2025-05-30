/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect, useRef } from 'react';
import {
  useHistory,
  useClipboard,
  useGraphInstance,
  useGraphStore,
} from '@antv/xflow';
import { Button, Space, Select, Input, Modal } from 'antd';
import type { InputRef } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
  ExclamationCircleFilled,
  ArrowLeftOutlined,
  GlobalOutlined,
  SettingOutlined,
  HistoryOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { GlobalVariables } from './ConfigForm/GlobalVariables';
import { BasicConfig } from './ConfigForm/BasicConfig';
import { OperationLog } from './ConfigForm/OperationLog';
import { ExecutionPolicy } from './ConfigForm/ExecutionPolicy';
import type { Workflow, Task, WorkflowRawData, Node, Edge } from './types';
import { startNodes } from './nodes';
import { startPorts } from './ports';
import dayjs from 'dayjs';
import { useAppContext } from './AppContext';

function convertWorkflow(
  workflowRawData: WorkflowRawData,
  workflowName = '',
  systemName = ''
): Workflow {
  const cells = workflowRawData.graphData.cells;
  const nodes = cells.filter((c) => c.shape === 'rect' && c.nodeType) as Node[];
  const edges = cells.filter((c) => c.shape === 'edge') as Edge[];

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

  // 找到起始节点：优先找 'start' 的直接子节点，否则找无父节点的节点
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
        nodeData: JSON.stringify(node.data),
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
      nodeData: JSON.stringify(node.data),
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


import { useNavigate } from 'react-router-dom';

export const HandlerArea: React.FC<{
  options: { readonly: boolean };
  setOptions: (options: { readonly: boolean }) => void;
  systemName: string;
  setSystemName: (name: string) => void;
}> = ({
  options,
  setOptions,
  systemName,
  setSystemName,
}) => {
  const navigate = useNavigate();
  const { globalState, setGlobalState } = useAppContext(); // 获取全局 state
  const { hasSaved } = globalState;
  const graph = useGraphInstance();
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { copy, paste } = useClipboard();

  const systemOptions = [
    {
      value: 'conductor',
      label: 'Conductor',
    },
    {
      value: 'airflow',
      label: 'Airflow',
    },
  ];

  // 从本地存储里提取数据
  const getStorageData = JSON.parse(localStorage.getItem('graphData') || 'null')
  useEffect(() => {
    setSystemName(getStorageData?.systemName);
  }, []);
  const [workflowName, setWorkflowName] = useState(
    getStorageData && getStorageData.workflowName ? 
    getStorageData.workflowName :
    `新建作业${dayjs().format('YYYYMMDDHHmmss')}`
  );
  const [isEditName, setIsEditName] = useState(false);
  const workflowInputRef = useRef<InputRef>(null);
  const handleChangeSystem = (value: string) => {
    console.log(systemName)
    if (!systemName || systemName === '') {
      setSystemName(value)
    } else {
      const { confirm } = Modal
      confirm({
        title: '操作确认',
        content: '该操作会重置画布内容，请确认?',
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
    workflowInputRef.current?.focus({ cursor: 'end'});
  };
  
  const nodes = useGraphStore((state) => state.nodes);
  const setInitData = useGraphStore((state) => state.initData);
  const onCopy = () => {
    const selected = nodes.filter((node) => node.selected);
    const ids: string[] = selected.map((node) => node.id || '');
    copy(ids);
  };

  const validateWorkflow = () => {
    if (!graph) return { isValid: false, error: '图形实例未初始化' };

    const nodes = graph.getNodes();
    // const edges = graph.getEdges();

    // 1. 检查所有端口是否都有连接
    const allEdges = graph.getEdges(); // 拿到全量边
    let badNodeId = '';
    let badNodeName = '';

    // 如果有任何节点的某个端口没连线，直接返回 false
    const hasUnconnected = nodes.some(node => {
      // node.getPorts() 会拿到每个 item，如 { id: 'output1', group: 'output', ... }
      return node.getPorts().some(port => {
        const { id: portId, group } = port;
        // 只关心 input/output 两个分组
        if (group === 'input' || group === 'output') {
          // 看这条边列表里，是否至少有一条边源/目标定位到本 node 且 port === portId
          const isConnected = allEdges.some(edge => {
            const src = edge.getSource();   // { cell: string, port: string, ... }
            const trg = edge.getTarget();
            // @ts-ignore
            return (src.cell === node.id && src.port === portId) || (trg.cell === node.id && trg.port === portId);
          });
          if (!isConnected) {
            badNodeId = node.id;
            // @ts-ignore
            badNodeName = node.store?.data?.data?.name;
            return true;
          }
        }
        // 如果不是 input/output 也不算“未连线”
        return false;
      });
    });

    if (hasUnconnected) {
      return {
        isValid: false,
        error: `节点 "${badNodeName || badNodeId}" 存在未连接的端口`
      };
    }

    // 2. 检查是否有end节点
    // @ts-ignore
    const hasEndNode = nodes.some(node => node.store?.data?.nodeType === 'end');
    if (!hasEndNode) {
      return { isValid: false, error: '工作流缺少结束节点' };
    }

    // 3. 检查是否有至少一个程序节点
    const programNodes = ['Shell', 'Python', 'PromQL', 'LocalFile', 'RemoteFile'];
    const hasProgramNode = nodes.some(node => {
      // @ts-ignore
      const nodeType = node.store?.data?.nodeType
      return programNodes.includes(nodeType);
    });
    if (!hasProgramNode) {
      return { isValid: false, error: '工作流至少需要一个程序节点' };
    }

    // 4. 检查所有程序节点是否都已保存详情
    const unsavedNodes = nodes.filter(node => {
      // @ts-ignore
      const nodeType = node.store?.data?.nodeType;
      // @ts-ignore
      const hasDetailSaved = node.store?.data?.data?.hasDetailSaved;
      return programNodes.includes(nodeType) && !hasDetailSaved;
    });

    // 重置所有节点的边框样式
    nodes.forEach(node => {
      // @ts-ignore
      if (programNodes.includes(node.store?.data?.nodeType)) {
        node.setAttrByPath('body/stroke', '#d9d9d9');
        node.setAttrByPath('body/strokeWidth', 1);
      }
    });

    if (unsavedNodes.length > 0) {
      // 为未保存的节点添加红色边框
      unsavedNodes.forEach(node => {
        node.setAttrByPath('body/stroke', '#ff4d4f');
        node.setAttrByPath('body/strokeWidth', 2);
      });
      return { isValid: false, error: '画布中标红的节点详情配置尚未保存' };
    }

    return { isValid: true };
  };

  const save = () => {
    console.log('保存');
    
    // 验证工作流
    const validation = validateWorkflow();
    if (!validation.isValid) {
      Modal.error({
        title: '保存失败提醒',
        content: validation.error,
      });
      return;
    }

    setGlobalState(prev => ({ ...prev, hasSaved: true })); // 更新全局 hasSaved
    // 重置所有节点和边的状态样式
    if (graph) {
      // graph.getNodes().forEach((node) => {
      //   node.setAttrByPath('header/fill', '#f5f5f5');
      //   node.setAttrByPath('statusIndicator/fill', '#f5f5f5');
      // });

      graph.getEdges().forEach((edge) => {
        edge.setAttrByPath('line/stroke', '#A2B1C3');
        edge.setAttrByPath('line/strokeWidth', 1);
        edge.setAttrByPath('line/strokeDasharray', null);
      });
    }

    const graphData = graph?.toJSON();
    // @ts-ignore
    graphData['systemName'] = systemName;
    // @ts-ignore
    graphData['workflowName'] = workflowName;
    localStorage.setItem('graphData', JSON.stringify(graphData));
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
    console.log('编辑');
    setOptions({ readonly: false });
    setGlobalState(prev => ({ ...prev, hasSaved: false })); // 更新全局 hasSaved
  };
  const reset = () => {
    console.log('重置');
    localStorage.removeItem('graphData');
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
          },
        },
      ],
      edges: [],
    });
    // 清空history
    graph?.cleanHistory();
    setGlobalState(prev => ({ ...prev, hasSaved: false })); // 更新全局 hasSaved
  };
  const initMockNodeStatus = () => {
    const nodes = graph?.getNodes();
    if (nodes && nodes.length) {
      console.log(nodes);
      return nodes.map((node, index) => {
        if (node.id === 'start') {
          return { id: 'start', status: 'success' };
        } else if (node.id === 'end') {
          return { id: 'end', status: 'running' };
        } else {
          if (index < nodes.length - 3) {
            return { id: node.id, status: 'success' };
          } else if (index === nodes.length - 2) {
            return { id: node.id, status: 'running' };
          } else {
            return { id: node.id, status: 'success' };
          }
        }
      })
    } else {
      return []
    }
  };
  const run = () => {
    console.log('执行');
    setGlobalState(prev => ({ ...prev, hasSaved: true })); // 更新全局 hasSaved
    const mockNodeStatus = initMockNodeStatus();
    const statusColor = {
      success: '#95de64',
      failure: '#ff7875',
      running: '#69c0ff',
    };
    const graphAddStatus = () => {
      if (!graph) return;

      // 首先清除所有边的动画样式
      graph.getEdges().forEach((edge) => {
        edge.setAttrByPath('line/stroke', '#A2B1C3');
      });

      mockNodeStatus.forEach(({ id, status }) => {
        const node = graph.getCellById(id);
        if (node) {
          node.setData({
            ...node.getData(),
            status,
          });

          node.setAttrByPath(
            'header/fill',
            statusColor[status as keyof typeof statusColor] || '#f5f5f5'
          );
          node.setAttrByPath(
            'statusIndicator/fill',
            statusColor[status as keyof typeof statusColor] || '#f5f5f5'
          );

          // 如果是running状态的节点，处理其前置边
          if (status === 'success') {
            const incomingEdges = graph.getIncomingEdges(node);
            incomingEdges?.forEach((edge) => {
              edge.setAttrByPath('line/stroke', statusColor['success']);
              edge.setAttrByPath('line/strokeWidth', 2);
            });
          } else if (status === 'failure') {
            const incomingEdges = graph.getIncomingEdges(node);
            const outgoingEdges = graph.getOutgoingEdges(node);
            incomingEdges?.forEach((edge) => {
              edge.setAttrByPath('line/stroke', statusColor['failure']);
              edge.setAttrByPath('line/strokeWidth', 2);
            });
            outgoingEdges?.forEach((edge) => {
              edge.setAttrByPath('line/stroke', statusColor['failure']);
              edge.setAttrByPath('line/strokeWidth', 2);
            });
          } else if (status === 'running') {
            const incomingEdges = graph.getIncomingEdges(node);
            incomingEdges?.forEach((edge) => {
              edge.setAttrByPath('line/stroke', statusColor['running']);
              edge.setAttrByPath('line/strokeWidth', 2);
              edge.setAttrByPath('line/strokeDasharray', '5,5');
            });
          }
        }
      });
    };

    graphAddStatus();

    // 画布设置只读
    // setOptions({ readonly: true })
  };

  const isHide = false
  
  const [globalVarsVisible, setGlobalVarsVisible] = useState(false);
  const [basicConfigVisible, setBasicConfigVisible] = useState(false);
  const [operationLogVisible, setOperationLogVisible] = useState(false);
  const [executionPolicyVisible, setExecutionPolicyVisible] = useState(false);

  return (
    <div className="xflow-header">
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Select
          value={systemName}
          placeholder="请选择业务系统"
          style={{ width: 150 }}
          options={systemOptions}
          allowClear
          onChange={handleChangeSystem}
          disabled={globalState.hasSaved}
        ></Select>
        <Input.Group compact style={{ display: "flex" }}>
          <Input ref={workflowInputRef} readOnly={!isEditName} style={{ width: 200 }} value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
          {isEditName ? (
            <Button
              onClick={saveWorkflowName}
              icon={<SaveOutlined />}
              type="primary"
              disabled={globalState.hasSaved}
            ></Button>
          ) : (
            <Button
              onClick={editWorkflowName}
              icon={<EditOutlined />}
              type="primary"
              disabled={globalState.hasSaved}
            ></Button>
          )}
        </Input.Group>
        <Button 
          icon={<GlobalOutlined />} 
          type="default"
          onClick={() => setGlobalVarsVisible(true)}
        >全局变量</Button>
        <Button 
          icon={<SettingOutlined />} 
          type="default"
          onClick={() => setBasicConfigVisible(true)}
        >基础配置</Button>
        <Button 
          icon={<HistoryOutlined />} 
          type="default"
          onClick={() => setOperationLogVisible(true)}
        >操作日志</Button>
        <Button 
          icon={<ScheduleOutlined />} 
          type="default"
          onClick={() => setExecutionPolicyVisible(true)}
        >执行策略</Button>
        
        <GlobalVariables 
          visible={globalVarsVisible} 
          onClose={() => setGlobalVarsVisible(false)} 
        />
        <BasicConfig 
          visible={basicConfigVisible} 
          onClose={() => setBasicConfigVisible(false)} 
        />
        <OperationLog 
          visible={operationLogVisible} 
          onClose={() => setOperationLogVisible(false)} 
        />
        <ExecutionPolicy 
          visible={executionPolicyVisible} 
          onClose={() => setExecutionPolicyVisible(false)} 
        />
        {isHide && (
          <>
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
          调试
        </Button>
      </Space>
    </div>
  );
};
