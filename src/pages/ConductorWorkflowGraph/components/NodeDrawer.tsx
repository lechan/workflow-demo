import React from 'react';
import { Drawer, Form } from 'antd';
import { useAppContext } from './AppContext';
import ShellForm from './NodeForm/Shell';
import PythonForm from './NodeForm/Python';
import PromQLForm from './NodeForm/PromQL';
import LocalFileForm from './NodeForm/LocalFile';
import RemoteFileForm from './NodeForm/RemoteFile';

interface NodeDrawerProps {
  visible: boolean;
  onClose: () => void;
  nodeData: any; // 选中的节点数据
}

const NodeDrawer: React.FC<NodeDrawerProps> = ({ visible, onClose, nodeData }) => {
  const [form] = Form.useForm();

  // 根据节点类型渲染不同的表单内容
  const renderFormByNodeType = () => {
    if (!nodeData) return null;
    const { store: { data: { nodeType } } } = nodeData
    switch (nodeType) {
      case 'Shell':
        return <ShellForm form={form} nodeData={nodeData} onClose={onClose} />;
      case 'Python':
        return <PythonForm form={form} nodeData={nodeData} onClose={onClose} />;
      case 'PromQL':
        return <PromQLForm form={form} nodeData={nodeData} onClose={onClose} />;
      case 'LocalFile':
        return <LocalFileForm form={form} nodeData={nodeData} onClose={onClose} />;
      case 'RemoteFile':
        return <RemoteFileForm form={form} nodeData={nodeData} onClose={onClose} />;
      default:
        return null;
    }
  };

  const { globalState } = useAppContext();

  return (
    <Drawer
      title="节点属性配置"
      placement="right"
      width={600}
      onClose={onClose}
      visible={visible}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={nodeData}
        disabled={globalState.hasSaved}
      >
        {renderFormByNodeType()}
      </Form>
    </Drawer>
  );
};

export default NodeDrawer;