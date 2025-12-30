// 模拟数据服务 - 用于前端独立演示

// 疫苗类型列表
const vaccineTypes = [
  { id: 1, name: '乙肝疫苗（重组）', code: 'HBV-R', manufacturer: '深圳康泰', spec: '10μg/0.5ml', price: 68 },
  { id: 2, name: '流感疫苗（四价）', code: 'FLU-4V', manufacturer: '华兰生物', spec: '0.5ml/支', price: 128 },
  { id: 3, name: '狂犬疫苗（Vero细胞）', code: 'RAB-V', manufacturer: '辽宁成大', spec: '1ml/瓶', price: 298 },
  { id: 4, name: '百白破疫苗', code: 'DTaP', manufacturer: '武汉生物', spec: '0.5ml/支', price: 0 },
  { id: 5, name: '麻腮风疫苗', code: 'MMR', manufacturer: '北京科兴', spec: '0.5ml/支', price: 0 },
  { id: 6, name: '脊灰疫苗（IPV）', code: 'IPV', manufacturer: '昆明生物', spec: '0.5ml/支', price: 0 },
  { id: 7, name: '水痘疫苗', code: 'VZV', manufacturer: '长春祈健', spec: '0.5ml/支', price: 168 },
  { id: 8, name: '手足口疫苗（EV71）', code: 'EV71', manufacturer: '中科生物', spec: '0.5ml/支', price: 218 },
  { id: 9, name: '肺炎球菌疫苗（13价）', code: 'PCV13', manufacturer: '辉瑞', spec: '0.5ml/支', price: 698 },
  { id: 10, name: 'HPV疫苗（九价）', code: 'HPV9', manufacturer: '默沙东', spec: '0.5ml/支', price: 1298 },
];

// 生成随机订单号
const generateOrderNo = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
};

// 生成随机溯源码
const generateTraceCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 20; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 货道矩阵数据
export const generateChannelMatrix = () => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);
  
  const matrix = rows.map((row, ri) =>
    cols.map((col, ci) => {
      const vaccine = vaccineTypes[Math.floor(Math.random() * vaccineTypes.length)];
      const quantity = Math.floor(Math.random() * 20);
      const status = Math.random() > 0.08 ? 1 : (Math.random() > 0.5 ? 2 : 0);
      
      return {
        id: ri * 10 + ci + 1,
        position: `${row}${col}`,
        rowIndex: row,
        colIndex: col,
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        vaccineCode: vaccine.code,
        quantity,
        capacity: 20,
        status,
        temperature: 2 + Math.random() * 6,
        lastUpdated: new Date().toISOString(),
      };
    })
  );

  return {
    rows: rows.length,
    cols: cols.length,
    totalChannels: rows.length * cols.length,
    matrix,
  };
};

// 概览统计数据
export const generateOverviewData = () => {
  return {
    today: {
      inboundCount: Math.floor(Math.random() * 200) + 50,
      outboundCount: Math.floor(Math.random() * 300) + 100,
      orderCount: Math.floor(Math.random() * 150) + 30,
      alarmCount: Math.floor(Math.random() * 5),
    },
    inventory: {
      totalCount: Math.floor(Math.random() * 3000) + 2000,
      vaccineTypes: vaccineTypes.length,
      expiringSoon: Math.floor(Math.random() * 50),
    },
    device: {
      onlineCount: 58,
      offlineCount: 2,
      faultCount: Math.floor(Math.random() * 3),
    },
  };
};

// 最近订单数据
export const generateRecentOrders = (count: number = 10) => {
  const statuses = [0, 1, 2, 2, 2, 3, 4]; // 大部分完成
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    const vaccine = vaccineTypes[Math.floor(Math.random() * vaccineTypes.length)];
    const row = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)];
    const col = Math.floor(Math.random() * 10) + 1;
    
    const createTime = new Date(Date.now() - Math.random() * 3600000 * 8);
    
    orders.push({
      id: i + 1,
      orderNo: generateOrderNo(),
      vaccineId: vaccine.id,
      vaccineName: vaccine.name,
      vaccineCode: vaccine.code,
      quantity: Math.floor(Math.random() * 5) + 1,
      channelPosition: `${row}${col}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      traceCode: generateTraceCode(),
      createTime: createTime.toISOString(),
      updateTime: new Date().toISOString(),
    });
  }
  
  return orders.sort((a, b) => 
    new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
  );
};

// 温度历史数据
export const generateTemperatureHistory = (hours: number = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toISOString(),
      avgTemp: 4.5 + Math.random() * 1.5,
      minTemp: 2.5 + Math.random() * 1,
      maxTemp: 6 + Math.random() * 1.5,
    });
  }
  
  return data;
};

// 当前温度数据
export const generateCurrentTemperature = () => {
  const sensors = [];
  const zones = ['冷藏区A', '冷藏区B', '出库通道', '入库通道'];
  
  zones.forEach((zone, i) => {
    sensors.push({
      id: i + 1,
      zone,
      temperature: 2 + Math.random() * 6,
      humidity: 45 + Math.random() * 20,
      status: Math.random() > 0.05 ? 'normal' : 'warning',
      updateTime: new Date().toISOString(),
    });
  });
  
  return {
    avgTemp: sensors.reduce((sum, s) => sum + s.temperature, 0) / sensors.length,
    sensors,
  };
};

// 库存数据
export const generateInventoryData = () => {
  return vaccineTypes.map((vaccine, i) => ({
    ...vaccine,
    totalQuantity: Math.floor(Math.random() * 500) + 50,
    availableQuantity: Math.floor(Math.random() * 400) + 30,
    lockedQuantity: Math.floor(Math.random() * 50),
    channels: Math.floor(Math.random() * 8) + 2,
    expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 3600000).toISOString().split('T')[0],
    batchNo: `B${2024}${String(i + 1).padStart(4, '0')}`,
  }));
};

// 报警数据
export const generateAlarmData = (count: number = 20) => {
  const alarmTypes = [
    { type: 'temperature', level: 'critical', message: '温度超出安全范围' },
    { type: 'temperature', level: 'warning', message: '温度接近临界值' },
    { type: 'device', level: 'critical', message: '设备通讯中断' },
    { type: 'device', level: 'warning', message: '设备响应延迟' },
    { type: 'inventory', level: 'warning', message: '库存不足预警' },
    { type: 'inventory', level: 'info', message: '疫苗即将过期' },
    { type: 'sorting', level: 'critical', message: '分拣异常' },
    { type: 'sorting', level: 'warning', message: '货道堵塞' },
  ];
  
  const alarms = [];
  
  for (let i = 0; i < count; i++) {
    const alarm = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];
    const createTime = new Date(Date.now() - Math.random() * 7 * 24 * 3600000);
    const isHandled = Math.random() > 0.3;
    
    alarms.push({
      id: i + 1,
      type: alarm.type,
      level: alarm.level,
      message: alarm.message,
      location: `${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 10) + 1}`,
      status: isHandled ? 'handled' : 'pending',
      createTime: createTime.toISOString(),
      handleTime: isHandled ? new Date(createTime.getTime() + Math.random() * 3600000).toISOString() : null,
      handler: isHandled ? '张工' : null,
      handleResult: isHandled ? '已处理完成' : null,
    });
  }
  
  return alarms.sort((a, b) => 
    new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
  );
};

// 溯源数据
export const generateTraceData = (traceCode: string) => {
  const vaccine = vaccineTypes[Math.floor(Math.random() * vaccineTypes.length)];
  const inboundTime = new Date(Date.now() - Math.random() * 30 * 24 * 3600000);
  const outboundTime = new Date(inboundTime.getTime() + Math.random() * 7 * 24 * 3600000);
  
  return {
    traceCode,
    vaccine: {
      name: vaccine.name,
      code: vaccine.code,
      manufacturer: vaccine.manufacturer,
      spec: vaccine.spec,
      batchNo: `B${2024}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      productionDate: new Date(Date.now() - 180 * 24 * 3600000).toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 180 * 24 * 3600000).toISOString().split('T')[0],
    },
    timeline: [
      {
        time: inboundTime.toISOString(),
        event: '入库登记',
        operator: '李明',
        location: '接种点仓库',
        temperature: (3 + Math.random() * 2).toFixed(1) + '°C',
      },
      {
        time: new Date(inboundTime.getTime() + 300000).toISOString(),
        event: '质量检验',
        operator: '王芳',
        location: '质检区',
        result: '合格',
      },
      {
        time: new Date(inboundTime.getTime() + 600000).toISOString(),
        event: '上架存储',
        operator: '系统自动',
        location: 'C5货道',
        temperature: (4 + Math.random()).toFixed(1) + '°C',
      },
      {
        time: outboundTime.toISOString(),
        event: '接种出库',
        operator: '系统自动',
        location: '出库口',
        orderNo: generateOrderNo(),
      },
      {
        time: new Date(outboundTime.getTime() + 60000).toISOString(),
        event: '接种完成',
        operator: '陈医生',
        location: '3号接种台',
        recipient: '张**（身份证尾号：2156）',
      },
    ],
    temperatureLog: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(inboundTime.getTime() + i * 3600000).toISOString(),
      temperature: 3 + Math.random() * 3,
    })),
  };
};

// 模拟API响应
export const mockApi = {
  // 统计概览
  'GET /statistics/overview': () => ({
    code: 0,
    message: 'success',
    data: generateOverviewData(),
  }),
  
  // 货道矩阵
  'GET /channels/matrix': () => ({
    code: 0,
    message: 'success',
    data: generateChannelMatrix(),
  }),
  
  // 货道列表
  'GET /channels': () => {
    const matrix = generateChannelMatrix();
    return {
      code: 0,
      message: 'success',
      data: {
        total: matrix.totalChannels,
        list: matrix.matrix.flat(),
      },
    };
  },
  
  // 订单列表
  'GET /orders': (params?: { limit?: number }) => ({
    code: 0,
    message: 'success',
    data: {
      total: 100,
      list: generateRecentOrders(params?.limit || 10),
    },
  }),
  
  // 当前温度
  'GET /temperature/current': () => ({
    code: 0,
    message: 'success',
    data: generateCurrentTemperature(),
  }),
  
  // 温度历史
  'GET /temperature/history': (params?: { hours?: number }) => ({
    code: 0,
    message: 'success',
    data: generateTemperatureHistory(params?.hours || 24),
  }),
  
  // 库存列表
  'GET /inventory': () => ({
    code: 0,
    message: 'success',
    data: {
      total: vaccineTypes.length,
      list: generateInventoryData(),
    },
  }),
  
  // 报警列表
  'GET /alarms': (params?: { limit?: number }) => ({
    code: 0,
    message: 'success',
    data: {
      total: 50,
      list: generateAlarmData(params?.limit || 20),
    },
  }),
  
  // 溯源查询
  'GET /traces/:code': (params: { code: string }) => ({
    code: 0,
    message: 'success',
    data: generateTraceData(params.code),
  }),
  
  // 登录
  'POST /auth/login': (data: { username: string; password: string }) => {
    if (data.username === 'admin' && data.password === 'admin123') {
      return {
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
      };
    }
    return {
      code: 401,
      message: '用户名或密码错误',
      data: null,
    };
  },
};

export default mockApi;

