import React from 'react';
import { Drawer, Form, Input, Select } from 'antd';

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
        return (
          <>
            <Form.Item name="command" label="Shell命令" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="请输入shell命令" />
            </Form.Item>
          </>
        );
      case 'Python':
        return (
          <>
            <Form.Item name="script" label="Python脚本" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="请输入Python脚本" />
            </Form.Item>
            <Form.Item name="requirements" label="依赖包">
              <Input.TextArea rows={2} placeholder="每行一个依赖包" />
            </Form.Item>
          </>
        );
      case 'PromQL':
        return (
          <>
            <Form.Item name="query" label="PromQL查询" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="请输入PromQL查询语句" />
            </Form.Item>
            <Form.Item name="datasource" label="数据源">
              <Select placeholder="请选择数据源">
                <Select.Option value="prometheus">Prometheus</Select.Option>
                <Select.Option value="thanos">Thanos</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Drawer
      title="节点属性配置"
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={nodeData}
      >
        <Form.Item name="name" label="节点名称" rules={[{ required: true }]}>
          <Input placeholder="请输入节点名称" />
        </Form.Item>
        {renderFormByNodeType()}
      </Form>
    </Drawer>
  );
};

export default NodeDrawer;