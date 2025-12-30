import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Progress,
  Button,
  Space,
  Divider,
  Table,
  Timeline,
  Tabs,
  Statistic,
  Row,
  Col,
  Badge,
  message,
  Input,
  Select,
  Form,
  InputNumber,
} from 'antd';
import {
  MedicineBoxOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SyncOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

interface ChannelData {
  id: number;
  position: string;
  rowIndex: string;
  colIndex: number;
  vaccineName?: string;
  vaccineCode?: string;
  vaccineType?: string;
  vaccineCategory?: 'EPI' | 'NON_EPI'; // 免疫规划/非免疫规划
  quantity: number;
  capacity: number;
  status: number;
  temperature?: number;
  vaccineId?: number;
  manufacturer?: string;
  batchNo?: string;
  expiryDate?: string;
  expiryDays?: number;
  todayOut?: number;
}

// 根据疫苗类别获取颜色配置
const getCategoryStyle = (category: 'EPI' | 'NON_EPI' = 'NON_EPI', vaccineType: string = '疫苗') => {
  if (category === 'EPI') {
    // 免疫规划疫苗 - 绿色系
    return { 
      label: vaccineType,
      color: '#166534', 
      bgColor: '#dcfce7',
      categoryName: '免疫规划疫苗',
    };
  } else {
    // 非免疫规划疫苗 - 蓝色系
    return { 
      label: vaccineType,
      color: '#1e40af', 
      bgColor: '#dbeafe',
      categoryName: '非免疫规划疫苗',
    };
  }
};

interface ChannelDetailModalProps {
  visible: boolean;
  channel: ChannelData | null;
  onClose: () => void;
  onRefresh?: () => void;
}

// 模拟操作历史
const generateOperationHistory = (position: string) => {
  const operations = ['出库', '入库', '盘点', '调整'];
  const operators = ['张工', '李工', '王工', '系统自动'];
  const history = [];
  
  for (let i = 0; i < 8; i++) {
    const time = dayjs().subtract(i * 2 + Math.random() * 2, 'hour');
    const op = operations[Math.floor(Math.random() * operations.length)];
    history.push({
      id: i + 1,
      time: time.format('YYYY-MM-DD HH:mm:ss'),
      operation: op,
      quantity: op === '出库' ? -Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 5 + 1),
      operator: operators[Math.floor(Math.random() * operators.length)],
      orderNo: op === '出库' ? `ORD${dayjs().format('YYYYMMDD')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : '-',
    });
  }
  
  return history;
};

// 生成温度历史
const generateTempHistory = () => {
  const hours = [];
  const temps = [];
  for (let i = 23; i >= 0; i--) {
    hours.push(dayjs().subtract(i, 'hour').format('HH:mm'));
    temps.push(parseFloat((4 + Math.random() * 2).toFixed(1)));
  }
  return { hours, temps };
};

const ChannelDetailModal: React.FC<ChannelDetailModalProps> = ({
  visible,
  channel,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [operationHistory, setOperationHistory] = useState<any[]>([]);
  const [tempHistory, setTempHistory] = useState<{ hours: string[]; temps: number[] }>({ hours: [], temps: [] });
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && channel) {
      setOperationHistory(generateOperationHistory(channel.position));
      setTempHistory(generateTempHistory());
    }
  }, [visible, channel]);

  if (!channel) return null;

  const stockPercent = Math.round((channel.quantity / channel.capacity) * 100);
  const stockColor = stockPercent === 0 ? '#ff4d4f' : stockPercent <= 25 ? '#faad14' : '#52c41a';

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1: return { color: 'success', text: '正常', icon: <CheckCircleOutlined /> };
      case 2: return { color: 'error', text: '故障', icon: <WarningOutlined /> };
      case 0: return { color: 'default', text: '停用', icon: <StopOutlined /> };
      default: return { color: 'default', text: '未知', icon: null };
    }
  };

  const statusInfo = getStatusInfo(channel.status);

  // 温度曲线图配置
  const tempChartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `${data.axisValue}<br/>温度: ${data.value}°C`;
      },
    },
    xAxis: {
      type: 'category',
      data: tempHistory.hours,
      axisLabel: { fontSize: 10, interval: 3 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { formatter: '{value}°C' },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: tempHistory.temps,
      smooth: true,
      lineStyle: { color: '#1890ff', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ],
        },
      },
      markLine: {
        silent: true,
        data: [
          { yAxis: 8, lineStyle: { color: '#ff4d4f', type: 'dashed' }, label: { formatter: '上限 8°C' } },
          { yAxis: 2, lineStyle: { color: '#ff4d4f', type: 'dashed' }, label: { formatter: '下限 2°C' } },
        ],
      },
    }],
    grid: { top: 20, right: 20, bottom: 30, left: 45 },
  };

  // 操作历史表格列
  const historyColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { 
      title: '操作', 
      dataIndex: 'operation', 
      key: 'operation',
      render: (op: string) => {
        const colorMap: Record<string, string> = {
          '出库': 'orange',
          '入库': 'green',
          '盘点': 'blue',
          '调整': 'purple',
        };
        return <Tag color={colorMap[op]}>{op}</Tag>;
      },
    },
    { 
      title: '数量', 
      dataIndex: 'quantity', 
      key: 'quantity',
      render: (q: number) => (
        <span style={{ color: q > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
          {q > 0 ? `+${q}` : q}
        </span>
      ),
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '关联订单', dataIndex: 'orderNo', key: 'orderNo' },
  ];

  // 手动出库
  const handleManualDispense = () => {
    setLoading(true);
    setTimeout(() => {
      message.success(`货道 ${channel.position} 手动出库指令已发送`);
      setLoading(false);
      onRefresh?.();
    }, 1000);
  };

  // 状态切换
  const handleStatusToggle = (newStatus: number) => {
    setLoading(true);
    setTimeout(() => {
      const statusText = newStatus === 1 ? '启用' : newStatus === 0 ? '停用' : '故障标记';
      message.success(`货道 ${channel.position} 已${statusText}`);
      setLoading(false);
      onRefresh?.();
    }, 800);
  };

  // 保存配置
  const handleSaveConfig = (values: any) => {
    console.log('保存配置:', values);
    message.success('货道配置已保存');
    setConfigModalVisible(false);
  };

  // 获取疫苗类型配置
  const typeConfig = getCategoryStyle(channel.vaccineCategory, channel.vaccineType);
  const expiryDays = channel.expiryDays || Math.floor(Math.random() * 300) + 30;
  const todayOut = channel.todayOut || Math.floor(Math.random() * 50);
  const currentTemp = channel.temperature || 2.5 + Math.random() * 4;

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <MedicineBoxOutlined />
          基本信息
        </span>
      ),
      children: (
        <div>
          {/* 顶部详情卡片 - 参考图片设计 */}
          <div style={{
            display: 'flex',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}>
            {/* 左侧类型标签 */}
            <div style={{
              width: 100,
              minHeight: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: typeConfig.bgColor,
            }}>
              <span style={{
                fontSize: 40,
                fontWeight: 700,
                color: typeConfig.color,
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                letterSpacing: 8,
              }}>
                {typeConfig.label}
              </span>
            </div>

            {/* 右侧信息区 */}
            <div style={{ flex: 1, padding: 16 }}>
              {/* 疫苗名称 */}
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                {channel.vaccineName || '未配置疫苗'}
              </div>

              {/* 厂家和批次 */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Tag color={channel.vaccineCategory === 'EPI' ? 'green' : 'blue'}>
                  {typeConfig.categoryName}
                </Tag>
                <span style={{ color: '#1677ff', fontWeight: 500 }}>
                  {channel.manufacturer || '兰州生物'}
                </span>
                <Tag color="default">批次 {channel.batchNo || '2024'}</Tag>
                <Tag color={currentTemp >= 2 && currentTemp <= 8 ? 'green' : 'red'}>
                  🌡️ {currentTemp.toFixed(1)}°C
                </Tag>
              </div>

              {/* 有效期 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: '#fff',
                borderRadius: 8,
                marginBottom: 12,
              }}>
                <span style={{ color: '#6b7280' }}>📅 有效期</span>
                <span style={{
                  fontWeight: 600,
                  color: expiryDays < 30 ? '#ef4444' : expiryDays < 90 ? '#f59e0b' : '#10b981',
                }}>
                  {expiryDays}天
                </span>
              </div>

              {/* 底部统计 */}
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>当前库存</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: stockColor }}>
                      {channel.quantity}
                    </span>
                    <span style={{ color: '#6b7280' }}>支</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>今日出库</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ color: '#1677ff' }}>📦</span>
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#1f2937' }}>
                      {todayOut}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 详细信息表格 */}
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="货道编号">
              <strong style={{ fontSize: 14 }}>{channel.position}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={statusInfo.color as any} text={statusInfo.text} />
            </Descriptions.Item>
            <Descriptions.Item label="疫苗编码">
              {channel.vaccineCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="货道容量">
              {channel.capacity} 支
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" style={{ marginTop: 20 }}>快捷操作</Divider>
          
          <Space wrap>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleManualDispense}
              loading={loading}
              disabled={channel.status !== 1 || channel.quantity === 0}
            >
              手动出库
            </Button>
            {channel.status === 1 ? (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => handleStatusToggle(0)}
                loading={loading}
              >
                停用货道
              </Button>
            ) : (
              <Button
                type="primary"
                ghost
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusToggle(1)}
                loading={loading}
              >
                启用货道
              </Button>
            )}
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  vaccineId: channel.vaccineId || 1,
                  capacity: channel.capacity,
                  minStock: 5,
                });
                setConfigModalVisible(true);
              }}
            >
              配置货道
            </Button>
            <Button icon={<SyncOutlined />} onClick={onRefresh}>
              刷新数据
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: 'temperature',
      label: (
        <span>
          <LineChartOutlined />
          温度曲线
        </span>
      ),
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic title="当前温度" value={channel.temperature?.toFixed(1) || '5.2'} suffix="°C" />
            </Col>
            <Col span={8}>
              <Statistic title="24h 最高" value="6.8" suffix="°C" />
            </Col>
            <Col span={8}>
              <Statistic title="24h 最低" value="3.2" suffix="°C" />
            </Col>
          </Row>
          <ReactECharts option={tempChartOption} style={{ height: 280 }} />
          <div style={{ textAlign: 'center', marginTop: 8, color: '#999' }}>
            过去24小时温度曲线（安全范围: 2-8°C）
          </div>
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          操作记录
        </span>
      ),
      children: (
        <Table
          columns={historyColumns}
          dataSource={operationHistory}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <MedicineBoxOutlined />
            货道详情 - {channel.position}
            <Tag color={statusInfo.color as any}>{statusInfo.text}</Tag>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={700}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Modal>

      {/* 配置货道模态框 */}
      <Modal
        title="配置货道"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConfig}
        >
          <Form.Item
            name="vaccineId"
            label="绑定疫苗"
            rules={[{ required: true, message: '请选择疫苗' }]}
          >
            <Select
              placeholder="选择疫苗类型"
              options={[
                { value: 1, label: '乙肝疫苗（重组）- 深圳康泰' },
                { value: 2, label: '流感疫苗（四价）- 华兰生物' },
                { value: 3, label: '狂犬疫苗（Vero细胞）- 辽宁成大' },
                { value: 4, label: '百白破疫苗 - 武汉生物' },
                { value: 5, label: '麻腮风疫苗 - 北京科兴' },
                { value: 6, label: '水痘疫苗 - 长春祈健' },
                { value: 7, label: 'HPV疫苗（九价）- 默沙东' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="货道容量"
            rules={[{ required: true, message: '请输入容量' }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} addonAfter="支" />
          </Form.Item>
          <Form.Item
            name="minStock"
            label="库存下限预警"
            rules={[{ required: true, message: '请输入预警值' }]}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} addonAfter="支" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ChannelDetailModal;

