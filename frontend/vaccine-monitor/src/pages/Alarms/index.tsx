import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Timeline,
  Descriptions,
  Alert,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  SoundOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface AlarmItem {
  id: number;
  code: string;
  type: string;
  level: number;
  source: string;
  message: string;
  status: number; // 0未处理 1处理中 2已处理 3已忽略
  createTime: string;
  handleTime?: string;
  handler?: string;
  handleResult?: string;
}

const AlarmsPage: React.FC = () => {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  
  // 显示模式配置
  const { config, is4x3 } = useDisplayMode();
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [form] = Form.useForm();
  
  const { alarms: wsAlarms } = useWebSocket();

  useEffect(() => {
    fetchAlarms();
  }, [filterLevel, filterStatus]);

  // WebSocket 新报警通知
  useEffect(() => {
    if (wsAlarms && wsAlarms.length > 0) {
      const latestAlarm = wsAlarms[0];
      message.warning({
        content: (
          <span>
            <BellOutlined /> 新报警: {latestAlarm.message}
          </span>
        ),
        duration: 5,
      });
    }
  }, [wsAlarms]);

  const fetchAlarms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alarms', {
        params: { level: filterLevel, status: filterStatus, limit: 50 },
      });
      setAlarms(response.data.data.list || []);
    } catch (error) {
      console.error('获取报警失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const levelMap: Record<number, { color: string; text: string; icon: React.ReactNode }> = {
    1: { color: 'blue', text: '提示', icon: <InfoCircleOutlined /> },
    2: { color: 'orange', text: '警告', icon: <WarningOutlined /> },
    3: { color: 'red', text: '严重', icon: <ExclamationCircleOutlined /> },
    4: { color: 'magenta', text: '紧急', icon: <SoundOutlined /> },
  };

  const statusMap: Record<number, { color: string; text: string; badge: 'error' | 'processing' | 'success' | 'default' }> = {
    0: { color: 'error', text: '未处理', badge: 'error' },
    1: { color: 'processing', text: '处理中', badge: 'processing' },
    2: { color: 'success', text: '已处理', badge: 'success' },
    3: { color: 'default', text: '已忽略', badge: 'default' },
  };

  // 处理报警
  const handleAlarm = async (values: any) => {
    if (!selectedAlarm) return;
    
    setAlarms(alarms.map(a =>
      a.id === selectedAlarm.id
        ? {
            ...a,
            status: 2,
            handleTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            handler: '当前用户',
            handleResult: values.result,
          }
        : a
    ));
    
    message.success('报警处理成功');
    setHandleModalVisible(false);
    form.resetFields();
    setSelectedAlarm(null);
  };

  // 忽略报警
  const handleIgnore = (alarm: AlarmItem) => {
    setAlarms(alarms.map(a =>
      a.id === alarm.id
        ? {
            ...a,
            status: 3,
            handleTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            handler: '当前用户',
            handleResult: '已忽略',
          }
        : a
    ));
    message.success('已忽略该报警');
  };

  // 批量处理
  const handleBatchProcess = () => {
    const pendingAlarms = alarms.filter(a => a.status === 0);
    if (pendingAlarms.length === 0) {
      message.info('没有待处理的报警');
      return;
    }
    
    Modal.confirm({
      title: '批量处理报警',
      content: `确定要将 ${pendingAlarms.length} 条未处理报警标记为已处理吗？`,
      onOk: () => {
        setAlarms(alarms.map(a =>
          a.status === 0
            ? {
                ...a,
                status: 2,
                handleTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                handler: '当前用户',
                handleResult: '批量处理',
              }
            : a
        ));
        message.success(`已处理 ${pendingAlarms.length} 条报警`);
      },
    });
  };

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (l: number) => (
        <Tooltip title={levelMap[l]?.text}>
          <Tag color={levelMap[l]?.color} icon={levelMap[l]?.icon}>
            {levelMap[l]?.text}
          </Tag>
        </Tooltip>
      ),
      filters: [
        { text: '提示', value: 1 },
        { text: '警告', value: 2 },
        { text: '严重', value: 3 },
        { text: '紧急', value: 4 },
      ],
      onFilter: (value: any, record: AlarmItem) => record.level === value,
    },
    { 
      title: '报警类型', 
      dataIndex: 'type', 
      key: 'type',
      width: 120,
    },
    { 
      title: '来源', 
      dataIndex: 'source', 
      key: 'source',
      width: 100,
      render: (s: string) => <Tag>{s}</Tag>,
    },
    { 
      title: '报警信息', 
      dataIndex: 'message', 
      key: 'message',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: number) => (
        <Badge status={statusMap[s]?.badge} text={statusMap[s]?.text} />
      ),
      filters: [
        { text: '未处理', value: 0 },
        { text: '处理中', value: 1 },
        { text: '已处理', value: 2 },
        { text: '已忽略', value: 3 },
      ],
      onFilter: (value: any, record: AlarmItem) => record.status === value,
    },
    { 
      title: '时间', 
      dataIndex: 'createTime', 
      key: 'createTime',
      width: 160,
      sorter: (a: AlarmItem, b: AlarmItem) => 
        dayjs(a.createTime).unix() - dayjs(b.createTime).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: AlarmItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedAlarm(record);
              setDetailModalVisible(true);
            }}
          >
            详情
          </Button>
          {record.status === 0 && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => {
                  setSelectedAlarm(record);
                  setHandleModalVisible(true);
                }}
              >
                处理
              </Button>
              <Popconfirm
                title="确定要忽略此报警吗？"
                onConfirm={() => handleIgnore(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<CloseOutlined />}
                  style={{ color: '#999' }}
                >
                  忽略
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: alarms.length,
    pending: alarms.filter(a => a.status === 0).length,
    critical: alarms.filter(a => a.level >= 3 && a.status === 0).length,
    todayHandled: alarms.filter(a => 
      a.status === 2 && 
      dayjs(a.handleTime).isAfter(dayjs().startOf('day'))
    ).length,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={is4x3 ? 5 : 4} style={{ margin: 0, fontSize: config.fontSize.title }}>
          <BellOutlined /> 报警中心
          {stats.pending > 0 && (
            <Badge count={stats.pending} style={{ marginLeft: 8 }} />
          )}
        </Title>
        <Space>
          <Button size={config.buttonSize} icon={<ReloadOutlined />} onClick={fetchAlarms}>刷新</Button>
        </Space>
      </div>

      {/* 紧急报警提示 */}
      {stats.critical > 0 && (
        <Alert
          message="紧急报警"
          description={`当前有 ${stats.critical} 条严重/紧急报警待处理，请立即处理！`}
          type="error"
          showIcon
          icon={<SoundOutlined />}
          style={{ flexShrink: 0 }}
          closable
          action={
            <Button danger size={config.buttonSize} onClick={() => setFilterLevel(3)}>
              查看紧急报警
            </Button>
          }
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={config.gutter} style={{ flexShrink: 0 }}>
        <Col span={6}>
          <Card size="small" variant="borderless">
            <Statistic 
              title="全部报警" 
              value={stats.total}
              valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            size="small" 
            variant="borderless"
            hoverable
            style={{ cursor: 'pointer' }} 
            onClick={() => setFilterStatus(0)}
          >
            <Statistic
              title="待处理"
              value={stats.pending}
              valueStyle={{ 
                color: stats.pending > 0 ? '#ff4d4f' : undefined,
                fontSize: config.statisticCard.valueSize - 4,
                fontWeight: 600
              }}
              prefix={stats.pending > 0 ? <ExclamationCircleOutlined /> : null}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            size="small"
            variant="borderless"
            hoverable
            style={{ cursor: 'pointer' }}
            onClick={() => setFilterLevel(3)}
          >
            <Statistic
              title="严重/紧急"
              value={stats.critical}
              valueStyle={{ 
                color: stats.critical > 0 ? '#ff4d4f' : '#52c41a',
                fontSize: config.statisticCard.valueSize - 4,
                fontWeight: 600
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" variant="borderless">
            <Statistic
              title="今日已处理"
              value={stats.todayHandled}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 表格区域 - 自适应高度 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Card
          variant="borderless"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden', padding: '0 16px 16px' } }}
          extra={
            <Space style={{ padding: '12px 0' }}>
              {(filterLevel !== null || filterStatus !== null) && (
                <Button 
                  size={config.buttonSize}
                  onClick={() => {
                    setFilterLevel(null);
                    setFilterStatus(null);
                  }}
                >
                  清除筛选
                </Button>
              )}
              <Button 
                type="primary" 
                size={config.buttonSize}
                icon={<CheckOutlined />}
                onClick={handleBatchProcess}
                disabled={stats.pending === 0}
              >
                批量处理
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={alarms}
            rowKey="id"
            loading={loading}
            size={config.tableSize}
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              size: 'small'
            }}
            scroll={{ y: 350 }}
            rowClassName={(record) => 
              record.status === 0 && record.level >= 3 ? 'alarm-critical-row' : ''
            }
          />
        </Card>
      </div>

      {/* 报警详情弹窗 */}
      <Modal
        title={
          <Space>
            <BellOutlined />
            报警详情
            {selectedAlarm && (
              <Tag color={levelMap[selectedAlarm.level]?.color}>
                {levelMap[selectedAlarm.level]?.text}
              </Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAlarm(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedAlarm?.status === 0 && (
            <Button
              key="handle"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                setHandleModalVisible(true);
              }}
            >
              处理报警
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedAlarm && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="报警编码" span={2}>
                      <Text copyable>{selectedAlarm.code}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="报警类型">
                      {selectedAlarm.type}
                    </Descriptions.Item>
                    <Descriptions.Item label="报警级别">
                      <Tag color={levelMap[selectedAlarm.level]?.color}>
                        {levelMap[selectedAlarm.level]?.text}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="来源">
                      <Tag>{selectedAlarm.source}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Badge
                        status={statusMap[selectedAlarm.status]?.badge}
                        text={statusMap[selectedAlarm.status]?.text}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="报警信息" span={2}>
                      <Paragraph style={{ margin: 0 }}>
                        {selectedAlarm.message}
                      </Paragraph>
                    </Descriptions.Item>
                    <Descriptions.Item label="发生时间" span={2}>
                      {selectedAlarm.createTime}
                    </Descriptions.Item>
                    {selectedAlarm.handleTime && (
                      <>
                        <Descriptions.Item label="处理时间">
                          {selectedAlarm.handleTime}
                        </Descriptions.Item>
                        <Descriptions.Item label="处理人">
                          {selectedAlarm.handler}
                        </Descriptions.Item>
                        <Descriptions.Item label="处理结果" span={2}>
                          {selectedAlarm.handleResult}
                        </Descriptions.Item>
                      </>
                    )}
                  </Descriptions>
                ),
              },
              {
                key: 'timeline',
                label: '处理流程',
                children: (
                  <Timeline
                    items={[
                      {
                        color: 'red',
                        children: (
                          <>
                            <p><strong>报警触发</strong></p>
                            <p style={{ color: '#999' }}>{selectedAlarm.createTime}</p>
                            <p>{selectedAlarm.message}</p>
                          </>
                        ),
                      },
                      selectedAlarm.status >= 1 && selectedAlarm.status !== 3 ? {
                        color: 'blue',
                        children: (
                          <>
                            <p><strong>开始处理</strong></p>
                            <p style={{ color: '#999' }}>处理人: {selectedAlarm.handler}</p>
                          </>
                        ),
                      } : null,
                      selectedAlarm.status === 2 ? {
                        color: 'green',
                        children: (
                          <>
                            <p><strong>处理完成</strong></p>
                            <p style={{ color: '#999' }}>{selectedAlarm.handleTime}</p>
                            <p>结果: {selectedAlarm.handleResult}</p>
                          </>
                        ),
                      } : selectedAlarm.status === 3 ? {
                        color: 'gray',
                        children: (
                          <>
                            <p><strong>已忽略</strong></p>
                            <p style={{ color: '#999' }}>{selectedAlarm.handleTime}</p>
                          </>
                        ),
                      } : {
                        color: 'gray',
                        children: <p style={{ color: '#999' }}>等待处理...</p>,
                      },
                    ].filter(Boolean) as any[]}
                  />
                ),
              },
              {
                key: 'suggestion',
                label: '处理建议',
                children: (
                  <div>
                    {selectedAlarm.type === '温度预警' && (
                      <Alert
                        message="温度预警处理建议"
                        description={
                          <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>检查制冷设备运行状态</li>
                            <li>确认温度传感器是否正常</li>
                            <li>检查冷库门是否关闭良好</li>
                            <li>如温度持续异常，考虑转移疫苗</li>
                            <li>记录温度异常时长，评估疫苗质量影响</li>
                          </ol>
                        }
                        type="info"
                        showIcon
                      />
                    )}
                    {selectedAlarm.type === '库存不足' && (
                      <Alert
                        message="库存预警处理建议"
                        description={
                          <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>确认当前库存数量</li>
                            <li>查看近期预约接种量</li>
                            <li>联系上级配送中心补货</li>
                            <li>必要时调整预约安排</li>
                          </ol>
                        }
                        type="warning"
                        showIcon
                      />
                    )}
                    {selectedAlarm.type === '设备离线' && (
                      <Alert
                        message="设备异常处理建议"
                        description={
                          <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>检查设备电源及网络连接</li>
                            <li>尝试重启设备</li>
                            <li>检查通信线路是否正常</li>
                            <li>如无法恢复，联系设备维护人员</li>
                          </ol>
                        }
                        type="error"
                        showIcon
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* 处理报警弹窗 */}
      <Modal
        title={<><CheckOutlined style={{ color: '#52c41a' }} /> 处理报警</>}
        open={handleModalVisible}
        onCancel={() => {
          setHandleModalVisible(false);
          form.resetFields();
          setSelectedAlarm(null);
        }}
        onOk={() => form.submit()}
        okText="确认处理"
        cancelText="取消"
      >
        {selectedAlarm && (
          <>
            <Alert
              message={selectedAlarm.message}
              description={`来源: ${selectedAlarm.source} | 时间: ${selectedAlarm.createTime}`}
              type={selectedAlarm.level >= 3 ? 'error' : 'warning'}
              style={{ marginBottom: 16 }}
            />
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAlarm}
            >
              <Form.Item
                name="action"
                label="处理方式"
                rules={[{ required: true, message: '请选择处理方式' }]}
              >
                <Select placeholder="选择处理方式">
                  <Select.Option value="fixed">已修复</Select.Option>
                  <Select.Option value="adjusted">已调整</Select.Option>
                  <Select.Option value="replaced">已更换</Select.Option>
                  <Select.Option value="reported">已上报</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="result"
                label="处理结果"
                rules={[{ required: true, message: '请填写处理结果' }]}
              >
                <Input.TextArea
                  placeholder="请详细描述处理过程和结果"
                  rows={4}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <style>{`
        .alarm-critical-row {
          background-color: #fff1f0 !important;
        }
        .alarm-critical-row:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default AlarmsPage;
