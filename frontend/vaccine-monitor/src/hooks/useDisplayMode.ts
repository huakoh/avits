import { useMemo } from 'react';
import { useSettingsStore, DisplayMode } from '../stores/settings';

// 显示模式配置接口
export interface DisplayConfig {
  // 布局相关
  gutter: [number, number];  // Row gutter
  cardPadding: number;
  contentPadding: number;
  
  // 字体相关
  fontSize: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };
  
  // 组件大小
  componentSize: 'small' | 'middle' | 'large';
  buttonSize: 'small' | 'middle' | 'large';
  tableSize: 'small' | 'middle' | 'large';
  
  // 图表相关
  chartHeight: {
    small: number;
    medium: number;
    large: number;
  };
  
  // 栅格布局 (用于响应式)
  colSpan: {
    quarter: number;    // 1/4
    third: number;      // 1/3
    half: number;       // 1/2
    twoThirds: number;  // 2/3
    full: number;       // 全宽
  };
  
  // 货道矩阵
  channelMatrix: {
    cellSize: number;
    gap: number;
    fontSize: number;
  };
  
  // 统计卡片
  statisticCard: {
    height: number;
    valueSize: number;
  };
  
  // 间距
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // 表格分页
  pagination: {
    pageSize: number;
    showSizeChanger: boolean;
  };
}

// 16:9 宽屏模式配置
const wideScreenConfig: DisplayConfig = {
  gutter: [16, 16],
  cardPadding: 24,
  contentPadding: 24,
  
  fontSize: {
    title: 20,
    subtitle: 16,
    body: 14,
    small: 12,
  },
  
  componentSize: 'middle',
  buttonSize: 'middle',
  tableSize: 'middle',
  
  chartHeight: {
    small: 200,
    medium: 300,
    large: 400,
  },
  
  colSpan: {
    quarter: 6,
    third: 8,
    half: 12,
    twoThirds: 16,
    full: 24,
  },
  
  channelMatrix: {
    cellSize: 60,
    gap: 8,
    fontSize: 12,
  },
  
  statisticCard: {
    height: 120,
    valueSize: 28,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  pagination: {
    pageSize: 10,
    showSizeChanger: true,
  },
};

// 4:3 标准模式配置
const standardScreenConfig: DisplayConfig = {
  gutter: [12, 12],
  cardPadding: 16,
  contentPadding: 16,
  
  fontSize: {
    title: 18,
    subtitle: 14,
    body: 13,
    small: 11,
  },
  
  componentSize: 'small',
  buttonSize: 'small',
  tableSize: 'small',
  
  chartHeight: {
    small: 160,
    medium: 240,
    large: 320,
  },
  
  colSpan: {
    quarter: 6,
    third: 8,
    half: 12,
    twoThirds: 16,
    full: 24,
  },
  
  channelMatrix: {
    cellSize: 48,
    gap: 6,
    fontSize: 11,
  },
  
  statisticCard: {
    height: 100,
    valueSize: 24,
  },
  
  spacing: {
    xs: 2,
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
  },
  
  pagination: {
    pageSize: 8,
    showSizeChanger: false,
  },
};

// 配置映射
const configMap: Record<DisplayMode, DisplayConfig> = {
  '16:9': wideScreenConfig,
  '4:3': standardScreenConfig,
};

// 自定义 Hook
export const useDisplayMode = () => {
  const { displayMode, setDisplayMode } = useSettingsStore();
  
  const config = useMemo(() => configMap[displayMode], [displayMode]);
  
  const is4x3 = displayMode === '4:3';
  const is16x9 = displayMode === '16:9';
  
  return {
    displayMode,
    setDisplayMode,
    config,
    is4x3,
    is16x9,
  };
};

export default useDisplayMode;

