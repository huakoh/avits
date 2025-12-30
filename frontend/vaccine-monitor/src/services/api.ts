import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/auth';
import mockApi, { 
  generateOverviewData, 
  generateChannelMatrix, 
  generateRecentOrders,
  generateCurrentTemperature,
  generateTemperatureHistory,
  generateInventoryData,
  generateAlarmData,
  generateTraceData,
} from './mockData';

// 是否启用模拟模式（当后端不可用时自动启用）
const USE_MOCK = true; // 设置为 true 启用模拟数据

// 模拟延迟
const mockDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error(data?.message || '服务器错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.request) {
      // 网络错误，不显示消息（在模拟模式下）
      if (!USE_MOCK) {
        message.error('网络错误，请检查网络连接');
      }
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// 封装的 API 对象，支持模拟模式
export const api = {
  get: async (url: string, config?: { params?: any }) => {
    if (USE_MOCK) {
      await mockDelay();
      return handleMockGet(url, config?.params);
    }
    try {
      return await axiosInstance.get(url, config);
    } catch (error) {
      // 如果请求失败，自动降级到模拟数据
      console.warn('API请求失败，使用模拟数据:', url);
      await mockDelay();
      return handleMockGet(url, config?.params);
    }
  },
  
  post: async (url: string, data?: any) => {
    if (USE_MOCK) {
      await mockDelay();
      return handleMockPost(url, data);
    }
    try {
      return await axiosInstance.post(url, data);
    } catch (error) {
      console.warn('API请求失败，使用模拟数据:', url);
      await mockDelay();
      return handleMockPost(url, data);
    }
  },
  
  put: async (url: string, data?: any) => {
    if (USE_MOCK) {
      await mockDelay();
      return { data: { code: 0, message: 'success', data: null } };
    }
    return axiosInstance.put(url, data);
  },
  
  delete: async (url: string) => {
    if (USE_MOCK) {
      await mockDelay();
      return { data: { code: 0, message: 'success', data: null } };
    }
    return axiosInstance.delete(url);
  },
};

// 处理模拟 GET 请求
function handleMockGet(url: string, params?: any): { data: any } {
  // 统计概览
  if (url === '/statistics/overview') {
    return { data: { code: 0, message: 'success', data: generateOverviewData() } };
  }
  
  // 货道矩阵
  if (url === '/channels/matrix') {
    return { data: { code: 0, message: 'success', data: generateChannelMatrix() } };
  }
  
  // 货道列表
  if (url === '/channels') {
    const matrix = generateChannelMatrix();
    return { 
      data: { 
        code: 0, 
        message: 'success', 
        data: { total: matrix.totalChannels, list: matrix.matrix.flat() } 
      } 
    };
  }
  
  // 订单列表
  if (url === '/orders') {
    return { 
      data: { 
        code: 0, 
        message: 'success', 
        data: { total: 100, list: generateRecentOrders(params?.limit || 10) } 
      } 
    };
  }
  
  // 当前温度
  if (url === '/temperature/current') {
    return { data: { code: 0, message: 'success', data: generateCurrentTemperature() } };
  }
  
  // 温度历史
  if (url === '/temperature/history') {
    return { 
      data: { 
        code: 0, 
        message: 'success', 
        data: generateTemperatureHistory(params?.hours || 24) 
      } 
    };
  }
  
  // 库存列表
  if (url === '/inventory') {
    return { 
      data: { 
        code: 0, 
        message: 'success', 
        data: { total: 10, list: generateInventoryData() } 
      } 
    };
  }
  
  // 报警列表
  if (url === '/alarms') {
    return { 
      data: { 
        code: 0, 
        message: 'success', 
        data: { total: 50, list: generateAlarmData(params?.limit || 20) } 
      } 
    };
  }
  
  // 溯源查询
  if (url.startsWith('/traces/')) {
    const code = url.replace('/traces/', '');
    return { data: { code: 0, message: 'success', data: generateTraceData(code) } };
  }
  
  // 疫苗列表
  if (url === '/vaccines') {
    return { 
      data: { 
        code: 0, 
        message: 'success', 
        data: { 
          total: 10, 
          list: [
            { id: 1, name: '乙肝疫苗（重组）', code: 'HBV-R', manufacturer: '深圳康泰' },
            { id: 2, name: '流感疫苗（四价）', code: 'FLU-4V', manufacturer: '华兰生物' },
          ] 
        } 
      } 
    };
  }
  
  // 默认返回
  return { data: { code: 0, message: 'success', data: null } };
}

// 处理模拟 POST 请求
function handleMockPost(url: string, data?: any): { data: any } {
  // 登录
  if (url === '/auth/login') {
    if (data?.username === 'admin' && data?.password === 'admin123') {
      return {
        data: {
          code: 0,
          message: 'success',
          data: {
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
            user: {
              id: 1,
              username: 'admin',
              name: '系统管理员',
              role: 'admin',
              permissions: ['*'],
            },
          },
        },
      };
    }
    return {
      data: {
        code: 401,
        message: '用户名或密码错误',
        data: null,
      },
    };
  }
  
  // 登出
  if (url === '/auth/logout') {
    return { data: { code: 0, message: 'success', data: null } };
  }
  
  // 默认返回
  return { data: { code: 0, message: 'success', data: null } };
}

// API方法封装
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

export const vaccineApi = {
  list: (params?: any) => api.get('/vaccines', { params }),
  get: (id: number) => api.get(`/vaccines/${id}`),
  create: (data: any) => api.post('/vaccines', data),
  update: (id: number, data: any) => api.put(`/vaccines/${id}`, data),
  delete: (id: number) => api.delete(`/vaccines/${id}`),
};

export const inventoryApi = {
  list: (params?: any) => api.get('/inventory', { params }),
  summary: () => api.get('/inventory/summary'),
  inbound: (data: any) => api.post('/inventory/inbound', data),
  outbound: (data: any) => api.post('/inventory/outbound', data),
};

export const orderApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  process: (id: number) => api.post(`/orders/${id}/process`),
  cancel: (id: number, reason: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
};

export const channelApi = {
  list: () => api.get('/channels'),
  matrix: () => api.get('/channels/matrix'),
  update: (id: number, data: any) => api.put(`/channels/${id}`, data),
};

export const temperatureApi = {
  current: () => api.get('/temperature/current'),
  history: (params: any) => api.get('/temperature/history', { params }),
  report: (params: any) => api.get('/temperature/report', { params }),
};

export const traceApi = {
  query: (traceCode: string) => api.get(`/traces/${traceCode}`),
  batchQuery: (batchNo: string) => api.get(`/traces/batch/${batchNo}`),
};

export const alarmApi = {
  list: (params?: any) => api.get('/alarms', { params }),
  handle: (id: number, result: string) =>
    api.post(`/alarms/${id}/handle`, { handle_result: result }),
};

export const statisticsApi = {
  overview: () => api.get('/statistics/overview'),
  inventory: (params: any) => api.get('/statistics/inventory', { params }),
};

export { axiosInstance };
