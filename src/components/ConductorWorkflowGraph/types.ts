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