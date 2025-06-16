import React, { useState } from 'react';
import { 
  useTranslation, 
  useResourceActionContext,
  useResourceContext,
  SchemaComponent,
  ActionContextProvider,
  useAPIClient
} from '@nocobase/client';
import { DataSourceForm } from '../components';
import { Card, Table, Button, Space, Modal, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const schema = {
  type: 'object',
  properties: {
    dataSources: {
      type: 'array',
      'x-component': 'DataSourcesTable',
    },
  },
};

const DataSourcesTable = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const resource = useResourceContext();
  const { refresh } = useResourceActionContext();
  
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  React.useEffect(() => {
    fetchDataSources();
  }, []);
  
  const fetchDataSources = async () => {
    setLoading(true);
    
    try {
      const response = await api.resource('postgresConnector:dataSources').list();
      setDataSource(response.data.data);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
      message.error(t('Failed to load data sources'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };
  
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setModalVisible(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await api.resource('postgresConnector:dataSources').destroy({
        filterByTk: id,
      });
      
      message.success(t('Data source deleted successfully'));
      fetchDataSources();
    } catch (error) {
      console.error('Failed to delete data source:', error);
      message.error(t('Failed to delete data source'));
    }
  };
  
  const handleFormFinish = async (values: any) => {
    try {
      if (editingRecord) {
        await api.resource('postgresConnector:dataSources').update({
          filterByTk: editingRecord.id,
          values,
        });
        message.success(t('Data source updated successfully'));
      } else {
        await api.resource('postgresConnector:dataSources').create({
          values,
        });
        message.success(t('Data source created successfully'));
      }
      
      setModalVisible(false);
      fetchDataSources();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(editingRecord ? t('Failed to update data source') : t('Failed to create data source'));
    }
  };
  
  const columns = [
    {
      title: t('Name'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('Type'),
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => text === 'postgres' ? 'PostgreSQL' : 'MySQL',
    },
    {
      title: t('Host'),
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: t('Database'),
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: t('Status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <span style={{ color: enabled ? 'green' : 'red' }}>
          {enabled ? t('Enabled') : t('Disabled')}
        </span>
      ),
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record: any) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            {t('Edit')}
          </Button>
          <Popconfirm
            title={t('Are you sure you want to delete this data source?')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('Yes')}
            cancelText={t('No')}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              {t('Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
        >
          {t('Add Data Source')}
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
      />
      
      <Modal
        title={editingRecord ? t('Edit Data Source') : t('Add Data Source')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <DataSourceForm
          initialValues={editingRecord}
          onFinish={handleFormFinish}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

const DataSourcesPage = () => {
  const { t } = useTranslation();
  
  return (
    <Card title={t('Data Sources')}>
      <ActionContextProvider value={{ visible: true }}>
        <SchemaComponent
          schema={schema}
          scope={{
            DataSourcesTable,
          }}
        />
      </ActionContextProvider>
    </Card>
  );
};

export default DataSourcesPage; 