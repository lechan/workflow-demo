import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// 定义全局状态类型，可拓展其他字段
interface AppState {
  hasSaved: boolean;
  // future global vars
}

interface AppContextType {
  globalState: AppState;
  setGlobalState: React.Dispatch<React.SetStateAction<AppState>>;
}

const defaultState: AppState = { hasSaved: false };
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