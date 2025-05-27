import React, { useState } from 'react';
import { Drawer, Button } from 'antd';

export const GlobalVariables: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Drawer 
      title="全局变量" 
      placement="right" 
      onClose={onClose}
      visible={visible}
      width={500}
    >
      <p>这里是全局变量配置表单</p>
    </Drawer>
  );
};