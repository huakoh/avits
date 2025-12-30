import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Input,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  Timeline,
  Tabs,
  DatePicker,
  Divider,
} from 'antd';
import {
  ShoppingCartOutlined,
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface OrderItem {
  id: number;
  orderNo: string;
  vaccineName: string;
  vaccineCode?: string;
  patient?: string;
  channelPosition: string;
  quantity: number;
  status: number;
  createTime: string;
  finishTime?: string;
  priority: number;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  
  // 显示模式配置
  const { config, is4x3 } = useDisplayMode();
  
  const [form] = Form.useForm();
  
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      // API 返回 { total, list } 格式
      const data = response.data.data;
      setOrders(Array.isArray(data) ? data : (data?.list || []));
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (values: any) => {
    try {
      await api.post('/orders', values);
      message.success('订单创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchOrders();
    } catch (error) {
      console.error('创建订单失败:', error);
    }
  };

  const handleProcessOrder = async (id: number) => {
    try {
      await api.post(`/orders/${id}/process`);
      message.success('订单开始处理');
      fetchOrders();
    } catch (error) {
      console.error('处理订单失败:', error);
    }
  };

  const handleCancelOrder = async (id: number) => {
    try {
      await api.post(`/orders/${id}/cancel`);
      message.success('订单已取消');
      fetchOrders();
    } catch (error) {
      console.error('取消订单失败:', error);
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
    { 
      title: '疫苗名称', 
      dataIndex: 'vaccineName', 
      key: 'vaccineName',
      render: (text: string, record: OrderItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.vaccineCode}</Text>
        </Space>
      )
    },
    { 
      title: '患者', 
      dataIndex: 'patient', 
      key: 'patient',
      render: (text: string) => text || '-'
    },
    { title: '出货位置', dataIndex: 'channelPosition', key: 'channelPosition', width: 100 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { 
      title: '优先级', 
      dataIndex: 'priority', 
      key: 'priority', 
      width: 100,
      render: (p: number) => (
        <Tag color={p > 1 ? 'red' : 'blue'}>
          {p > 1 ? '紧急' : '普通'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number) => {
        const statusMap: Record<number, { color: string; text: string; icon: React.ReactNode }> = {
          0: { color: 'warning', text: '待处理', icon: <ShoppingCartOutlined /> },
          1: { color: 'processing', text: '处理中', icon: <ReloadOutlined spin /> },
          2: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
          3: { color: 'default', text: '已取消', icon: <CloseCircleOutlined /> },
          4: { color: 'error', text: '异常', icon: <ThunderboltOutlined /> },
        };
        const item = statusMap[status] || statusMap[0];
        return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: OrderItem) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setDetailModalVisible(true);
            }}
          >
            详情
          </Button>
          {record.status === 0 && (
            <>
              <Popconfirm
                title="确定开始处理此订单？"
                onConfirm={() => handleProcessOrder(record.id)}
              >
                <Button type="link" size="small" style={{ color: '#52c41a' }}>处理</Button>
              </Popconfirm>
              <Popconfirm
                title="确定取消此订单？"
                onConfirm={() => handleCancelOrder(record.id)}
              >
                <Button type="link" size="small" danger>取消</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    },
  ];

  // 统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 0).length,
    processing: orders.filter(o => o.status === 1).length,
    completed: orders.filter(o => o.status === 2).length,
    cancelled: orders.filter(o => o.status === 3).length,
  };

  // 过滤显示
  const displayOrders = filterStatus !== null 
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Title level={is4x3 ? 5 : 4} style={{ margin: 0, fontSize: config.fontSize.title, flexShrink: 0 }}>
        <ShoppingCartOutlined /> 订单管理
      </Title>
      
      {/* 统计卡片 - 固定高度 */}
      <Row gutter={config.gutter} style={{ flexShrink: 0 }}>
        <Col span={4}>
          <Card size="small" variant="borderless">
            <Statistic 
              title="全部订单" 
              value={stats.total}
              valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(0)} hoverable>
            <Statistic 
              title="待处理" 
              value={stats.pending} 
              valueStyle={{ 
                color: stats.pending > 0 ? '#faad14' : undefined, 
                fontSize: config.statisticCard.valueSize - 4,
                fontWeight: 600 
              }}
              prefix={stats.pending > 0 ? <Badge status="warning" /> : null}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(1)} hoverable>
            <Statistic 
              title="处理中" 
              value={stats.processing}
              valueStyle={{ fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
              prefix={stats.processing > 0 ? <Badge status="processing" /> : null}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(2)} hoverable>
            <Statistic 
              title="已完成" 
              value={stats.completed}
              valueStyle={{ color: '#52c41a', fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" variant="borderless" style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(3)} hoverable>
            <Statistic 
              title="已取消" 
              value={stats.cancelled}
              valueStyle={{ color: '#999', fontSize: config.statisticCard.valueSize - 4, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 表格区域 - 自适应高度 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Card 
          size={is4x3 ? 'small' : 'default'}
          variant="borderless"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' } }}
          extra={
            <Space size={is4x3 ? 'small' : 'middle'} style={{ padding: '16px 24px 0 0' }}>
              <RangePicker size={config.componentSize as any} style={{ width: 240 }} />
              <Input.Search 
                placeholder="搜索订单号/疫苗" 
                size={config.componentSize as any}
                style={{ width: 200 }} 
              />
              {filterStatus !== null && (
                <Button size={config.buttonSize} onClick={() => setFilterStatus(null)}>
                  清除筛选
                </Button>
              )}
              <Button size={config.buttonSize} icon={<ReloadOutlined />} onClick={fetchOrders}>
                刷新
              </Button>
              <Button size={config.buttonSize} type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
                新建订单
              </Button>
            </Space>
          }
        >
          <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px' }}>
            <Table 
              columns={columns} 
              dataSource={displayOrders} 
              rowKey="id" 
              loading={loading}
              size={config.tableSize}
              pagination={{
                showSizeChanger: config.pagination.showSizeChanger,
                pageSize: 20, // 增加每页显示数量
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                size: 'small'
              }}
              scroll={{ y: 380 }}
              style={{ height: '100%' }}
            />
          </div>
        </Card>
      </div>

      {/* 新建订单弹窗 */}
      <Modal
        title="新建出库订单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vaccineId"
                label="选择疫苗"
                rules={[{ required: true }]}
              >
                <Select placeholder="请选择疫苗">
                  <Select.Option value={1}>乙肝疫苗</Select.Option>
                  <Select.Option value={2}>流感疫苗</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="出库数量"
                rules={[{ required: true }]}
                initialValue={1}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="priority"
            label="优先级"
            initialValue={1}
          >
            <Select>
              <Select.Option value={1}>普通</Select.Option>
              <Select.Option value={2}>紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag>{selectedOrder.status === 2 ? '已完成' : '处理中'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="疫苗名称">{selectedOrder.vaccineName}</Descriptions.Item>
              <Descriptions.Item label="出货位置">{selectedOrder.channelPosition}</Descriptions.Item>
              <Descriptions.Item label="数量">{selectedOrder.quantity}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedOrder.createTime}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ fontSize: 14 }}>执行日志</Divider>
            <Timeline style={{ marginTop: 20 }}>
              <Timeline.Item color="green">
                <p>订单创建成功</p>
                <p style={{ fontSize: 12, color: '#999' }}>{selectedOrder.createTime}</p>
              </Timeline.Item>
              {selectedOrder.status >= 1 && (
                <Timeline.Item color="blue">
                  <p>系统开始处理</p>
                  <p style={{ fontSize: 12, color: '#999' }}>{dayjs(selectedOrder.createTime).add(2, 'minute').format('YYYY-MM-DD HH:mm:ss')}</p>
                </Timeline.Item>
              )}
              {selectedOrder.status === 2 && (
                <Timeline.Item>
                  <p>出库完成</p>
                  <p style={{ fontSize: 12, color: '#999' }}>{dayjs(selectedOrder.createTime).add(5, 'minute').format('YYYY-MM-DD HH:mm:ss')}</p>
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
