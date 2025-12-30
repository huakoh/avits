import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Table,
  DatePicker,
  Button,
  Space,
  Select,
  Statistic,
  Alert,
  Tabs,
  Badge,
  Tooltip,
  Progress,
} from 'antd';
import {
  LineChartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  DownloadOutlined,
  AreaChartOutlined,
  HistoryOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import TemperatureGauge from '../../components/TemperatureGauge';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 生成模拟温度历史数据
const generateTempHistory = (hours: number, zones: string[]) => {
  const data: any = {};
  const labels: string[] = [];
  
  for (let i = hours - 1; i >= 0; i--) {
    const time = dayjs().subtract(i, 'hour');
    labels.push(time.format('HH:mm'));
  }
  
  zones.forEach(zone => {
    data[zone] = labels.map(() => parseFloat((3 + Math.random() * 4).toFixed(1)));
  });
  
  return { labels, data };
};

// 温度区域配置
const allZones = ['A区', 'B区', 'C区', 'D区', 'E区', 'F区'];

const TemperaturePage: React.FC = () => {
  const [selectedZones, setSelectedZones] = useState<string[]>(['A区', 'B区', 'C区']);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [tempHistory, setTempHistory] = useState<{ labels: string[]; data: any }>({ labels: [], data: {} });
  const [tempAlerts, setTempAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 显示模式配置
  const { config, is4x3 } = useDisplayMode();

  // WebSocket实时数据
  const { temperature: wsTemp } = useWebSocket();

  useEffect(() => {
    // 初始化历史数据
    const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
    setTempHistory(generateTempHistory(hours, allZones));
    
    // 模拟告警数据
    setTempAlerts([
      { id: 1, time: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), zone: 'A区', type: '高温预警', value: '8.5', status: 'pending' },
      { id: 2, time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), zone: 'C区', type: '低温预警', value: '1.8', status: 'handled', handler: '张工' },
    ]);
  }, [timeRange]);

  // 当前温度数据 (模拟)
  const currentTemps = allZones.map(zone => ({
    zone,
    sensor1: parseFloat((3 + Math.random() * 4).toFixed(1)),
    sensor2: parseFloat((3 + Math.random() * 4).toFixed(1)),
    avg: parseFloat((4 + Math.random() * 2).toFixed(1)),
    min: parseFloat((2.5 + Math.random()).toFixed(1)),
    max: parseFloat((6 + Math.random() * 2).toFixed(1)),
  }));

  // 计算统计值
  const avgTemp = currentTemps.reduce((sum, t) => sum + t.avg, 0) / currentTemps.length;
  const minTemp = Math.min(...currentTemps.map(t => t.min));
  const maxTemp = Math.max(...currentTemps.map(t => t.max));

  // 历史曲线图配置
  const historyChartOption = selectedZones.length > 0 ? {
    tooltip: { trigger: 'axis' },
    legend: { data: selectedZones, top: 0 },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: tempHistory.labels,
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { formatter: '{value}°C', fontSize: 11 }
    },
    series: selectedZones.map((zone, idx) => ({
      name: zone,
      type: 'line',
      smooth: true,
      data: tempHistory.data[zone] || [],
      lineStyle: { width: 2 },
    })),
  } : {};

  // 温度分布图
  const distributionOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: allZones },
    yAxis: { type: 'value', min: 0, max: 10, axisLabel: { formatter: '{value}°C' } },
    series: [{
      name: '当前温度',
      type: 'bar',
      data: currentTemps.map(t => ({
        value: t.avg,
        itemStyle: { color: t.avg >= 2 && t.avg <= 8 ? '#52c41a' : '#ff4d4f' },
      })),
      label: { show: true, position: 'top', formatter: '{c}°C' },
      barWidth: '50%',
    }],
  };

  // 表格列配置
  const columns = [
    { title: '区域', dataIndex: 'zone', key: 'zone', width: 80, render: (text: string) => <strong>{text}</strong> },
    { 
      title: '传感器1', dataIndex: 'sensor1', key: 'sensor1', width: 100,
      render: (v: number) => <span style={{ color: v >= 2 && v <= 8 ? '#52c41a' : '#ff4d4f' }}>{v}°C</span>,
    },
    { 
      title: '传感器2', dataIndex: 'sensor2', key: 'sensor2', width: 100,
      render: (v: number) => <span style={{ color: v >= 2 && v <= 8 ? '#52c41a' : '#ff4d4f' }}>{v}°C</span>,
    },
    { 
      title: '平均温度', dataIndex: 'avg', key: 'avg', width: 100,
      render: (v: number) => <strong style={{ color: v >= 2 && v <= 8 ? '#52c41a' : '#ff4d4f' }}>{v}°C</strong>,
    },
    { 
      title: '今日范围', key: 'range', width: 120,
      render: (_: any, record: any) => <Text type="secondary">{record.min}°C ~ {record.max}°C</Text>,
    },
    { 
      title: '状态', key: 'status', width: 80,
      render: (_: any, record: any) => {
        const isNormal = record.avg >= 2 && record.avg <= 8;
        return <Tag color={isNormal ? 'success' : 'error'}>{isNormal ? '正常' : '异常'}</Tag>;
      },
    },
  ];

  // 告警列配置
  const alertColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '区域', dataIndex: 'zone', key: 'zone', width: 80 },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={type.includes('高温') ? 'red' : 'blue'}>{type}</Tag> },
    { title: '温度值', dataIndex: 'value', key: 'value', render: (v: string) => <strong>{v}°C</strong> },
    { 
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => <Badge status={status === 'pending' ? 'error' : 'success'} text={status === 'pending' ? '待处理' : '已处理'} />,
    },
    { title: '处理人', dataIndex: 'handler', key: 'handler', render: (h: string) => h || '-' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      {/* 页面标题 */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={is4x3 ? 5 : 4} style={{ margin: 0, fontSize: config.fontSize.title }}>
          <LineChartOutlined /> 温度监控
        </Title>
        <Space>
          <Button size={config.buttonSize} icon={<ReloadOutlined />}>刷新</Button>
          <Button size={config.buttonSize} icon={<DownloadOutlined />}>导出报告</Button>
        </Space>
      </div>
      
      {/* 告警提示 */}
      {tempAlerts.some(a => a.status === 'pending') && (
        <Alert
          message="温度预警"
          description={`有 ${tempAlerts.filter(a => a.status === 'pending').length} 条温度预警待处理`}
          type="warning"
          showIcon
          style={{ flexShrink: 0 }}
          closable
        />
      )}

      {/* 概览统计 - 固定高度 */}
      <Row gutter={config.gutter} style={{ flexShrink: 0 }}>
        <Col span={6}>
          <Card size="small" variant="borderless">
            <Statistic
              title="平均温度"
              value={avgTemp.toFixed(1)}
              suffix="°C"
              prefix={avgTemp >= 2 && avgTemp <= 8 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: avgTemp >= 2 && avgTemp <= 8 ? '#52c41a' : '#ff4d4f', fontSize: config.statisticCard.valueSize, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" variant="borderless">
            <Statistic title="最低温度" value={minTemp} suffix="°C" valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }} />
            <Progress percent={(minTemp / 10) * 100} showInfo={false} strokeColor={minTemp >= 2 ? '#52c41a' : '#3b82f6'} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" variant="borderless">
            <Statistic title="最高温度" value={maxTemp} suffix="°C" valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }} />
            <Progress percent={(maxTemp / 10) * 100} showInfo={false} strokeColor={maxTemp <= 8 ? '#52c41a' : '#ff4d4f'} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" variant="borderless" styles={{ body: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 8 } }}>
            <TemperatureGauge value={avgTemp} size={is4x3 ? 80 : 90} />
          </Card>
        </Col>
      </Row>

      {/* 主内容区域 - 自适应高度 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Card 
          variant="borderless" 
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden', padding: 0 } }}
        >
          <Tabs
            size={is4x3 ? 'small' : 'middle'}
            style={{ height: '100%', padding: '0 16px' }}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              {
                key: 'realtime',
                label: <span><DashboardOutlined /> 实时监控</span>,
                children: (
                  <div style={{ height: '100%', overflow: 'auto', padding: '16px 0' }}>
                    <Row gutter={config.gutter}>
                      <Col span={is4x3 ? 14 : 16}>
                        <Card title="各区域温度" size="small" variant="borderless">
                          <Table 
                            columns={columns} 
                            dataSource={currentTemps} 
                            rowKey="zone" 
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                          />
                        </Card>
                      </Col>
                      <Col span={is4x3 ? 10 : 8}>
                        <Card title="温度分布" size="small" variant="borderless">
                          <ReactECharts option={distributionOption} style={{ height: 250 }} />
                        </Card>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'history',
                label: <span><AreaChartOutlined /> 历史曲线</span>,
                children: (
                  <div style={{ height: '100%', overflow: 'auto', padding: '16px 0' }}>
                    <Card
                      title="温度历史曲线"
                      size="small"
                      variant="borderless"
                      extra={
                        <Space>
                          <Select
                            mode="multiple"
                            value={selectedZones}
                            onChange={setSelectedZones}
                            style={{ width: 200 }}
                            placeholder="选择区域"
                            maxTagCount={2}
                            size="small"
                          >
                            {allZones.map(zone => <Select.Option key={zone} value={zone}>{zone}</Select.Option>)}
                          </Select>
                          <Select value={timeRange} onChange={setTimeRange} style={{ width: 100 }} size="small">
                            <Select.Option value="1h">1小时</Select.Option>
                            <Select.Option value="6h">6小时</Select.Option>
                            <Select.Option value="24h">24小时</Select.Option>
                            <Select.Option value="7d">7天</Select.Option>
                          </Select>
                        </Space>
                      }
                    >
                      {selectedZones.length > 0 ? (
                        <ReactECharts option={historyChartOption} style={{ height: 350 }} />
                      ) : (
                        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                          请选择至少一个区域
                        </div>
                      )}
                    </Card>
                  </div>
                ),
              },
              {
                key: 'alerts',
                label: <span><HistoryOutlined /> 告警记录</span>,
                children: (
                  <div style={{ height: '100%', overflow: 'auto', padding: '16px 0' }}>
                    <Card title="温度告警记录" size="small" variant="borderless">
                      <Table 
                        columns={alertColumns} 
                        dataSource={tempAlerts} 
                        rowKey="id"
                        pagination={{ pageSize: 10, size: 'small' }}
                        size="small"
                      />
                    </Card>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default TemperaturePage;
