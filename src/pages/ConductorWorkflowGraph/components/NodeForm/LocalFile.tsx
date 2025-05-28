import React, { useEffect } from 'react';
import { Form, Input, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAppContext } from '../AppContext';
import { useGraphInstance } from '@antv/xflow';

interface LocalFileFormProps {
  form: any;
  nodeData: any;
  onClose: () => void;
}

const LocalFileForm: React.FC<LocalFileFormProps> = ({ form, nodeData, onClose }) => {
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
      <Form.Item name="filePath" label="文件路径" rules={[{ required: true }]}>
        <Input placeholder="请输入文件路径" />
      </Form.Item>
      <Form.Item name="fileUpload" label="上传文件">
        <Upload>
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
      </Form.Item>
      <Form.Item name="fileType" label="文件类型" rules={[{ required: true }]}>
        <Input placeholder="请输入文件类型，如: .txt, .csv" />
      </Form.Item>
      <Form.Item name="encoding" label="文件编码">
        <Input placeholder="请输入文件编码，默认: UTF-8" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Form.Item>
    </>
  );
};

export default LocalFileForm;