import React, { useState } from 'react';
import { Drawer, Button } from 'antd';

export const ExecutionPolicy: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Drawer 
      title="执行策略" 
      placement="right" 
      onClose={onClose}
      visible={visible}
      width={500}
    >
      <p>这里是执行策略配置</p>
    </Drawer>
  );
};