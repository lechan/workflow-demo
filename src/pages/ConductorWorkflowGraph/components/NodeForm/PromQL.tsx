import React, { useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { useAppContext } from '../AppContext';
import { useGraphInstance } from '@antv/xflow';

interface PromQLFormProps {
  form: any;
  nodeData: any;
  preNodeData: any;
  onClose: () => void;
}

const PromQLForm: React.FC<PromQLFormProps> = ({ form, nodeData, onClose }) => {
  const graph = useGraphInstance();
  const { globalState, setGlobalState } = useAppContext();

  useEffect(() => {
    console.log('nodeData', nodeData?.data)
    if (nodeData?.data) {
      form.setFieldsValue(nodeData.data);
    } else {
      form.resetFields();
    }
  }, [form, nodeData]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (graph && nodeData) {
        // 更新节点数据
        const node = graph.getCellById(nodeData.id);
        if (node) {
          // 获取节点名称
          const nodeName = form.getFieldValue('name');
          node.setData({
            ...node.getData(),
            ...values,
            hasDetailSaved: true, // 添加保存状态标记
          });
          // 更新节点显示名称
          const displayName = nodeName.length > 12 ? nodeName.slice(0, 12) + '...' : nodeName;
          node.setAttrByPath('nodeName', {text: displayName});
        }

        // 更新全局状态
        setGlobalState(prev => ({
          ...prev,
          currentNodeDetail: {
            nodeId: nodeData.id,
            ...values
          }
        }));

        onClose();
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <>
      <Form.Item name="name" label="节点名称" rules={[{ required: true }]}>
        <Input placeholder="请输入节点名称" />
      </Form.Item>
      <Form.Item name="query" label="PromQL查询" rules={[{ required: true }]}>
        <Input.TextArea rows={4} placeholder="请输入PromQL查询语句" />
      </Form.Item>
      <Form.Item name="datasource" label="数据源">
        <Select placeholder="请选择数据源">
          <Select.Option value="prometheus">Prometheus</Select.Option>
          <Select.Option value="thanos">Thanos</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Form.Item>
    </>
  );
};

export default PromQLForm;