import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/auth';

// 是否使用模拟数据（与 api.ts 保持一致）
const USE_MOCK = true;

interface TemperatureData {
  channels: Array<{
    channelId: number;
    position: string;
    temperature: number;
    isAlarm: boolean;
  }>;
  avgTemp: number;
  timestamp: string;
}

interface AlarmData {
  id: number;
  alarmCode: string;
  level: number;
  message: string;
  timestamp: string;
}

interface ChannelStatusData {
  position: string;
  quantity: number;
  status: number;
  isActive: boolean;
}

interface OrderStatusData {
  orderId: number;
  orderNo: string;
  status: number;
  statusName: string;
  message: string;
  timestamp: string;
}

interface DeviceStatusData {
  devices: Array<{
    id: number;
    code: string;
    status: number;
  }>;
  timestamp: string;
}

interface WebSocketHookResult {
  temperature: TemperatureData | null;
  alarms: AlarmData[];
  channelStatus: ChannelStatusData | null;
  orderStatus: OrderStatusData | null;
  deviceStatus: DeviceStatusData | null;
  isConnected: boolean;
  reconnect: () => void;
}

// 生成模拟温度数据
const generateMockTemperature = (): TemperatureData => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = 10;
  const channels = [];
  
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const temp = 2 + Math.random() * 6;
      channels.push({
        channelId: ri * cols + ci + 1,
        position: `${rows[ri]}${ci + 1}`,
        temperature: parseFloat(temp.toFixed(1)),
        isAlarm: temp < 2 || temp > 8,
      });
    }
  }
  
  const avgTemp = channels.reduce((sum, ch) => sum + ch.temperature, 0) / channels.length;
  
  return {
    channels,
    avgTemp: parseFloat(avgTemp.toFixed(1)),
    timestamp: new Date().toISOString(),
  };
};

// 生成模拟设备状态
const generateMockDeviceStatus = (): DeviceStatusData => {
  return {
    devices: [
      { id: 1, code: 'PLC-MAIN', status: 1 },
      { id: 2, code: 'PLC-BACKUP', status: 1 },
      { id: 3, code: 'CONVEYOR-1', status: 1 },
      { id: 4, code: 'CONVEYOR-2', status: 1 },
      { id: 5, code: 'SENSOR-T1', status: 1 },
      { id: 6, code: 'SENSOR-T2', status: 1 },
      { id: 7, code: 'CAMERA-1', status: 1 },
      { id: 8, code: 'CAMERA-2', status: Math.random() > 0.1 ? 1 : 0 },
    ],
    timestamp: new Date().toISOString(),
  };
};

// 生成模拟货道活动
const generateMockChannelActivity = (): ChannelStatusData | null => {
  // 50% 概率产生货道活动
  if (Math.random() > 0.5) return null;
  
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const row = rows[Math.floor(Math.random() * rows.length)];
  const col = Math.floor(Math.random() * 10) + 1;
  
  return {
    position: `${row}${col}`,
    quantity: Math.floor(Math.random() * 15) + 1,
    status: 1,
    isActive: true,
  };
};

export const useWebSocket = (): WebSocketHookResult => {
  const [temperature, setTemperature] = useState<TemperatureData | null>(null);
  const [alarms, setAlarms] = useState<AlarmData[]>([]);
  const [channelStatus, setChannelStatus] = useState<ChannelStatusData | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusData | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = useAuthStore((state) => state.token);

  // 模拟模式：使用定时器模拟数据更新
  const startMockUpdates = useCallback(() => {
    console.log('🔧 WebSocket 模拟模式已启用');
    setIsConnected(true);
    
    // 初始数据
    setTemperature(generateMockTemperature());
    setDeviceStatus(generateMockDeviceStatus());
    
    // 定时更新温度数据（每5秒）
    mockIntervalRef.current = setInterval(() => {
      setTemperature(generateMockTemperature());
      
      // 偶尔更新设备状态
      if (Math.random() > 0.7) {
        setDeviceStatus(generateMockDeviceStatus());
      }
      
      // 偶尔产生货道活动
      const activity = generateMockChannelActivity();
      if (activity) {
        setChannelStatus(activity);
        // 3秒后清除活动状态
        setTimeout(() => setChannelStatus(null), 3000);
      }
    }, 5000);
  }, []);

  const connect = useCallback(() => {
    // 如果是模拟模式，不连接真实 WebSocket
    if (USE_MOCK) {
      startMockUpdates();
      return;
    }
    
    if (!token) return;
    
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket 连接成功');
        setIsConnected(true);
        
        // 订阅消息
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          channels: ['temperature', 'alarms', 'orders', 'devices', 'channels'],
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'temperature':
              setTemperature(message.data);
              break;
            case 'alarm':
              setAlarms((prev) => [message.data, ...prev.slice(0, 99)]);
              break;
            case 'channel_status':
              setChannelStatus(message.data);
              break;
            case 'order_status':
              setOrderStatus(message.data);
              break;
            case 'device_status':
              setDeviceStatus(message.data);
              break;
            default:
              console.log('未知消息类型:', message.type);
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket 连接关闭:', event.code, event.reason);
        setIsConnected(false);
        
        // 自动重连或降级到模拟模式
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('WebSocket 尝试重连...');
            connect();
          }, 5000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket 错误，切换到模拟模式:', error);
        setIsConnected(false);
        // 降级到模拟模式
        startMockUpdates();
      };
      
    } catch (error) {
      console.error('WebSocket 创建失败，使用模拟模式:', error);
      startMockUpdates();
    }
  }, [token, startMockUpdates]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  return {
    temperature,
    alarms,
    channelStatus,
    orderStatus,
    deviceStatus,
    isConnected,
    reconnect,
  };
};
