export interface NodeData {
  id?: string;
  type: 'shell' | 'python' | 'promql';
  name: string;
  command?: string;  // shell类型节点的命令
  script?: string;   // python类型节点的脚本
  requirements?: string;  // python类型节点的依赖
  query?: string;    // promql类型节点的查询语句
  datasource?: 'prometheus' | 'thanos';  // promql类型节点的数据源
}

export interface NodeEventData {
  node: NodeData;
}

export interface Node {
  id: string;
  nodeType?: string;
  shape: 'rect' | 'edge';
  attrs?: { text?: { text?: string } };
  data: object;
}

export interface Edge {
  shape: 'edge';
  nodeType?: string;
  source: {
    [x: string]: any; cell: string 
};
  target: { cell: string };
}

export interface WorkflowRawData {
  graphData: {
    cells: (Node | Edge)[];
  };
}

export interface Task {
  name: string;
  taskReferenceName: string;
  type: 'SIMPLE' | 'FORK' | 'JOIN';
  forkTasks?: Task[][];
  joinOn?: string[];
  nodeData?: string | null;  // 节点数据，可能为字符串或null
}

export interface Workflow {
  name: string;
  tasks: Task[];
  systemName: string;
  rawData: string;
}