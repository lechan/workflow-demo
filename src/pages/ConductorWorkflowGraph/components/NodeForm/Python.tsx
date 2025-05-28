import React, { useEffect } from 'react';
import { Form, Input, Button } from 'antd';
import { useAppContext } from '../AppContext';
import { useGraphInstance } from '@antv/xflow';

interface PythonFormProps {
  form: any;
  nodeData: any;
  onClose: () => void;
}

const PythonForm: React.FC<PythonFormProps> = ({ form, nodeData, onClose }) => {
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
          // 处理节点名称长度
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
      <Form.Item name="script" label="Python脚本" rules={[{ required: true }]}>
        <Input.TextArea rows={4} placeholder="请输入Python脚本" />
      </Form.Item>
      <Form.Item name="requirements" label="依赖包">
        <Input.TextArea rows={2} placeholder="每行一个依赖包" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Form.Item>
    </>
  );
};

export default PythonForm;