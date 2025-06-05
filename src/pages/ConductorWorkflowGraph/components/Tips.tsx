import React from 'react';

export const Tips: React.FC = () => {
  return (
    <div className='graph-tips'>
      <h3>操作说明</h3>
      <p>🖱️ 左键：选择、框选节点</p>
      <p>🖱️ 滚轮：画布缩放</p>
      <p>⌨ Ctrl + 🖱️ 左键：移动画布</p>
      <p>⌨ Ctrl + Z：撤销</p>
      <p>⌨ Ctrl + Y：重做</p>
      <p>⌨ Delete：删除节点、连线</p>
    </div>
  );
}

export default Tips;
