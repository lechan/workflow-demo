import React from 'react';
import { Form, Input, Select, Button } from 'antd';
import { useAppContext } from '../AppContext';
import { useGraphInstance } from '@antv/xflow';

interface PromQLFormProps {
  form: any;
  nodeData: any;
  onClose: () => void;
}

const PromQLForm: React.FC<PromQLFormProps> = ({ form, nodeData, onClose }) => {
  const graph = useGraphInstance();
  const { globalState, setGlobalState } = useAppContext();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (graph && nodeData) {
        // 更新节点数据
        const node = graph.getCellById(nodeData.id);
        if (node) {
          node.setData({
            ...node.getData(),
            ...values,
          });
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