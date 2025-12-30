import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ChannelsPage from './pages/Channels';
import InventoryPage from './pages/Inventory';
import OrdersPage from './pages/Orders';
import TemperaturePage from './pages/Temperature';
import TracesPage from './pages/Traces';
import AlarmsPage from './pages/Alarms';
import SettingsPage from './pages/Settings';
import { useAuthStore } from './stores/auth';
import { theme } from './theme';

dayjs.locale('zh-cn');

// 受保护的路由
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* 登录页 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 主应用 */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="temperature" element={<TemperaturePage />} />
              <Route path="traces" element={<TracesPage />} />
              <Route path="alarms" element={<AlarmsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;

