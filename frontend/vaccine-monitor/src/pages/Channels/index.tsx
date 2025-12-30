import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Switch,
  Popconfirm,
  Tooltip,
  Progress,
  Tabs,
  Badge,
  Input,
} from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SwapOutlined,
  ExportOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import ChannelMatrix from '../../components/ChannelMatrix';
import ChannelDetailModal from '../../components/ChannelDetailModal';
import { api } from '../../services/api';
import { useDisplayMode } from '../../hooks/useDisplayMode';

const { Title, Text } = Typography;

interface ChannelData {
  id: number;
  position: string;
  rowIndex: string;
  colIndex: number;
  vaccineName?: string;
  vaccineCode?: string;
  quantity: number;
  capacity: number;
  status: number;
  temperature?: number;
}

const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  
  // 显示模式配置
  const { config, is4x3 } = useDisplayMode();

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  
  // 筛选和搜索
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/channels');
      // API 返回 { total, list } 格式
      const data = response.data.data;
      setChannels(Array.isArray(data) ? data : (data?.list || []));
    } catch (error) {
      console.error('获取货道列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setDetailModalVisible(true);
  };

  const handleConfigChannel = (channel: ChannelData) => {
    setSelectedChannel(channel);
    form.setFieldsValue({
      vaccineId: channel.vaccineCode, // 这里假设用code匹配
      maxCapacity: channel.capacity,
      status: channel.status === 1,
      alertThreshold: 5,
    });
    setConfigModalVisible(true);
  };

  const handleSaveConfig = async (values: any) => {
    try {
      await api.put(`/channels/${selectedChannel?.id}`, values);
      message.success('配置已保存');
      setConfigModalVisible(false);
      fetchChannels();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const handleToggleStatus = async (channel: ChannelData, status: number) => {
    try {
      await api.patch(`/channels/${channel.id}/status`, { status });
      message.success(status === 1 ? '货道已启用' : '货道已停用');
      fetchChannels();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleBatchOperation = async (values: any) => {
    try {
      await api.post('/channels/batch', {
        ids: selectedRowKeys,
        ...values,
      });
      message.success('批量操作成功');
      setBatchModalVisible(false);
      setSelectedRowKeys([]);
      fetchChannels();
    } catch (error) {
      console.error('批量操作失败:', error);
    }
  };

  // 过滤数据
  const filteredChannels = channels.filter(channel => {
    const matchSearch = 
      channel.position.toLowerCase().includes(searchText.toLowerCase()) ||
      (channel.vaccineName && channel.vaccineName.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchStatus = filterStatus === null || channel.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  // 统计数据
  const stats = {
    total: channels.length,
    normal: channels.filter(c => c.status === 1).length,
    fault: channels.filter(c => c.status === 2).length,
    disabled: channels.filter(c => c.status === 0).length,
    empty: channels.filter(c => c.quantity === 0).length,
    totalStock: channels.reduce((sum, c) => sum + c.quantity, 0),
    totalCapacity: channels.reduce((sum, c) => sum + c.capacity, 0),
  };

  const columns = [
    { title: '位置', dataIndex: 'position', key: 'position', width: 80, fixed: 'left' as const },
    { 
      title: '疫苗名称', 
      dataIndex: 'vaccineName', 
      key: 'vaccineName',
      render: (text: string) => text || <Text type="secondary">未配置</Text>
    },
    {
      title: '库存',
      key: 'quantity',
      width: 150,
      render: (_: any, record: ChannelData) => (
        <Space>
          <Progress 
            percent={Math.round((record.quantity / record.capacity) * 100)} 
            steps={5}
            size="small"
            strokeColor={record.quantity < 5 ? '#faad14' : '#52c41a'}
            showInfo={false}
          />
          <span>{record.quantity}/{record.capacity}</span>
        </Space>
      ),
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 80,
      render: (temp: number) => {
        if (!temp) return '-';
        const isNormal = temp >= 2 && temp <= 8;
        return (
          <span style={{ color: isNormal ? '#52c41a' : '#ff4d4f' }}>
            {temp.toFixed(1)}°C
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '正常', value: 1 },
        { text: '故障', value: 2 },
        { text: '停用', value: 0 },
      ],
      onFilter: (value: any, record: ChannelData) => record.status === value,
      render: (status: number) => {
        const statusMap: Record<number, { color: string; text: string; icon: React.ReactNode }> = {
          1: { color: 'success', text: '正常', icon: <CheckCircleOutlined /> },
          2: { color: 'error', text: '故障', icon: <WarningOutlined /> },
          0: { color: 'default', text: '停用', icon: <StopOutlined /> },
        };
        const item = statusMap[status] || statusMap[0];
        return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ChannelData) => (
        <Space size="small">
          <Tooltip title="配置">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => handleConfigChannel(record)}
            />
          </Tooltip>
          {record.status === 1 ? (
            <Popconfirm
              title="确定要停用此货道吗？"
              onConfirm={() => handleToggleStatus(record, 0)}
            >
              <Tooltip title="停用">
                <Button type="text" size="small" icon={<StopOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="启用">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleToggleStatus(record, 1)}
              />
            </Tooltip>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleChannelClick(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Title level={is4x3 ? 5 : 4} style={{ margin: 0, fontSize: config.fontSize.title }}>
          <AppstoreOutlined /> 货道管理
        </Title>
      </div>

      {/* 统计卡片 - 固定高度 */}
      <Row gutter={config.gutter} style={{ flexShrink: 0 }}>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic 
              title="货道总数" 
              value={stats.total} 
              suffix="个"
              valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(1)} hoverable>
            <Statistic
              title="正常"
              value={stats.normal}
              valueStyle={{ color: '#52c41a', fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(2)} hoverable>
            <Statistic
              title="故障"
              value={stats.fault}
              valueStyle={{ 
                color: stats.fault > 0 ? '#ff4d4f' : undefined,
                fontSize: config.statisticCard.valueSize - 4,
                fontWeight: 600
              }}
              prefix={stats.fault > 0 ? <WarningOutlined /> : null}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(0)} hoverable>
            <Statistic
              title="停用"
              value={stats.disabled}
              valueStyle={{ color: '#999', fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic
              title="空货道"
              value={stats.empty}
              valueStyle={{ color: stats.empty > 0 ? '#faad14' : undefined, fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic
              title="库存总量"
              value={stats.totalStock}
              suffix={`/ ${stats.totalCapacity}`}
              valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 视图区域 - 自适应剩余高度 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Card 
          variant="borderless" 
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' } }}
        >
          <Tabs
            size={is4x3 ? 'small' : 'middle'}
            style={{ height: '100%', padding: '0 16px' }}
            tabBarStyle={{ margin: '0 0 16px 0' }}
            items={[
              {
                key: 'matrix',
                label: <span><AppstoreOutlined /> 矩阵视图</span>,
                children: (
                  <div style={{ height: '100%', overflow: 'hidden', paddingBottom: 16 }}>
                    <ChannelMatrix onChannelClick={handleChannelClick} />
                  </div>
                ),
              },
              {
                key: 'table',
                label: <span><UnorderedListOutlined /> 列表视图</span>,
                children: (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 16 }}>
                     <Space style={{ marginBottom: 16 }}>
                        <Input
                          placeholder="搜索货道/疫苗"
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          style={{ width: is4x3 ? 160 : 200 }}
                          size={config.componentSize}
                          allowClear
                        />
                        {filterStatus !== null && (
                          <Button size={config.buttonSize} onClick={() => setFilterStatus(null)}>
                            清除筛选
                          </Button>
                        )}
                        <Button size={config.buttonSize} icon={<ReloadOutlined />} onClick={fetchChannels}>
                          刷新
                        </Button>
                        {selectedRowKeys.length > 0 && (
                          <Button
                            type="primary"
                            size={config.buttonSize}
                            icon={<SwapOutlined />}
                            onClick={() => setBatchModalVisible(true)}
                          >
                            批量操作 ({selectedRowKeys.length})
                          </Button>
                        )}
                        <Button size={config.buttonSize} icon={<ExportOutlined />}>导出</Button>
                     </Space>
                     <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredChannels}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: false,
                        showTotal: (total) => `共 ${total} 条`,
                        size: 'small'
                      }}
                      size="small"
                      scroll={{ y: 350 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* 货道详情弹窗 */}
      <ChannelDetailModal
        visible={detailModalVisible}
        channel={selectedChannel}
        onClose={() => setDetailModalVisible(false)}
        onRefresh={fetchChannels}
      />

      {/* 配置货道弹窗 */}
      <Modal
        title={<><SettingOutlined /> 配置货道 - {selectedChannel?.position}</>}
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          form.resetFields();
        }}
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
              showSearch
              optionFilterProp="children"
            >
              <Select.Option value="HBV-R">乙肝疫苗（重组）- 深圳康泰</Select.Option>
              <Select.Option value="FLU-4V">流感疫苗（四价）- 华兰生物</Select.Option>
              <Select.Option value="RAB-V">狂犬疫苗（Vero细胞）- 辽宁成大</Select.Option>
              <Select.Option value="DTaP">百白破疫苗 - 武汉生物</Select.Option>
              <Select.Option value="MMR">麻腮风疫苗 - 北京科兴</Select.Option>
              <Select.Option value="IPV">脊灰灭活疫苗 - 北京北生研</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="maxCapacity"
            label="最大容量"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="alertThreshold"
            label="补货阈值"
            tooltip="当库存低于此值时发出预警"
          >
            <InputNumber min={0} max={20} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal
        title={`批量操作 - 已选 ${selectedRowKeys.length} 个货道`}
        open={batchModalVisible}
        onCancel={() => {
          setBatchModalVisible(false);
          batchForm.resetFields();
        }}
        onOk={() => batchForm.submit()}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchOperation}
        >
          <Form.Item
            name="action"
            label="操作类型"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="enable">批量启用</Select.Option>
              <Select.Option value="disable">批量停用</Select.Option>
              <Select.Option value="clear">清空库存</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChannelsPage;
