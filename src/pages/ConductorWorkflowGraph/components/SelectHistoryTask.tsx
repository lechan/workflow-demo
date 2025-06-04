import React, { useState } from 'react';
import { Modal, Input, Table } from 'antd';
import { useGraphInstance } from '@antv/xflow'
import { SearchOutlined } from '@ant-design/icons';
import graphData from '../mock/graphData.json'
import { v4 as uuidv4 } from 'uuid'

interface SelectHistoryTaskProps {
  visible: boolean;
  onClose: () => void;
  graph?: ReturnType<typeof useGraphInstance>;
}

const mockData = [
  {
    key: '1',
    taskName: 'cpu性能监控作业',
    system: '统一运维系统',
    updater: 'hubo',
    updateTime: '2025-02-12 12:00:00',
    graphData
  },
  {
    key: '2',
    taskName: '打印测试',
    system: '统一运维系统',
    updater: 'chengnan',
    updateTime: '2025-02-12 12:00:00',
    graphData
  },
];

type Cells = {
  id: string;
  source: {
    cell: string;
  };
  target: {
    cell: string;
  };
  shape: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    data: {
      name: string;
    };
  };
}
type GraphData = {
  cells: Cells[];
  systemName: string;
  workflowName: string;
}
type ColumnItemType = {
  title: string;
  dataIndex: string;
  key: string;
  graphData: GraphData;
}

const SelectHistoryTask: React.FC<SelectHistoryTaskProps> = ({ visible, onClose }) => {
  const graph = useGraphInstance()
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(mockData);

  // 实现前端模糊搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    
    if (!value.trim()) {
      // 如果搜索框为空，显示全部数据
      setFilteredData(mockData);
    } else {
      // 否则根据搜索文本过滤数据
      const filtered = mockData.filter(item => 
        item.taskName.toLowerCase().includes(value.toLowerCase()) || 
        item.system.toLowerCase().includes(value.toLowerCase()) || 
        item.updater.toLowerCase().includes(value.toLowerCase()) ||
        item.key.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  // 将copySelectTask移到组件内部，这样它可以访问到graph实例
  const copySelectTask = (data: ColumnItemType) => {
    const graphCells = data.graphData?.cells;
    // 过滤出所有的cell和edge，去掉start和end
    const filteredCells = graphCells?.filter(
      cell => cell.shape === 'rect' && !['start', 'end'].includes(cell.id)
    );
    const filteredEdges = graphCells?.filter(
      cell => cell.shape === 'edge' && 
        !['start', 'end'].includes(cell.source?.cell) && 
        !['start', 'end'].includes(cell.target?.cell)
    );
    const idMap = new Map();
    
    // 获取当前图表中所有节点的最大y坐标
    const currentData = graph?.toJSON();
    const currentCells = currentData?.cells || [];
    let maxY = 0;
    
    // 找出当前图表中所有节点的最大y坐标
    currentCells.forEach(cell => {
      if (cell.position && cell.position.y) {
        // 考虑节点的高度，取节点底部的y坐标
        const bottomY = cell.position.y + (cell.size?.height || 0);
        if (bottomY > maxY) {
          maxY = bottomY;
        }
      }
    });
    
    // 设置一个合理的垂直间距
    const verticalGap = 100;
    // 新节点的起始y坐标应该是当前最大y坐标加上间距
    const newStartY = maxY + verticalGap;
    
    // 为每个cell生成新ID并建立映射，同时调整位置
    const processedCells = (filteredCells || []).map((cell) => {
      const newId = uuidv4();
      idMap.set(cell.id, newId);
      
      // 为节点添加垂直偏移量，避免与原有节点重叠
      if (cell.position) {
        // 计算相对于原始位置的偏移量
        // const originalY = cell.position.y;
        // 保持节点之间的相对位置关系，但整体向下移动
        const newY = newStartY + (cell.position.y - (filteredCells[0]?.position?.y || 0));
        
        return { 
          ...cell, 
          id: newId,
          position: {
            ...cell.position,
            y: newY
          }
        };
      }
      
      return { ...cell, id: newId };
    });
    
    // 处理edges，更新source和target引用以及edge自身的id
    const processedEdges = (filteredEdges || []).map(edge => {
      const newId = uuidv4();
      return {
        ...edge,
        id: newId, // 为edge分配新的唯一id
        source: { ...edge.source, cell: idMap.get(edge.source.cell) || edge.source.cell },
        target: { ...edge.target, cell: idMap.get(edge.target.cell) || edge.target.cell }
      };
    });
    
    const filteredResult = [...processedCells, ...processedEdges];
    
    // 先合并数组
    const mergedCells = [...currentCells, ...filteredResult];
    
    // 对合并后的数组进行排序，rect在前，edge在后
    const sortedCells = mergedCells.sort((a, b) => {
      if (a.shape === 'rect' && b.shape === 'edge') return -1;
      if (a.shape === 'edge' && b.shape === 'rect') return 1;
      return 0;
    });
    
    console.log('mergedCells', sortedCells);
    graph?.fromJSON({ cells: sortedCells })
  }

  // 定义columns在组件内部，这样可以访问到copySelectTask函数
  const columns = [
    {
      title: '作业名称',
      dataIndex: 'taskName',
      key: 'taskName',
    },
    {
      title: '业务系统',
      dataIndex: 'system',
      key: 'system',
    },
    {
      title: '更新人',
      dataIndex: 'updater',
      key: 'updater',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (data: ColumnItemType) => (
        <a onClick={() => copySelectTask(data)}>复制</a>
      ),
    },
  ];

  return (
    <Modal
      title="选择作业集"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Input
        value={searchText}
        placeholder="作业名称/作业ID"
        prefix={<SearchOutlined />}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ width: 200, marginBottom: 16 }}
      />
      <Table
        dataSource={filteredData}
        columns={columns}
      />
    </Modal>
  );
};

export default SelectHistoryTask;