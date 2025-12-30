import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Badge, Table, Tag, Typography, Tabs } from 'antd';
import {
  MedicineBoxOutlined,
  ShoppingCartOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  LineChartOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import { api } from '../../services/api';
import ChannelMatrix from '../../components/ChannelMatrix';
import TemperatureGauge from '../../components/TemperatureGauge';
import ChannelDetailModal from '../../components/ChannelDetailModal';
import styles from './index.module.css';
import classNames from 'classnames';

const { Title } = Typography;

interface OverviewData {
  today: {
    inboundCount: number;
    outboundCount: number;
    orderCount: number;
    alarmCount: number;
  };
  inventory: {
    totalCount: number;
    vaccineTypes: number;
    expiringSoon: number;
  };
  device: {
    onlineCount: number;
    offlineCount: number;
    faultCount: number;
  };
}

interface OrderItem {
  id: number;
  orderNo: string;
  vaccineName: string;
  status: number;
  channelPosition: string;
  createTime: string;
}

interface ChannelData {
  id: number;
  position: string;
  rowIndex: string;
  colIndex: number;
  vaccineName?: string;
  vaccineCode?: string;
  vaccineType?: string;
  vaccineCategory?: 'EPI' | 'NON_EPI';
  manufacturer?: string;
  batchNo?: string;
  quantity: number;
  capacity: number;
  status: number;
  temperature?: number;
  expiryDate?: string;
  expiryDays?: number;
  todayOut?: number;
}

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTemp, setCurrentTemp] = useState(5.2);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [channelModalVisible, setChannelModalVisible] = useState(false);

  // WebSocket实时数据
  const { temperature } = useWebSocket();
  
  // 显示模式配置
  const { config, is4x3, displayMode } = useDisplayMode();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (temperature?.avgTemp) {
      setCurrentTemp(temperature.avgTemp);
    }
  }, [temperature]);

  const fetchData = async () => {
    try {
      const [overviewRes, ordersRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/orders/recent'),
      ]);
      setOverview(overviewRes.data.data);
      setRecentOrders(ordersRes.data.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setChannelModalVisible(true);
  };

  // 温度图表配置
  const temperatureChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { 
      top: 30, 
      right: 20, 
      bottom: 20, 
      left: 40,
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      axisLabel: { fontSize: 10, color: '#8c8c8c' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      splitLine: { lineStyle: { type: 'dashed' } },
      axisLabel: { fontSize: 10, color: '#8c8c8c' }
    },
    series: [{
      name: '温度',
      type: 'line',
      smooth: true,
      data: [4.2, 4.5, 5.1, 5.8, 5.4, 4.9, 4.6],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
          ]
        }
      },
      itemStyle: { color: '#52c41a' },
      markLine: {
        silent: true,
        data: [
          { yAxis: 8, lineStyle: { color: '#ff4d4f' } },
          { yAxis: 2, lineStyle: { color: '#ff4d4f' } }
        ],
        symbol: 'none'
      }
    }]
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <Typography.Text copyable ellipsis style={{ width: 120 }}>{text}</Typography.Text>
    },
    {
      title: '疫苗名称',
      dataIndex: 'vaccineName',
      key: 'vaccineName',
      render: (text: string) => <Typography.Text ellipsis style={{ width: 100 }}>{text}</Typography.Text>
    },
    {
      title: '货道',
      dataIndex: 'channelPosition',
      key: 'channelPosition',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        const statusMap: Record<number, { color: string; text: string }> = {
          0: { color: 'default', text: '待处理' },
          1: { color: 'processing', text: '处理中' },
          2: { color: 'success', text: '已完成' },
          3: { color: 'error', text: '已取消' },
          4: { color: 'warning', text: '异常' },
        };
        const item = statusMap[status] || { color: 'default', text: '未知' };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
  ];

  const getDeviceStatus = () => {
    const total = (overview?.device?.onlineCount || 0) + (overview?.device?.offlineCount || 0);
    const online = overview?.device?.onlineCount || 0;
    if (total === 0) return { status: 'default' as const, text: '未知' };
    if (online === total) return { status: 'success' as const, text: '全部在线' };
    if (online === 0) return { status: 'error' as const, text: '全部离线' };
    return { status: 'warning' as const, text: `${online}/${total} 在线` };
  };

  const deviceStatusInfo = getDeviceStatus();

  return (
    <div className={classNames(styles.dashboard, { [styles.compactLayout]: is4x3 })}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Title level={is4x3 ? 5 : 4} style={{ margin: 0 }}>
          <DashboardOutlined /> 运营概览
        </Title>
        <Tag color="blue" style={{ marginLeft: 12, borderRadius: 12 }}>
          {displayMode === '16:9' ? '宽屏模式' : '标准模式'}
        </Tag>
      </div>

      {/* 统计卡片区 */}
      <Row gutter={config.gutter} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" variant="borderless">
            <Statistic
              title="今日出库"
              value={overview?.today?.outboundCount || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
              suffix={<span style={{ fontSize: 14 }}>支</span>}
              valueStyle={{ fontSize: config.statisticCard.valueSize, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" variant="borderless">
            <Statistic
              title="库存总量"
              value={overview?.inventory?.totalCount || 0}
              prefix={<MedicineBoxOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
              suffix={
                <span style={{ fontSize: 12, color: '#999' }}>
                  / {overview?.inventory?.vaccineTypes || 0} 种
                </span>
              }
              valueStyle={{ fontSize: config.statisticCard.valueSize, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" variant="borderless">
            <Statistic
              title="当前温度"
              value={currentTemp}
              precision={1}
              prefix={
                currentTemp >= 2 && currentTemp <= 8 ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                ) : (
                  <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                )
              }
              suffix="°C"
              valueStyle={{
                color: currentTemp >= 2 && currentTemp <= 8 ? '#52c41a' : '#ff4d4f',
                fontSize: config.statisticCard.valueSize,
                fontWeight: 600
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" variant="borderless">
            <Statistic
              title="系统状态"
              value={deviceStatusInfo.text}
              prefix={<Badge status={deviceStatusInfo.status} />}
              valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
            {(overview?.today?.alarmCount || 0) > 0 && (
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <Tag color="error" icon={<AlertOutlined />}>
                  {overview?.today?.alarmCount}
                </Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 主内容区：根据模式切换布局结构 */}
      <div className={styles.mainContent}>
        {/* 左侧：核心货道矩阵 - 在所有模式下都占据主要位置 */}
        <div className={styles.leftColumn}>
          <Card 
            title="货道实时状态" 
            className={styles.channelCard}
            size="small"
            variant="borderless"
            extra={<span style={{ color: '#999', fontSize: 12 }}>● 实时监控中</span>}
          >
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChannelMatrix onChannelClick={handleChannelClick} />
            </div>
          </Card>
        </div>

        {/* 右侧：在 16:9 下分为上下两部分，在 4:3 下使用 Tab 切换或紧凑排列 */}
        <div className={styles.rightColumn}>
          {is4x3 ? (
            // 4:3 模式：使用 Tabs 节省空间
            <Card className={styles.orderCard} size="small" variant="borderless" styles={{ body: { padding: 0 } }}>
              <Tabs
                defaultActiveKey="temp"
                size="small"
                tabBarStyle={{ margin: '0 16px', height: 40 }}
                items={[
                  {
                    key: 'temp',
                    label: <span><LineChartOutlined /> 温度</span>,
                    children: (
                      <div style={{ padding: 16 }}>
                        <div className={styles.tempGaugeContainer}>
                          <TemperatureGauge value={currentTemp} size={140} />
                        </div>
                        <ReactECharts 
                          option={temperatureChartOption} 
                          style={{ height: 180 }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )
                  },
                  {
                    key: 'orders',
                    label: <span><UnorderedListOutlined /> 任务</span>,
                    children: (
                      <Table
                        columns={orderColumns}
                        dataSource={recentOrders}
                        rowKey="id"
                        pagination={false}
                        loading={loading}
                        size="small"
                        scroll={{ y: 280 }}
                      />
                    )
                  }
                ]}
              />
            </Card>
          ) : (
            // 16:9 模式：上下平铺
            <>
              <Card title="温度监控" className={styles.tempCard} size="small" variant="borderless">
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <div style={{ flex: '0 0 140px', display: 'flex', justifyContent: 'center' }}>
                    <TemperatureGauge value={currentTemp} size={120} />
                  </div>
                  <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
                    <ReactECharts 
                      option={{...temperatureChartOption, grid: { top: 10, right: 10, bottom: 20, left: 30 }}}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                </div>
              </Card>
              
              <Card title="最近任务" className={styles.orderCard} size="small" variant="borderless" extra={<a href="/orders">查看全部</a>}>
                <div style={{ height: '100%', overflow: 'hidden' }}>
                  <Table
                    columns={orderColumns}
                    dataSource={recentOrders}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    size="small"
                    scroll={{ y: 200 }}
                  />
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 货道详情弹窗 */}
      <ChannelDetailModal
        visible={channelModalVisible}
        channel={selectedChannel}
        onClose={() => setChannelModalVisible(false)}
        onRefresh={fetchData}
      />
    </div>
  );
};

export default Dashboard;
