import React, { useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { useAppContext } from '../AppContext';
import { useGraphInstance } from '@antv/xflow';

interface RemoteFileFormProps {
  form: any;
  nodeData: any;
  onClose: () => void;
}

const RemoteFileForm: React.FC<RemoteFileFormProps> = ({ form, nodeData, onClose }) => {
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
      <Form.Item name="url" label="远程URL" rules={[{ required: true }]}>
        <Input placeholder="请输入远程文件URL" />
      </Form.Item>
      <Form.Item name="method" label="请求方法">
        <Select placeholder="请选择请求方法" defaultValue="GET">
          <Select.Option value="GET">GET</Select.Option>
          <Select.Option value="POST">POST</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="headers" label="请求头">
        <Input.TextArea rows={2} placeholder="请输入请求头，格式：key: value" />
      </Form.Item>
      <Form.Item name="auth" label="认证信息">
        <Input.TextArea rows={2} placeholder="请输入认证信息" />
      </Form.Item>
      <Form.Item name="timeout" label="超时时间(秒)">
        <Input type="number" placeholder="请输入超时时间" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Form.Item>
    </>
  );
};

export default RemoteFileForm;