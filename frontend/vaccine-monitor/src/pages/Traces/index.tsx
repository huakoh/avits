import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Timeline,
  Typography,
  Descriptions,
  Tag,
  Empty,
  Row,
  Col,
  Tabs,
  Space,
  message,
  Divider,
  Alert,
  Statistic,
  List,
  Avatar,
  Spin,
  QRCode,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  ScanOutlined,
  PrinterOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { generateTraceData } from '../../services/mockData';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface TraceResult {
  traceCode: string;
  vaccine: {
    name: string;
    code: string;
    manufacturer: string;
    spec: string;
    batchNo: string;
    productionDate: string;
    expiryDate: string;
  };
  timeline: Array<{
    time: string;
    event: string;
    operator: string;
    location: string;
    temperature?: string;
    orderNo?: string;
    recipient?: string;
    result?: string;
  }>;
  temperatureLog: Array<{
    time: string;
    temperature: number;
  }>;
}

// 生成完整追溯数据
const generateFullTraceData = (code: string): TraceResult => {
  const baseData = generateTraceData(code);
  return baseData as TraceResult;
};

const TracesPage: React.FC = () => {
  const [traceCode, setTraceCode] = useState('');
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'TC20241229001234567890',
    'TC20241228009876543210',
    'TC20241227005555666677',
  ]);

  // 显示模式配置
  const { config, is4x3 } = useDisplayMode();

  const handleSearch = (value: string) => {
    if (!value || value.length < 10) {
      message.warning('请输入有效的溯源码（至少10位）');
      return;
    }
    
    setLoading(true);
    setTraceCode(value);
    
    // 模拟API请求
    setTimeout(() => {
      const result = generateFullTraceData(value);
      setTraceResult(result);
      setLoading(false);
      
      // 添加到最近搜索
      if (!recentSearches.includes(value)) {
        setRecentSearches([value, ...recentSearches.slice(0, 4)]);
      }
      
      message.success('查询成功');
    }, 800);
  };

  // 快速查询
  const handleQuickSearch = (code: string) => {
    handleSearch(code);
  };

  // 打印追溯单
  const handlePrint = () => {
    message.success('正在生成打印预览...');
    window.print();
  };

  // 下载报告
  const handleDownload = () => {
    message.success('正在生成追溯报告...');
  };

  // 温度曲线图配置
  const tempChartOption = traceResult ? {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `${dayjs(data.axisValue).format('MM-DD HH:mm')}<br/>温度: ${data.value}°C`;
      },
    },
    xAxis: {
      type: 'category',
      data: traceResult.temperatureLog.map(t => t.time),
      axisLabel: {
        formatter: (value: string) => dayjs(value).format('HH:mm'),
        interval: 3,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { formatter: '{value}°C' },
    },
    series: [{
      type: 'line',
      data: traceResult.temperatureLog.map(t => t.temperature),
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
          { yAxis: 8, lineStyle: { color: '#ff4d4f', type: 'dashed' } },
          { yAxis: 2, lineStyle: { color: '#ff4d4f', type: 'dashed' } },
        ],
      },
    }],
    grid: { top: 20, right: 20, bottom: 30, left: 45 },
  } : {};

  // 获取状态颜色和文本
  const getStatusInfo = () => {
    if (!traceResult) return { color: 'default', text: '未知', icon: null };
    
    const lastEvent = traceResult.timeline[traceResult.timeline.length - 1];
    if (lastEvent.event.includes('接种')) {
      return { color: 'success', text: '已接种', icon: <CheckCircleOutlined /> };
    } else if (lastEvent.event.includes('出库')) {
      return { color: 'processing', text: '已出库', icon: <ThunderboltOutlined /> };
    } else {
      return { color: 'warning', text: '在库', icon: <EnvironmentOutlined /> };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <Title level={is4x3 ? 5 : 4} style={{ margin: 0, fontSize: config.fontSize.title }}>
          <SearchOutlined /> 追溯查询
        </Title>
      </div>

      {/* 搜索区域 */}
      <Card style={{ flexShrink: 0 }} size="small" variant="borderless">
        <Row gutter={config.gutter} align="middle">
          <Col flex="auto">
            <Search
              placeholder="请输入疫苗溯源码 / 扫描条形码"
              allowClear
              size={config.componentSize}
              enterButton={
                <Space>
                  <SearchOutlined /> 查询
                </Space>
              }
              size="large"
              loading={loading}
              onSearch={handleSearch}
              style={{ maxWidth: 600 }}
            />
          </Col>
          <Col>
            <Button size="large" icon={<ScanOutlined />}>
              扫码查询
            </Button>
          </Col>
        </Row>
        
        {/* 最近搜索 */}
        {recentSearches.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">最近查询：</Text>
            <Space style={{ marginLeft: 8 }} wrap>
              {recentSearches.map((code, index) => (
                <Tag
                  key={index}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleQuickSearch(code)}
                >
                  {code.substring(0, 15)}...
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>

      {/* 加载状态 */}
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在查询追溯信息...</p>
          </div>
        </Card>
      )}

      {/* 查询结果 - 可滚动区域 */}
      {!loading && traceResult && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {/* 追溯概览 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={16}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="当前状态"
                      value={statusInfo.text}
                      prefix={statusInfo.icon}
                      valueStyle={{
                        color: statusInfo.color === 'success' ? '#52c41a' :
                               statusInfo.color === 'processing' ? '#1890ff' : '#faad14',
                      }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="流转环节"
                      value={traceResult.timeline.length}
                      suffix="步"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="温度记录"
                      value={traceResult.temperatureLog.length}
                      suffix="条"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="有效期"
                      value={dayjs(traceResult.vaccine.expiryDate).diff(dayjs(), 'day')}
                      suffix="天"
                      valueStyle={{
                        color: dayjs(traceResult.vaccine.expiryDate).diff(dayjs(), 'day') < 30 ? '#faad14' : undefined,
                      }}
                    />
                  </Col>
                </Row>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                    打印追溯单
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                    下载报告
                  </Button>
                  <Button icon={<ShareAltOutlined />}>
                    分享
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Tabs
            items={[
              {
                key: 'info',
                label: '疫苗信息',
                children: (
                  <Row gutter={16}>
                    <Col span={16}>
                      <Card>
                        <Descriptions bordered column={2} size="small">
                          <Descriptions.Item label="溯源码" span={2}>
                            <Text copyable strong style={{ fontSize: 16 }}>
                              {traceResult.traceCode}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="疫苗名称" span={2}>
                            <Text strong>{traceResult.vaccine.name}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="疫苗编码">
                            {traceResult.vaccine.code}
                          </Descriptions.Item>
                          <Descriptions.Item label="规格">
                            {traceResult.vaccine.spec}
                          </Descriptions.Item>
                          <Descriptions.Item label="生产厂家" span={2}>
                            {traceResult.vaccine.manufacturer}
                          </Descriptions.Item>
                          <Descriptions.Item label="批次号">
                            <Text copyable>{traceResult.vaccine.batchNo}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="生产日期">
                            {traceResult.vaccine.productionDate}
                          </Descriptions.Item>
                          <Descriptions.Item label="有效期至">
                            {dayjs(traceResult.vaccine.expiryDate).diff(dayjs(), 'day') < 30 ? (
                              <Tag color="warning">{traceResult.vaccine.expiryDate}</Tag>
                            ) : (
                              traceResult.vaccine.expiryDate
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="当前状态">
                            <Tag icon={statusInfo.icon} color={statusInfo.color}>
                              {statusInfo.text}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                        
                        <Divider />
                        
                        <Alert
                          message="疫苗验证通过"
                          description="该疫苗信息已通过国家药品监督管理局追溯系统验证，来源合法、质量可靠。"
                          type="success"
                          showIcon
                          icon={<SafetyCertificateOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="追溯二维码" style={{ textAlign: 'center' }}>
                        <QRCode
                          value={`https://trace.nmpa.gov.cn/vaccine/${traceResult.traceCode}`}
                          size={180}
                          style={{ margin: '0 auto' }}
                        />
                        <div style={{ marginTop: 16 }}>
                          <Text type="secondary">扫描验证疫苗真伪</Text>
                        </div>
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          style={{ marginTop: 8 }}
                        >
                          下载二维码
                        </Button>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'timeline',
                label: '流转记录',
                children: (
                  <Card>
                    <Timeline
                      mode="left"
                      items={traceResult.timeline.map((item, index) => ({
                        color: index === traceResult.timeline.length - 1 ? 'green' : 'blue',
                        label: (
                          <div style={{ width: 150 }}>
                            <Text type="secondary">{dayjs(item.time).format('YYYY-MM-DD')}</Text>
                            <br />
                            <Text type="secondary">{dayjs(item.time).format('HH:mm:ss')}</Text>
                          </div>
                        ),
                        children: (
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Space direction="vertical" size={4}>
                              <Text strong style={{ fontSize: 16 }}>{item.event}</Text>
                              <Space split={<Divider type="vertical" />}>
                                <span>
                                  <EnvironmentOutlined /> {item.location}
                                </span>
                                <span>
                                  <UserOutlined /> {item.operator}
                                </span>
                              </Space>
                              {item.temperature && (
                                <Tag color="blue">温度: {item.temperature}</Tag>
                              )}
                              {item.orderNo && (
                                <Text type="secondary">订单号: {item.orderNo}</Text>
                              )}
                              {item.recipient && (
                                <Text type="secondary">接种者: {item.recipient}</Text>
                              )}
                              {item.result && (
                                <Tag color="green">{item.result}</Tag>
                              )}
                            </Space>
                          </Card>
                        ),
                      }))}
                    />
                  </Card>
                ),
              },
              {
                key: 'temperature',
                label: '温度记录',
                children: (
                  <Card>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={6}>
                        <Statistic
                          title="平均温度"
                          value={(traceResult.temperatureLog.reduce((sum, t) => sum + t.temperature, 0) / 
                                  traceResult.temperatureLog.length).toFixed(1)}
                          suffix="°C"
                          prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="最低温度"
                          value={Math.min(...traceResult.temperatureLog.map(t => t.temperature)).toFixed(1)}
                          suffix="°C"
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="最高温度"
                          value={Math.max(...traceResult.temperatureLog.map(t => t.temperature)).toFixed(1)}
                          suffix="°C"
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="温度状态"
                          value="正常"
                          prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
                        />
                      </Col>
                    </Row>
                    
                    <ReactECharts option={tempChartOption} style={{ height: 300 }} />
                    
                    <Alert
                      message="冷链完整"
                      description="该疫苗在存储和运输全程温度均保持在2-8°C安全范围内，冷链完整。"
                      type="success"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* 未查询状态 */}
      {!loading && !traceResult && (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                请输入溯源码进行查询
                <br />
                <Text type="secondary">支持手动输入或扫描条形码</Text>
              </span>
            }
          >
            <Button type="primary" icon={<ScanOutlined />} size="large">
              扫码查询
            </Button>
          </Empty>
          
          <Divider>或查询示例</Divider>
          
          <Row gutter={16} justify="center">
            {['TC20241229001234567890', 'TC20241228009876543210'].map((code, index) => (
              <Col key={index}>
                <Button onClick={() => handleQuickSearch(code)}>
                  查询示例 {index + 1}
                </Button>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default TracesPage;
