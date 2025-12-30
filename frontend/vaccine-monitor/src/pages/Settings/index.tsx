import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  InputNumber,
  Tabs,
  Typography,
  message,
  Table,
  Tag,
  Space,
  Modal,
  Select,
  Descriptions,
  Badge,
  Row,
  Col,
  Statistic,
  Timeline,
  Avatar,
  Popconfirm,
  Divider,
  Alert,
  Radio,
  Tooltip,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ApiOutlined,
  DesktopOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSettingsStore, DisplayMode } from '../../stores/settings';

const { Title, Text, Paragraph } = Typography;

// 模拟用户数据
const mockUsers = [
  { id: 1, username: 'admin', name: '系统管理员', role: 'admin', phone: '138****1234', status: 1, lastLogin: '2024-12-29 10:30:00' },
  { id: 2, username: 'operator1', name: '张工', role: 'operator', phone: '139****5678', status: 1, lastLogin: '2024-12-29 09:15:00' },
  { id: 3, username: 'operator2', name: '李工', role: 'operator', phone: '137****9012', status: 1, lastLogin: '2024-12-28 16:45:00' },
  { id: 4, username: 'viewer', name: '王主任', role: 'viewer', phone: '136****3456', status: 0, lastLogin: '2024-12-25 14:20:00' },
];

// 模拟设备数据
const mockDevices = [
  { id: 1, code: 'PLC-MAIN', name: '主控PLC', type: 'plc', ip: '192.168.1.10', status: 1, lastHeartbeat: '2024-12-29 10:35:00' },
  { id: 2, code: 'PLC-BACKUP', name: '备用PLC', type: 'plc', ip: '192.168.1.11', status: 1, lastHeartbeat: '2024-12-29 10:35:00' },
  { id: 3, code: 'CONVEYOR-1', name: '皮带输送机1', type: 'conveyor', ip: '192.168.1.20', status: 1, lastHeartbeat: '2024-12-29 10:35:00' },
  { id: 4, code: 'SENSOR-T1', name: '温度传感器A区', type: 'sensor', ip: '192.168.1.30', status: 1, lastHeartbeat: '2024-12-29 10:35:00' },
  { id: 5, code: 'SENSOR-T2', name: '温度传感器B区', type: 'sensor', ip: '192.168.1.31', status: 0, lastHeartbeat: '2024-12-29 08:20:00' },
  { id: 6, code: 'CAMERA-1', name: '视觉相机1', type: 'camera', ip: '192.168.1.40', status: 1, lastHeartbeat: '2024-12-29 10:35:00' },
];

// 模拟操作日志
const mockLogs = [
  { id: 1, time: '2024-12-29 10:35:00', user: 'admin', action: '系统登录', module: '认证', ip: '192.168.1.100', result: 'success' },
  { id: 2, time: '2024-12-29 10:30:00', user: 'operator1', action: '处理订单 ORD202412290001', module: '订单', ip: '192.168.1.101', result: 'success' },
  { id: 3, time: '2024-12-29 10:25:00', user: 'admin', action: '修改温度阈值', module: '设置', ip: '192.168.1.100', result: 'success' },
  { id: 4, time: '2024-12-29 10:20:00', user: 'operator2', action: '入库登记', module: '库存', ip: '192.168.1.102', result: 'success' },
  { id: 5, time: '2024-12-29 10:15:00', user: 'system', action: '温度预警触发', module: '报警', ip: '系统', result: 'warning' },
  { id: 6, time: '2024-12-29 10:10:00', user: 'operator1', action: '处理报警', module: '报警', ip: '192.168.1.101', result: 'success' },
];

const SettingsPage: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [devices, setDevices] = useState(mockDevices);
  const [logs] = useState(mockLogs);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [deviceForm] = Form.useForm();

  // 全局设置状态
  const { displayMode, setDisplayMode } = useSettingsStore();

  const handleSave = (tabName: string) => {
    message.success(`${tabName}设置已保存`);
  };

  // 处理显示模式切换
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    message.success(`显示模式已切换为 ${mode}`);
  };

  // 用户管理
  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleSaveUser = (values: any) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
      message.success('用户信息已更新');
    } else {
      setUsers([...users, { ...values, id: Date.now(), status: 1, lastLogin: '-' }]);
      message.success('用户已添加');
    }
    setUserModalVisible(false);
    userForm.resetFields();
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
    message.success('用户已删除');
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, status: u.status === 1 ? 0 : 1 } : u
    ));
    message.success('用户状态已更新');
  };

  // 设备管理
  const handleAddDevice = () => {
    setEditingDevice(null);
    deviceForm.resetFields();
    setDeviceModalVisible(true);
  };

  const handleEditDevice = (device: any) => {
    setEditingDevice(device);
    deviceForm.setFieldsValue(device);
    setDeviceModalVisible(true);
  };

  const handleSaveDevice = (values: any) => {
    if (editingDevice) {
      setDevices(devices.map(d => d.id === editingDevice.id ? { ...d, ...values } : d));
      message.success('设备信息已更新');
    } else {
      setDevices([...devices, { ...values, id: Date.now(), status: 1, lastHeartbeat: dayjs().format('YYYY-MM-DD HH:mm:ss') }]);
      message.success('设备已添加');
    }
    setDeviceModalVisible(false);
    deviceForm.resetFields();
  };

  const handleTestDevice = (device: any) => {
    message.loading(`正在测试设备 ${device.name} 连接...`, 1.5);
    setTimeout(() => {
      if (device.status === 1) {
        message.success(`设备 ${device.name} 连接正常`);
      } else {
        message.error(`设备 ${device.name} 连接失败`);
      }
    }, 1500);
  };

  // 角色映射
  const roleMap: Record<string, { color: string; text: string }> = {
    admin: { color: 'red', text: '管理员' },
    operator: { color: 'blue', text: '操作员' },
    viewer: { color: 'default', text: '访客' },
  };

  // 设备类型映射
  const deviceTypeMap: Record<string, { color: string; text: string }> = {
    plc: { color: 'purple', text: 'PLC控制器' },
    conveyor: { color: 'blue', text: '输送设备' },
    sensor: { color: 'green', text: '传感器' },
    camera: { color: 'orange', text: '视觉相机' },
  };

  // 用户表格列
  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleMap[role]?.color}>{roleMap[role]?.text}</Tag>
      ),
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Badge status={status === 1 ? 'success' : 'default'} text={status === 1 ? '启用' : '禁用'} />
      ),
    },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleUserStatus(record.id)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除此用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
            disabled={record.username === 'admin'}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.username === 'admin'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 设备表格列
  const deviceColumns = [
    { title: '设备编码', dataIndex: 'code', key: 'code' },
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={deviceTypeMap[type]?.color}>{deviceTypeMap[type]?.text}</Tag>
      ),
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Badge
          status={status === 1 ? 'success' : 'error'}
          text={status === 1 ? '在线' : '离线'}
        />
      ),
    },
    { title: '最后心跳', dataIndex: 'lastHeartbeat', key: 'lastHeartbeat' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleTestDevice(record)}>
            测试
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDevice(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  // 日志表格列
  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '用户', dataIndex: 'user', key: 'user' },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '模块', dataIndex: 'module', key: 'module' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={result === 'success' ? 'green' : result === 'warning' ? 'orange' : 'red'}>
          {result === 'success' ? '成功' : result === 'warning' ? '警告' : '失败'}
        </Tag>
      ),
    },
  ];

  // Tab 内容容器样式
  const tabContentStyle: React.CSSProperties = {
    height: '100%',
    overflow: 'auto',
    padding: '16px 24px',
  };

  const items = [
    {
      key: 'display',
      label: (
        <>
          <DesktopOutlined /> 显示设置
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Row gutter={24}>
          <Col span={12}>
            <Card title="屏幕显示模式" size="small">
              <Alert
                message="显示模式说明"
                description="根据您的显示器比例选择合适的显示模式，以获得最佳显示效果。"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              
              <Form.Item label="显示模式">
                <Radio.Group
                  value={displayMode}
                  onChange={(e) => handleDisplayModeChange(e.target.value)}
                  size="large"
                  buttonStyle="solid"
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Radio.Button
                      value="16:9"
                      style={{
                        width: '100%',
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Space direction="vertical" align="center" size={4}>
                        <div style={{
                          width: 80,
                          height: 45,
                          border: '2px solid currentColor',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 4,
                        }}>
                          <ExpandOutlined />
                        </div>
                        <Text strong>16:9 宽屏模式</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>适合宽屏显示器 (1920×1080)</Text>
                      </Space>
                    </Radio.Button>
                    
                    <Radio.Button
                      value="4:3"
                      style={{
                        width: '100%',
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Space direction="vertical" align="center" size={4}>
                        <div style={{
                          width: 60,
                          height: 45,
                          border: '2px solid currentColor',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 4,
                        }}>
                          <ExpandOutlined />
                        </div>
                        <Text strong>4:3 标准模式</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>适合方屏显示器 (1024×768)</Text>
                      </Space>
                    </Radio.Button>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Descriptions column={1} size="small">
                <Descriptions.Item label="当前模式">
                  <Tag color="blue" icon={<DesktopOutlined />}>{displayMode}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="建议分辨率">
                  {displayMode === '16:9' ? '1920×1080 或更高' : '1024×768 或 1280×1024'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="显示效果预览" size="small">
              <div style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
              }}>
                <div style={{
                  width: displayMode === '16:9' ? 280 : 200,
                  height: displayMode === '16:9' ? 157.5 : 150,
                  backgroundColor: '#1a365d',
                  borderRadius: 8,
                  border: '4px solid #2d3748',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}>
                  {/* 模拟标题栏 */}
                  <div style={{
                    height: 20,
                    backgroundColor: '#2d3748',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    gap: 4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fc8181' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fbd38d' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#68d391' }} />
                  </div>
                  {/* 模拟内容区 */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                  }}>
                    {/* 侧边栏 */}
                    <div style={{
                      width: displayMode === '16:9' ? 50 : 40,
                      backgroundColor: '#0c1e3c',
                    }} />
                    {/* 主内容 */}
                    <div style={{
                      flex: 1,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}>
                      <div style={{ height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                      <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                        <div style={{ flex: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">
                  {displayMode === '16:9' ? '宽屏布局，内容区域更宽广' : '标准布局，适合传统显示器'}
                </Text>
              </div>
            </Card>

            <Card title="其他显示选项" size="small" style={{ marginTop: 16 }}>
              <Form layout="vertical">
                <Form.Item label="全屏显示快捷键">
                  <Text keyboard>F11</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>按 F11 切换全屏模式</Text>
                </Form.Item>
                <Form.Item label="货道矩阵大小">
                  <Radio.Group defaultValue="normal">
                    <Radio.Button value="compact">紧凑</Radio.Button>
                    <Radio.Button value="normal">标准</Radio.Button>
                    <Radio.Button value="large">大号</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
        </div>
      ),
    },
    {
      key: 'general',
      label: (
        <>
          <SettingOutlined /> 基础设置
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Row gutter={24}>
          <Col span={12}>
            <Card title="接种点信息" size="small">
              <Form form={form} layout="vertical" initialValues={{
                stationName: '某社区卫生服务中心预防接种门诊',
                stationCode: 'STATION001',
                address: '北京市朝阳区XX路XX号',
                contact: '010-12345678',
              }}>
                <Form.Item label="接种点名称" name="stationName">
                  <Input />
                </Form.Item>
                <Form.Item label="接种点编码" name="stationCode">
                  <Input />
                </Form.Item>
                <Form.Item label="地址" name="address">
                  <Input />
                </Form.Item>
                <Form.Item label="联系电话" name="contact">
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSave('基础')}>
                    保存设置
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="系统参数" size="small">
              <Form layout="vertical" initialValues={{
                refreshInterval: 10,
                sessionTimeout: 30,
                maxRetry: 3,
              }}>
                <Form.Item label="数据刷新间隔(秒)" name="refreshInterval">
                  <InputNumber min={5} max={60} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="会话超时时间(分钟)" name="sessionTimeout">
                  <InputNumber min={10} max={120} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="通信重试次数" name="maxRetry">
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSave('系统参数')}>
                    保存设置
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
        </div>
      ),
    },
    {
      key: 'temperature',
      label: (
        <>
          <SafetyCertificateOutlined /> 温度设置
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Row gutter={24}>
          <Col span={12}>
            <Card title="温度阈值" size="small">
              <Form layout="vertical" initialValues={{
                tempMin: 2,
                tempMax: 8,
                warnMargin: 0.5,
              }}>
                <Form.Item label="温度下限(°C)" name="tempMin">
                  <InputNumber min={0} max={5} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="温度上限(°C)" name="tempMax">
                  <InputNumber min={5} max={15} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="预警边界(°C)" name="warnMargin">
                  <InputNumber min={0.1} max={1} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Alert
                  message="GSP规范要求"
                  description="根据《药品经营质量管理规范》，疫苗应在2-8°C条件下冷藏储存。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSave('温度阈值')}>
                    保存设置
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="温度采集" size="small">
              <Form layout="vertical" initialValues={{
                collectInterval: 10,
                storeDays: 365,
                redundancy: true,
              }}>
                <Form.Item label="采集间隔(秒)" name="collectInterval">
                  <InputNumber min={5} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="数据保存时间(天)" name="storeDays">
                  <InputNumber min={90} max={730} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="传感器冗余" name="redundancy" valuePropName="checked">
                  <Switch checkedChildren="启用" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSave('温度采集')}>
                    保存设置
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
        </div>
      ),
    },
    {
      key: 'alarm',
      label: (
        <>
          <SafetyCertificateOutlined /> 报警设置
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Card size="small">
          <Form layout="vertical" style={{ maxWidth: 500 }} initialValues={{
            soundEnabled: true,
            lightEnabled: true,
            smsEnabled: false,
            emailEnabled: false,
          }}>
            <Form.Item label="声音报警" name="soundEnabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="声光报警器" name="lightEnabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="短信通知" name="smsEnabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="通知手机号" name="smsPhones">
              <Input placeholder="多个号码用逗号分隔" />
            </Form.Item>
            <Form.Item label="邮件通知" name="emailEnabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="通知邮箱" name="emails">
              <Input placeholder="多个邮箱用逗号分隔" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSave('报警')}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
        </div>
      ),
    },
    {
      key: 'users',
      label: (
        <>
          <TeamOutlined /> 用户管理
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Card
          size="small"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
              添加用户
            </Button>
          }
        >
          <Table columns={userColumns} dataSource={users} rowKey="id" pagination={false} size="small" scroll={{ y: 300 }} />
        </Card>
        </div>
      ),
    },
    {
      key: 'devices',
      label: (
        <>
          <ToolOutlined /> 设备管理
        </>
      ),
      children: (
        <div style={tabContentStyle}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="设备总数"
                  value={devices.length}
                  prefix={<CloudServerOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="在线设备"
                  value={devices.filter(d => d.status === 1).length}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="离线设备"
                  value={devices.filter(d => d.status === 0).length}
                  valueStyle={{ color: devices.filter(d => d.status === 0).length > 0 ? '#ff4d4f' : undefined }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="连接状态"
                  value={devices.filter(d => d.status === 1).length === devices.length ? '全部正常' : '部分异常'}
                  valueStyle={{
                    color: devices.filter(d => d.status === 1).length === devices.length ? '#52c41a' : '#faad14',
                    fontSize: 18,
                  }}
                />
              </Card>
            </Col>
          </Row>
          <Card
            size="small"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />}>刷新状态</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDevice}>
                  添加设备
                </Button>
              </Space>
            }
          >
            <Table columns={deviceColumns} dataSource={devices} rowKey="id" pagination={false} size="small" scroll={{ y: 240 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'logs',
      label: (
        <>
          <FileTextOutlined /> 操作日志
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Card size="small">
          <Table
            columns={logColumns}
            dataSource={logs}
            rowKey="id"
            size="small"
            scroll={{ y: 350 }}
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
      key: 'about',
      label: (
        <>
          <ApiOutlined /> 关于系统
        </>
      ),
      children: (
        <div style={tabContentStyle}>
        <Row gutter={24}>
          <Col span={12}>
            <Card title="系统信息" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="系统名称">疫苗自动分拣传输控制系统</Descriptions.Item>
                <Descriptions.Item label="版本号">V1.0.0</Descriptions.Item>
                <Descriptions.Item label="发布日期">2024-12-29</Descriptions.Item>
                <Descriptions.Item label="技术架构">C# + Go + Python + React</Descriptions.Item>
                <Descriptions.Item label="数据库">PostgreSQL + Redis + TimescaleDB</Descriptions.Item>
                <Descriptions.Item label="合规标准">GSP / 《疫苗管理法》</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="运行状态" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="系统运行时间">15天 8小时 32分钟</Descriptions.Item>
                <Descriptions.Item label="数据库连接">
                  <Badge status="success" text="正常" />
                </Descriptions.Item>
                <Descriptions.Item label="Redis连接">
                  <Badge status="success" text="正常" />
                </Descriptions.Item>
                <Descriptions.Item label="PLC通信">
                  <Badge status="success" text="正常" />
                </Descriptions.Item>
                <Descriptions.Item label="视觉服务">
                  <Badge status="success" text="正常" />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
        </div>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}><SettingOutlined /> 系统设置</Title>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Tabs 
          items={items} 
          tabPosition="left" 
          style={{ height: '100%' }} 
          tabBarStyle={{ 
            width: 140, 
            height: '100%',
            overflow: 'auto',
            borderRight: '1px solid #f0f0f0',
            background: '#fafafa',
            borderRadius: '8px 0 0 8px',
          }}
          tabBarGutter={0}
        />
      </div>

      {/* 用户编辑弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={userModalVisible}
        onCancel={() => {
          setUserModalVisible(false);
          userForm.resetFields();
        }}
        onOk={() => userForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={userForm} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">操作员</Select.Option>
              <Select.Option value="viewer">访客</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 设备编辑弹窗 */}
      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={deviceModalVisible}
        onCancel={() => {
          setDeviceModalVisible(false);
          deviceForm.resetFields();
        }}
        onOk={() => deviceForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={deviceForm} layout="vertical" onFinish={handleSaveDevice}>
          <Form.Item
            name="code"
            label="设备编码"
            rules={[{ required: true, message: '请输入设备编码' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="设备类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="plc">PLC控制器</Select.Option>
              <Select.Option value="conveyor">输送设备</Select.Option>
              <Select.Option value="sensor">传感器</Select.Option>
              <Select.Option value="camera">视觉相机</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="ip"
            label="IP地址"
            rules={[{ required: true, message: '请输入IP地址' }]}
          >
            <Input placeholder="192.168.1.x" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
