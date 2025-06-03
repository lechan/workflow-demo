import React from 'react';
import { Drawer } from 'antd';
import { useAppContext } from './AppContext';

interface NodeDrawerProps {
  visible: boolean;
  onClose: () => void;
  nodeData: any; // 选中的节点数据
}

const ExecuteDrawer: React.FC<NodeDrawerProps> = ({ visible, onClose, nodeData }) => {
  const { globalState } = useAppContext();
  if (!nodeData) {
    return null;
  }
  console.log('globalState', globalState)
  console.log('nodeData', nodeData)
  const name = nodeData?.store?.data?.data?.name || ''
  return (
    <Drawer
      title={`节点【${name}】执行结果`}
      placement="bottom"
      width={600}
      onClose={onClose}
      visible={visible}
    >
      这里是执行抽屉的内容
    </Drawer>
  );
};

export default ExecuteDrawer;