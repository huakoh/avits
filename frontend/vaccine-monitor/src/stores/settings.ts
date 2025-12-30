import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DisplayMode = '16:9' | '4:3';

interface SettingsState {
  // 显示模式
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  
  // 数据刷新间隔（秒）
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  
  // 声音报警
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // 主题模式
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 显示模式，默认16:9
      displayMode: '16:9',
      setDisplayMode: (mode) => set({ displayMode: mode }),
      
      // 刷新间隔，默认10秒
      refreshInterval: 10,
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      
      // 声音报警，默认开启
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      
      // 暗色模式，默认关闭
      darkMode: false,
      setDarkMode: (dark) => set({ darkMode: dark }),
    }),
    {
      name: 'vaccine-settings',
    }
  )
);

