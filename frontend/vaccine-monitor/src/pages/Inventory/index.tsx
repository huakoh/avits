import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  message,
  Tabs,
  Progress,
  Alert,
  Descriptions,
  Timeline,
  Badge,
  Tooltip,
} from 'antd';
import {
  DatabaseOutlined,
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  EyeOutlined,
  PrinterOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { api } from '../../services/api';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface InventoryItem {
  id: number;
  vaccineId: number;
  vaccineName: string;
  vaccineCode: string;
  manufacturer: string;
  batchNo: string;
  traceCode: string;
  quantity: number;
  channelPosition: string;
  productionDate: string;
  expiryDate: string;
  inboundTime: string;
  status: number; // 1在库 2已出库 3已冻结
  price?: number;
}

interface InventoryRecord {
  id: number;
  type: 'inbound' | 'outbound' | 'check';
  vaccineName: string;
  quantity: number;
  operator: string;
  time: string;
  orderNo?: string;
}

// 生成模拟数据
const generateInventoryData = (): InventoryItem[] => {
  const vaccines = [
    { id: 1, name: '乙肝疫苗（重组）', code: 'HBV-R', manufacturer: '深圳康泰', price: 68 },
    { id: 2, name: '流感疫苗（四价）', code: 'FLU-4V', manufacturer: '华兰生物', price: 128 },
    { id: 3, name: '狂犬疫苗（Vero细胞）', code: 'RAB-V', manufacturer: '辽宁成大', price: 298 },
    { id: 4, name: '百白破疫苗', code: 'DTaP', manufacturer: '武汉生物', price: 0 },
    { id: 5, name: '麻腮风疫苗', code: 'MMR', manufacturer: '北京科兴', price: 0 },
    { id: 6, name: '水痘疫苗', code: 'VZV', manufacturer: '长春祈健', price: 168 },
    { id: 7, name: 'HPV疫苗（九价）', code: 'HPV9', manufacturer: '默沙东', price: 1298 },
    { id: 8, name: '肺炎球菌疫苗（13价）', code: 'PCV13', manufacturer: '辉瑞', price: 698 },
  ];
  
  const data: InventoryItem[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  vaccines.forEach((vaccine, vi) => {
    const channelCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < channelCount; i++) {
      const row = rows[Math.floor(Math.random() * rows.length)];
      const col = Math.floor(Math.random() * 10) + 1;
      const quantity = Math.floor(Math.random() * 18) + 2;
      const daysToExpiry = Math.floor(Math.random() * 365) + 30;
      
      data.push({
        id: vi * 10 + i + 1,
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        vaccineCode: vaccine.code,
        manufacturer: vaccine.manufacturer,
        batchNo: `B${2024}${String(vi + 1).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`,
        traceCode: `TC${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        quantity,
        channelPosition: `${row}${col}`,
        productionDate: dayjs().subtract(daysToExpiry + 180, 'day').format('YYYY-MM-DD'),
        expiryDate: dayjs().add(daysToExpiry, 'day').format('YYYY-MM-DD'),
        inboundTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
        status: 1,
        price: vaccine.price,
      });
    }
  });
  
  return data;
};

// 生成操作记录
const generateRecords = (): InventoryRecord[] => {
  const types: Array<'inbound' | 'outbound' | 'check'> = ['inbound', 'outbound', 'check'];
  const vaccines = ['乙肝疫苗', '流感疫苗', '狂犬疫苗', '百白破', '水痘疫苗'];
  const operators = ['张三', '李四', '王五', '系统'];
  const records: InventoryRecord[] = [];
  
  for (let i = 0; i < 20; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    records.push({
      id: i + 1,
      type,
      vaccineName: vaccines[Math.floor(Math.random() * vaccines.length)],
      quantity: Math.floor(Math.random() * 10) + 1,
      operator: operators[Math.floor(Math.random() * operators.length)],
      time: dayjs().subtract(i * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      orderNo: type === 'outbound' ? `ORD${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}` : undefined,
    });
  }
  
  return records;
};

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [inboundModalVisible, setInboundModalVisible] = useState(false);
  const [outboundModalVisible, setOutboundModalVisible] = useState(false);
  
  // 显示模式配置
  const { config, is4x3 } = useDisplayMode();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [checkModalVisible, setCheckModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [checkForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      setInventory(generateInventoryData());
      setRecords(generateRecords());
      setLoading(false);
    }, 500);
  };

  // 统计数据
  const stats = {
    totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
    vaccineTypes: new Set(inventory.map(i => i.vaccineId)).size,
    expiringCount: inventory.filter(i => {
      const days = dayjs(i.expiryDate).diff(dayjs(), 'day');
      return days <= 30 && days > 0;
    }).length,
    expiredCount: inventory.filter(i => dayjs(i.expiryDate).isBefore(dayjs())).length,
    todayInbound: 50 + Math.floor(Math.random() * 20),
    todayOutbound: 100 + Math.floor(Math.random() * 50),
  };

  // 库存分布图配置
  const stockChartOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: Array.from(new Set(inventory.map(i => i.vaccineName))).map(name => ({
        value: inventory.filter(i => i.vaccineName === name).reduce((sum, i) => sum + i.quantity, 0),
        name,
      })),
    }],
  };

  // 入库登记
  const handleInbound = (values: any) => {
    const newItem: InventoryItem = {
      id: Date.now(),
      vaccineId: values.vaccineId,
      vaccineName: values.vaccineName,
      vaccineCode: values.vaccineCode || 'NEW',
      manufacturer: values.manufacturer,
      batchNo: values.batchNo,
      traceCode: `TC${Date.now()}`,
      quantity: values.quantity,
      channelPosition: values.channel,
      productionDate: values.productionDate.format('YYYY-MM-DD'),
      expiryDate: values.expiryDate.format('YYYY-MM-DD'),
      inboundTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 1,
    };
    
    setInventory([newItem, ...inventory]);
    setRecords([{
      id: Date.now(),
      type: 'inbound',
      vaccineName: values.vaccineName,
      quantity: values.quantity,
      operator: '当前用户',
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }, ...records]);
    
    message.success('入库登记成功');
    setInboundModalVisible(false);
    form.resetFields();
  };

  // 手动出库
  const handleOutbound = (values: any) => {
    if (!selectedItem) return;
    
    if (values.quantity > selectedItem.quantity) {
      message.error('出库数量不能大于库存数量');
      return;
    }
    
    setInventory(inventory.map(i =>
      i.id === selectedItem.id
        ? { ...i, quantity: i.quantity - values.quantity }
        : i
    ));
    
    setRecords([{
      id: Date.now(),
      type: 'outbound',
      vaccineName: selectedItem.vaccineName,
      quantity: values.quantity,
      operator: '当前用户',
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      orderNo: `ORD${dayjs().format('YYYYMMDDHHmmss')}`,
    }, ...records]);
    
    message.success('出库成功');
    setOutboundModalVisible(false);
    form.resetFields();
  };

  // 盘点
  const handleCheck = (values: any) => {
    if (!selectedItem) return;
    
    const diff = values.actualQuantity - selectedItem.quantity;
    
    setInventory(inventory.map(i =>
      i.id === selectedItem.id
        ? { ...i, quantity: values.actualQuantity }
        : i
    ));
    
    setRecords([{
      id: Date.now(),
      type: 'check',
      vaccineName: selectedItem.vaccineName,
      quantity: diff,
      operator: '当前用户',
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }, ...records]);
    
    message.success(`盘点完成，库存${diff >= 0 ? '增加' : '减少'} ${Math.abs(diff)} 支`);
    setCheckModalVisible(false);
    checkForm.resetFields();
  };

  // 过滤数据
  const filteredInventory = inventory.filter(i => {
    if (!searchText) return true;
    return i.vaccineName.includes(searchText) ||
           i.batchNo.includes(searchText) ||
           i.channelPosition.includes(searchText);
  });

  // 表格列
  const columns = [
    {
      title: '疫苗名称',
      dataIndex: 'vaccineName',
      key: 'vaccineName',
      ellipsis: true,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
    },
    {
      title: '货道',
      dataIndex: 'channelPosition',
      key: 'channelPosition',
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: InventoryItem, b: InventoryItem) => a.quantity - b.quantity,
      render: (q: number) => (
        <span style={{ color: q <= 5 ? '#faad14' : undefined }}>
          {q} 支
        </span>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      sorter: (a: InventoryItem, b: InventoryItem) =>
        dayjs(a.expiryDate).unix() - dayjs(b.expiryDate).unix(),
      render: (date: string) => {
        const days = dayjs(date).diff(dayjs(), 'day');
        let color = 'default';
        let text = date;
        
        if (days < 0) {
          color = 'red';
          text = `${date} (已过期)`;
        } else if (days <= 30) {
          color = 'orange';
          text = `${date} (${days}天)`;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: number) => {
        const statusMap: Record<number, { color: string; text: string }> = {
          1: { color: 'green', text: '在库' },
          2: { color: 'default', text: '已出库' },
          3: { color: 'orange', text: '已冻结' },
        };
        return <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: InventoryItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedItem(record);
              setDetailModalVisible(true);
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => {
              setSelectedItem(record);
              setOutboundModalVisible(true);
            }}
          >
            出库
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedItem(record);
              checkForm.setFieldsValue({
                systemQuantity: record.quantity,
                actualQuantity: record.quantity,
              });
              setCheckModalVisible(true);
            }}
          >
            盘点
          </Button>
        </Space>
      ),
    },
  ];

  // 记录类型映射
  const recordTypeMap: Record<string, { color: string; text: string }> = {
    inbound: { color: 'green', text: '入库' },
    outbound: { color: 'orange', text: '出库' },
    check: { color: 'blue', text: '盘点' },
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={is4x3 ? 5 : 4} style={{ margin: 0, fontSize: config.fontSize.title }}>
          <DatabaseOutlined /> 库存管理
        </Title>
        <Space>
          <Button size={config.buttonSize} icon={<ImportOutlined />} type="primary" onClick={() => setInboundModalVisible(true)}>入库登记</Button>
          <Button size={config.buttonSize} icon={<ExportOutlined />} onClick={() => setOutboundModalVisible(true)}>出库登记</Button>
          <Button size={config.buttonSize} icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      {/* 近效期预警 */}
      {(stats.expiringCount > 0 || stats.expiredCount > 0) && (
        <Alert
          message="效期预警"
          description={
            <span>
              {stats.expiredCount > 0 && <span style={{ color: '#ff4d4f' }}>已过期 {stats.expiredCount} 批次</span>}
              {stats.expiredCount > 0 && stats.expiringCount > 0 && '，'}
              {stats.expiringCount > 0 && <span style={{ color: '#faad14' }}>30天内到期 {stats.expiringCount} 批次</span>}
            </span>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ flexShrink: 0 }}
          closable
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={config.gutter} style={{ flexShrink: 0 }}>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic title="库存总量" value={stats.totalQuantity} suffix="支" valueStyle={{ fontWeight: 600 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic title="疫苗种类" value={stats.vaccineTypes} suffix="种" valueStyle={{ fontWeight: 600 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic
              title="今日入库"
              value={stats.todayInbound}
              suffix="支"
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
              prefix={<ImportOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic
              title="今日出库"
              value={stats.todayOutbound}
              suffix="支"
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
              prefix={<ExportOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic
              title="近效期"
              value={stats.expiringCount}
              suffix="批"
              valueStyle={{ color: stats.expiringCount > 0 ? '#faad14' : undefined, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic
              title="已过期"
              value={stats.expiredCount}
              suffix="批"
              valueStyle={{ color: stats.expiredCount > 0 ? '#ff4d4f' : undefined, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs 容器 - 自适应高度 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <Tabs
        style={{ height: '100%' }}
        items={[
          {
            key: 'list',
            label: '库存列表',
            children: (
              <div style={{ height: '100%', overflow: 'auto', padding: '16px 0' }}>
              <Card
                extra={
                  <Space>
                    <Input
                      placeholder="搜索疫苗/批次/货道"
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: 200 }}
                      allowClear
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                      刷新
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setInboundModalVisible(true)}
                    >
                      入库登记
                    </Button>
                  </Space>
                }
              >
                <Table
                  columns={columns}
                  dataSource={filteredInventory}
                  rowKey="id"
                  loading={loading}
                  size="small"
                  scroll={{ y: 300 }}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                    size: 'small',
                  }}
                />
              </Card>
              </div>
            ),
          },
          {
            key: 'records',
            label: (
              <>
                <HistoryOutlined /> 操作记录
              </>
            ),
            children: (
              <div style={{ height: '100%', overflow: 'auto', padding: '16px 0' }}>
              <Card>
                <Timeline
                  items={records.slice(0, 15).map(record => ({
                    color: recordTypeMap[record.type]?.color,
                    children: (
                      <div>
                        <Space>
                          <Tag color={recordTypeMap[record.type]?.color}>
                            {recordTypeMap[record.type]?.text}
                          </Tag>
                          <Text strong>{record.vaccineName}</Text>
                          <Text type={record.type === 'outbound' ? 'danger' : 'success'}>
                            {record.type === 'outbound' ? '-' : '+'}{Math.abs(record.quantity)} 支
                          </Text>
                        </Space>
                        <br />
                        <Text type="secondary">
                          {record.time} | 操作人: {record.operator}
                          {record.orderNo && ` | 订单: ${record.orderNo}`}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </Card>
              </div>
            ),
          },
          {
            key: 'analysis',
            label: (
              <>
                <BarChartOutlined /> 库存分析
              </>
            ),
            children: (
              <div style={{ height: '100%', overflow: 'auto', padding: '16px 0' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="库存分布">
                    <ReactECharts option={stockChartOption} style={{ height: 300 }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="库存概况">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="总库存量">
                        {stats.totalQuantity} 支
                      </Descriptions.Item>
                      <Descriptions.Item label="疫苗种类">
                        {stats.vaccineTypes} 种
                      </Descriptions.Item>
                      <Descriptions.Item label="占用货道">
                        {new Set(inventory.map(i => i.channelPosition)).size} 个
                      </Descriptions.Item>
                      <Descriptions.Item label="平均库存">
                        {Math.round(stats.totalQuantity / stats.vaccineTypes)} 支/种
                      </Descriptions.Item>
                      <Descriptions.Item label="库存周转率">
                        {(stats.todayOutbound / stats.totalQuantity * 100).toFixed(1)}%/天
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
              </div>
            ),
          },
        ]}
      />
      </div>

      {/* 入库登记弹窗 */}
      <Modal
        title={<><ImportOutlined /> 入库登记</>}
        open={inboundModalVisible}
        onCancel={() => {
          setInboundModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确认入库"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleInbound}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vaccineName"
                label="疫苗名称"
                rules={[{ required: true, message: '请选择疫苗' }]}
              >
                <Select placeholder="选择疫苗">
                  <Select.Option value="乙肝疫苗（重组）">乙肝疫苗（重组）</Select.Option>
                  <Select.Option value="流感疫苗（四价）">流感疫苗（四价）</Select.Option>
                  <Select.Option value="狂犬疫苗（Vero细胞）">狂犬疫苗（Vero细胞）</Select.Option>
                  <Select.Option value="百白破疫苗">百白破疫苗</Select.Option>
                  <Select.Option value="水痘疫苗">水痘疫苗</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="生产厂家"
                rules={[{ required: true, message: '请输入厂家' }]}
              >
                <Input placeholder="生产厂家" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="batchNo"
                label="批次号"
                rules={[{ required: true, message: '请输入批次号' }]}
              >
                <Input placeholder="疫苗批次号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="入库数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="支" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productionDate"
                label="生产日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label="有效期至"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="channel"
            label="存放货道"
            rules={[{ required: true, message: '请选择货道' }]}
          >
            <Select placeholder="选择货道">
              {['A', 'B', 'C', 'D', 'E', 'F'].map(row =>
                Array.from({ length: 10 }, (_, i) => (
                  <Select.Option key={`${row}${i + 1}`} value={`${row}${i + 1}`}>
                    {row}{i + 1}
                  </Select.Option>
                ))
              )}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 出库弹窗 */}
      <Modal
        title={<><ExportOutlined /> 手动出库</>}
        open={outboundModalVisible}
        onCancel={() => {
          setOutboundModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确认出库"
        cancelText="取消"
      >
        {selectedItem && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="疫苗">{selectedItem.vaccineName}</Descriptions.Item>
              <Descriptions.Item label="批次">{selectedItem.batchNo}</Descriptions.Item>
              <Descriptions.Item label="当前库存">{selectedItem.quantity} 支</Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical" onFinish={handleOutbound}>
              <Form.Item
                name="quantity"
                label="出库数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber
                  min={1}
                  max={selectedItem.quantity}
                  style={{ width: '100%' }}
                  addonAfter="支"
                />
              </Form.Item>
              <Form.Item name="reason" label="出库原因">
                <Input.TextArea placeholder="可选填写出库原因" rows={2} />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 盘点弹窗 */}
      <Modal
        title="库存盘点"
        open={checkModalVisible}
        onCancel={() => {
          setCheckModalVisible(false);
          checkForm.resetFields();
        }}
        onOk={() => checkForm.submit()}
        okText="确认盘点"
        cancelText="取消"
      >
        {selectedItem && (
          <Form form={checkForm} layout="vertical" onFinish={handleCheck}>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="疫苗">{selectedItem.vaccineName}</Descriptions.Item>
              <Descriptions.Item label="批次">{selectedItem.batchNo}</Descriptions.Item>
              <Descriptions.Item label="货道">{selectedItem.channelPosition}</Descriptions.Item>
            </Descriptions>
            <Form.Item name="systemQuantity" label="系统库存">
              <InputNumber disabled style={{ width: '100%' }} addonAfter="支" />
            </Form.Item>
            <Form.Item
              name="actualQuantity"
              label="实际库存"
              rules={[{ required: true, message: '请输入实际库存' }]}
            >
              <InputNumber min={0} max={50} style={{ width: '100%' }} addonAfter="支" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea placeholder="盘点备注" rows={2} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="库存详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />}>打印标签</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {selectedItem && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="疫苗名称" span={2}>{selectedItem.vaccineName}</Descriptions.Item>
            <Descriptions.Item label="疫苗编码">{selectedItem.vaccineCode}</Descriptions.Item>
            <Descriptions.Item label="生产厂家">{selectedItem.manufacturer}</Descriptions.Item>
            <Descriptions.Item label="批次号">{selectedItem.batchNo}</Descriptions.Item>
            <Descriptions.Item label="溯源码">
              <Text copyable>{selectedItem.traceCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="当前库存">{selectedItem.quantity} 支</Descriptions.Item>
            <Descriptions.Item label="存放货道">
              <Tag color="blue">{selectedItem.channelPosition}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="生产日期">{selectedItem.productionDate}</Descriptions.Item>
            <Descriptions.Item label="有效期至">{selectedItem.expiryDate}</Descriptions.Item>
            <Descriptions.Item label="入库时间" span={2}>{selectedItem.inboundTime}</Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              <Badge status="success" text="在库" />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;
