import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Typography, Tag, Tooltip } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth';
import { useSettingsStore } from '../../stores/settings';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '运营概览' },
  { key: '/channels', icon: <AppstoreOutlined />, label: '货道管理' },
  { key: '/inventory', icon: <DatabaseOutlined />, label: '库存管理' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
  { key: '/temperature', icon: <LineChartOutlined />, label: '温度监控' },
  { key: '/traces', icon: <SearchOutlined />, label: '追溯查询' },
  { key: '/alarms', icon: <BellOutlined />, label: '报警中心' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { displayMode } = useSettingsStore();

  // 根据显示模式调整布局
  const layoutStyles = {
    '16:9': {
      siderWidth: 220,
      siderCollapsedWidth: 80,
      contentPadding: 24,
      contentMargin: 24,
    },
    '4:3': {
      siderWidth: 180,
      siderCollapsedWidth: 60,
      contentPadding: 16,
      contentMargin: 16,
    },
  };

  const currentLayout = layoutStyles[displayMode];

  // 在4:3模式下自动折叠侧边栏以节省空间
  useEffect(() => {
    if (displayMode === '4:3') {
      setCollapsed(true);
    }
  }, [displayMode]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
        width={currentLayout.siderWidth}
        collapsedWidth={currentLayout.siderCollapsedWidth}
        style={{
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)'
        }}>
          <Text style={{ color: '#fff', fontSize: collapsed ? 14 : (displayMode === '4:3' ? 14 : 18), fontWeight: 600 }}>
            {collapsed ? '疫苗' : '🏥 疫苗分拣系统'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            fontSize: displayMode === '4:3' ? 13 : 14,
          }}
        />
        
        {/* 显示模式指示器 */}
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}>
            <Tooltip title={`当前: ${displayMode} 模式`}>
              <Tag 
                icon={<DesktopOutlined />} 
                color="processing"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/settings')}
              >
                {displayMode}
              </Tag>
            </Tooltip>
          </div>
        )}
      </Sider>
      <Layout>
        <Header style={{ 
          padding: `0 ${currentLayout.contentPadding}px`, 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)', // 更轻柔的阴影
          height: displayMode === '4:3' ? 56 : 64,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer', color: '#595959' },
              onClick: () => setCollapsed(!collapsed),
            })}
            {displayMode === '4:3' && (
              <Tag color="orange" style={{ marginLeft: 8, border: 'none' }}>4:3模式</Tag>
            )}
          </div>
          <Space size={displayMode === '4:3' ? 16 : 24}>
            <Badge count={3} size="small" offset={[-2, 2]}>
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }} className="hover:bg-gray-100">
                <Avatar icon={<UserOutlined />} size={displayMode === '4:3' ? 'small' : 'default'} style={{ backgroundColor: '#1890ff' }} />
                <Text style={{ fontSize: displayMode === '4:3' ? 13 : 14, color: '#1f1f1f', fontWeight: 500 }}>
                  {user?.realName || '管理员'}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: 0, 
          padding: currentLayout.contentPadding, 
          background: '#f0f2f5', 
          height: `calc(100vh - ${displayMode === '4:3' ? 56 : 64}px)`,
          overflow: 'hidden', // 禁用 Content 滚动，交给子页面
          transition: 'all 0.2s ease',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
