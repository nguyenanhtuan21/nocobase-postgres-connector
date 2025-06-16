import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, message, Space, Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '@nocobase/client';

interface DataSourceFormProps {
  initialValues?: any;
  onFinish?: (values: any) => void;
  onCancel?: () => void;
}

export const DataSourceForm: React.FC<DataSourceFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
}) => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [advancedVisible, setAdvancedVisible] = useState(false);
  
  const isEdit = !!initialValues?.id;
  
  const handleFinish = async (values: any) => {
    if (onFinish) {
      onFinish(values);
    }
  };
  
  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTestLoading(true);
      
      const response = await api.request({
        url: 'postgresConnector:execute:testConnection',
        method: 'post',
        data: {
          config: values,
        },
      });
      
      if (response.data.success) {
        message.success(t('Connection successful'));
      } else {
        message.error(t('Connection failed: ') + response.data.message);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      message.error(t('Connection failed'));
    } finally {
      setTestLoading(false);
    }
  };
  
  return (
    <Card bordered={false}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'postgres',
          port: 5432,
          enabled: true,
          ...initialValues,
        }}
        onFinish={handleFinish}
      >
        <Form.Item
          name="title"
          label={t('Name')}
          rules={[{ required: true, message: t('Please enter a name') }]}
        >
          <Input placeholder={t('My Database Connection')} />
        </Form.Item>
        
        <Form.Item
          name="type"
          label={t('Database Type')}
          rules={[{ required: true, message: t('Please select database type') }]}
        >
          <Select>
            <Select.Option value="postgres">PostgreSQL</Select.Option>
            <Select.Option value="mysql">MySQL</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="host"
          label={t('Host')}
          rules={[{ required: true, message: t('Please enter host') }]}
        >
          <Input placeholder="localhost" />
        </Form.Item>
        
        <Form.Item
          name="port"
          label={t('Port')}
          rules={[{ required: true, message: t('Please enter port') }]}
        >
          <InputNumber min={1} max={65535} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="database"
          label={t('Database')}
          rules={[{ required: true, message: t('Please enter database name') }]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item
          name="username"
          label={t('Username')}
          rules={[{ required: true, message: t('Please enter username') }]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item
          name="password"
          label={t('Password')}
          rules={[{ required: true, message: t('Please enter password') }]}
        >
          <Input.Password />
        </Form.Item>
        
        <Form.Item>
          <Button type="link" onClick={() => setAdvancedVisible(!advancedVisible)}>
            {advancedVisible ? t('Hide Advanced Options') : t('Show Advanced Options')}
          </Button>
        </Form.Item>
        
        {advancedVisible && (
          <Tabs>
            <Tabs.TabPane tab={t('SSL')} key="ssl">
              <Form.Item
                name="ssl"
                label={t('Enable SSL')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name={['options', 'ssl', 'rejectUnauthorized']}
                label={t('Reject Unauthorized')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name={['options', 'ssl', 'ca']}
                label={t('CA Certificate')}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab={t('Connection')} key="connection">
              <Form.Item
                name={['options', 'connectionTimeoutMillis']}
                label={t('Connection Timeout (ms)')}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name={['options', 'idleTimeoutMillis']}
                label={t('Idle Timeout (ms)')}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name={['options', 'max']}
                label={t('Max Connections')}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab={t('Schema')} key="schema">
              <Form.Item
                name="schema"
                label={t('Schema')}
              >
                <Input placeholder="public" />
              </Form.Item>
            </Tabs.TabPane>
          </Tabs>
        )}
        
        <Form.Item
          name="enabled"
          label={t('Enabled')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? t('Update') : t('Create')}
            </Button>
            
            <Button onClick={handleTestConnection} loading={testLoading}>
              {t('Test Connection')}
            </Button>
            
            {onCancel && (
              <Button onClick={onCancel}>
                {t('Cancel')}
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}; 