import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// 定义全局状态类型，可拓展其他字段
interface AppState {
  hasSaved: boolean;
  isExecuting: boolean;
  currentNodeDetail?: {
    nodeId: string;
    [key: string]: any;
  };
}

interface AppContextType {
  globalState: AppState;
  setGlobalState: React.Dispatch<React.SetStateAction<AppState>>;
}

const defaultState: AppState = {
  // 是否保存
  hasSaved: false,
  // 是否执行状态
  isExecuting: false,
  // 当前选中的节点详情
  currentNodeDetail: undefined
};
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalState, setGlobalState] = useState<AppState>(defaultState);
  return (
    <AppContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext 必须在 AppProvider 内使用');
  return ctx;
};