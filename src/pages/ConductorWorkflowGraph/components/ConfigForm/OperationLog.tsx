import React, { useState } from 'react';
import { Drawer, Button } from 'antd';

export const OperationLog: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Drawer 
      title="操作日志" 
      placement="right" 
      onClose={onClose}
      visible={visible}
      width={500}
    >
      <p>这里是操作日志记录</p>
    </Drawer>
  );
};