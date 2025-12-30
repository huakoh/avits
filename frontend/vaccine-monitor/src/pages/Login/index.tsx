import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const { Title, Text, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      if (values.username === 'admin' && values.password === 'admin123') {
        login(
          'mock-token-12345',
          'mock-refresh-token',
          {
            id: 1,
            username: 'admin',
            realName: '系统管理员',
            roles: ['SUPER_ADMIN'],
            permissions: ['*'],
          }
        );
        message.success('登录成功！');
        navigate('/dashboard');
      } else {
        message.error('用户名或密码错误');
      }
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 一键演示登录
  const handleDemoLogin = () => {
    onFinish({ username: 'admin', password: 'admin123' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0c1e3c 0%, #1a365d 50%, #0d3d4d 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(56, 178, 172, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(49, 130, 206, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(99, 179, 237, 0.1) 0%, transparent 40%)
        `,
      }} />
      
      {/* 动态网格背景 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(56, 178, 172, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 178, 172, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }} />

      <Card
        style={{
          width: 420,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: 16,
          border: '1px solid rgba(56, 178, 172, 0.3)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo 区域 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38b2ac 0%, #3182ce 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px -10px rgba(56, 178, 172, 0.5)',
          }}>
            <ExperimentOutlined style={{ fontSize: 40, color: 'white' }} />
          </div>
          <Title level={3} style={{ marginBottom: 4, color: '#1a365d' }}>
            疫苗自动分拣控制系统
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Vaccine Automatic Sorting System
          </Text>
        </div>

        {/* 演示模式提示 */}
        <Alert
          message="演示模式"
          description={
            <span>
              系统运行于演示模式，使用模拟数据展示。
              <br />
              <strong>账号：admin</strong> / <strong>密码：admin123</strong>
            </span>
          }
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ username: 'admin', password: 'admin123' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#38b2ac' }} />} 
              placeholder="用户名" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#38b2ac' }} />} 
              placeholder="密码" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={{ 
                height: 44, 
                borderRadius: 8,
                background: 'linear-gradient(135deg, #38b2ac 0%, #3182ce 100%)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              登 录
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              block 
              onClick={handleDemoLogin}
              style={{ 
                height: 44, 
                borderRadius: 8,
                borderColor: '#38b2ac',
                color: '#38b2ac',
              }}
            >
              🚀 一键体验演示
            </Button>
          </Form.Item>
        </Form>
        
        {/* 功能特性 */}
        <div style={{ 
          marginTop: 24, 
          padding: '16px 0', 
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
        }}>
          <Space direction="vertical" align="center" size={0}>
            <Text strong style={{ color: '#38b2ac', fontSize: 18 }}>60+</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>疫苗规格</Text>
          </Space>
          <Space direction="vertical" align="center" size={0}>
            <Text strong style={{ color: '#3182ce', fontSize: 18 }}>2-8°C</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>温控范围</Text>
          </Space>
          <Space direction="vertical" align="center" size={0}>
            <Text strong style={{ color: '#805ad5', fontSize: 18 }}>GSP</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>合规认证</Text>
          </Space>
        </div>
      </Card>

      {/* 版权信息 */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
      }}>
        <Paragraph style={{ margin: 0, color: 'inherit' }}>
          © 2024 疫苗自动分拣传输控制系统 | 符合《中华人民共和国疫苗管理法》
        </Paragraph>
      </div>
    </div>
  );
};

export default LoginPage;
