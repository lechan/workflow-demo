import React, { useState } from 'react';
import { Drawer, Button } from 'antd';

export const BasicConfig: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Drawer 
      title="基础配置" 
      placement="right" 
      onClose={onClose}
      visible={visible}
      width={500}
    >
      <p>这里是基础配置表单</p>
    </Drawer>
  );
};