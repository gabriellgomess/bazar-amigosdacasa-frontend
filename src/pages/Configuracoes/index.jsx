import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Tabs, 
  Switch, 
  InputNumber, 
  Button, 
  Form, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  Input, 
  message, 
  Popconfirm,
  Tooltip
} from 'antd';
import { 
  FaSlidersH, 
  FaGift, 
  FaTicketAlt, 
  FaPlus, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff 
} from 'react-icons/fa';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Anexa o token de autenticação automaticamente em todas as chamadas de configuração
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("loginToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const Configuracoes = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [formGeral] = Form.useForm();

  // Estados dos cartões presentes
  const [cartoes, setCartoes] = useState([]);
  const [cartoesLoading, setCartoesLoading] = useState(false);
  const [cartoesPagination, setCartoesPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [buscaCartao, setBuscaCartao] = useState('');
  const [modalCartaoOpen, setModalCartaoOpen] = useState(false);
  const [formCartao] = Form.useForm();

  // Estados dos vouchers
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [vouchersPagination, setVouchersPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [buscaVoucher, setBuscaVoucher] = useState('');
  const [modalVoucherOpen, setModalVoucherOpen] = useState(false);
  const [formVoucher] = Form.useForm();

  // Carregar configurações gerais
  const loadGeral = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/configuracoes');
      formGeral.setFieldsValue({
        permitir_venda_funcionarios: response.data.permitir_venda_funcionarios === '1',
        permitir_vouchers: response.data.permitir_vouchers === '1',
        permitir_cartoes_presente: response.data.permitir_cartoes_presente === '1',
        valor_padrao_voucher: parseFloat(response.data.valor_padrao_voucher || 150),
      });
    } catch (error) {
      console.error("Erro ao carregar configurações gerais:", error);
      message.error("Não foi possível carregar as configurações gerais.");
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações gerais
  const saveGeral = async (values) => {
    try {
      setLoading(true);
      const payload = {
        permitir_venda_funcionarios: values.permitir_venda_funcionarios ? '1' : '0',
        permitir_vouchers: values.permitir_vouchers ? '1' : '0',
        permitir_cartoes_presente: values.permitir_cartoes_presente ? '1' : '0',
        valor_padrao_voucher: values.valor_padrao_voucher,
      };
      await apiClient.post('/configuracoes', payload);
      message.success("Configurações gerais salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      message.error(error.response?.data?.message || "Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar cartões de presente
  const loadCartoes = async (page = 1, busca = '') => {
    try {
      setCartoesLoading(true);
      const response = await apiClient.get('/cartoes_presentes', {
        params: { page, busca }
      });
      setCartoes(response.data.data);
      setCartoesPagination({
        current: response.data.current_page,
        pageSize: response.data.per_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Erro ao carregar cartões presentes:", error);
      message.error("Não foi possível carregar os cartões de presente.");
    } finally {
      setCartoesLoading(false);
    }
  };

  // Carregar vouchers
  const loadVouchers = async (page = 1, busca = '') => {
    try {
      setVouchersLoading(true);
      const response = await apiClient.get('/vouchers', {
        params: { page, busca }
      });
      setVouchers(response.data.data);
      setVouchersPagination({
        current: response.data.current_page,
        pageSize: response.data.per_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Erro ao carregar vouchers:", error);
      message.error("Não foi possível carregar os vouchers.");
    } finally {
      setVouchersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === '1') {
      loadGeral();
    } else if (activeTab === '2') {
      loadCartoes(1, buscaCartao);
    } else if (activeTab === '3') {
      loadVouchers(1, buscaVoucher);
    }
  }, [activeTab]);

  // Manipular criação de cartão presente
  const handleAddCartao = async (values) => {
    try {
      setCartoesLoading(true);
      await apiClient.post('/cartoes_presentes', values);
      message.success("Cartão presente cadastrado com sucesso!");
      setModalCartaoOpen(false);
      formCartao.resetFields();
      loadCartoes(1, buscaCartao);
    } catch (error) {
      console.error("Erro ao criar cartão presente:", error);
      message.error(error.response?.data?.message || "Erro ao cadastrar cartão.");
    } finally {
      setCartoesLoading(false);
    }
  };

  // Manipular exclusão de cartão presente
  const handleDeleteCartao = async (id) => {
    try {
      setCartoesLoading(true);
      await apiClient.delete(`/cartoes_presentes/${id}`);
      message.success("Cartão presente excluído!");
      loadCartoes(cartoesPagination.current, buscaCartao);
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
      message.error(error.response?.data?.message || "Erro ao excluir cartão.");
    } finally {
      setCartoesLoading(false);
    }
  };

  // Manipular toggle status do cartão presente
  const handleToggleCartao = async (id) => {
    try {
      setCartoesLoading(true);
      await apiClient.post(`/cartoes_presentes/${id}/toggle-status`);
      message.success("Status do cartão alterado!");
      loadCartoes(cartoesPagination.current, buscaCartao);
    } catch (error) {
      console.error("Erro ao alterar status do cartão:", error);
      message.error("Erro ao alterar status do cartão.");
    } finally {
      setCartoesLoading(false);
    }
  };

  // Manipular criação de voucher
  const handleAddVoucher = async (values) => {
    try {
      setVouchersLoading(true);
      await apiClient.post('/vouchers', values);
      message.success("Voucher cadastrado com sucesso!");
      setModalVoucherOpen(false);
      formVoucher.resetFields();
      loadVouchers(1, buscaVoucher);
    } catch (error) {
      console.error("Erro ao criar voucher:", error);
      message.error(error.response?.data?.message || "Erro ao cadastrar voucher.");
    } finally {
      setVouchersLoading(false);
    }
  };

  // Manipular exclusão de voucher
  const handleDeleteVoucher = async (id) => {
    try {
      setVouchersLoading(true);
      await apiClient.delete(`/vouchers/${id}`);
      message.success("Voucher excluído!");
      loadVouchers(vouchersPagination.current, buscaVoucher);
    } catch (error) {
      console.error("Erro ao excluir voucher:", error);
      message.error(error.response?.data?.message || "Erro ao excluir voucher.");
    } finally {
      setVouchersLoading(false);
    }
  };

  // Manipular toggle status do voucher
  const handleToggleVoucher = async (id) => {
    try {
      setVouchersLoading(true);
      await apiClient.post(`/vouchers/${id}/toggle-status`);
      message.success("Status do voucher alterado!");
      loadVouchers(vouchersPagination.current, buscaVoucher);
    } catch (error) {
      console.error("Erro ao alterar status do voucher:", error);
      message.error("Erro ao alterar status do voucher.");
    } finally {
      setVouchersLoading(false);
    }
  };

  // Formatar datas para exibição local
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Definições de colunas da tabela de Cartões Presentes
  const columnsCartoes = [
    { title: 'Código / ID', dataIndex: 'id', key: 'id', width: '20%' },
    { 
      title: 'Valor', 
      dataIndex: 'valor', 
      key: 'valor', 
      width: '20%', 
      render: (v) => formatCurrency(v) 
    },
    { 
      title: 'Status', 
      dataIndex: 'usado', 
      key: 'usado', 
      width: '20%', 
      render: (usado) => (
        <Tag color={usado === 1 ? 'red' : 'green'}>
          {usado === 1 ? 'Utilizado' : 'Disponível'}
        </Tag>
      )
    },
    { 
      title: 'Usado Em', 
      dataIndex: 'usado_em', 
      key: 'usado_em', 
      width: '25%', 
      render: (d) => formatDateTime(d) 
    },
    { 
      title: 'Ações', 
      key: 'acoes', 
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={record.usado === 1 ? "Marcar como Disponível" : "Marcar como Utilizado"}>
            <Button 
              type="text" 
              icon={record.usado === 1 ? <FaToggleOff className="text-gray-500 text-lg" /> : <FaToggleOn className="text-teal-600 text-lg" />} 
              onClick={() => handleToggleCartao(record.id)}
            />
          </Tooltip>
          
          {record.usado === 0 && (
            <Popconfirm
              title="Deseja excluir este cartão presente?"
              onConfirm={() => handleDeleteCartao(record.id)}
              okText="Sim"
              cancelText="Não"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<FaTrash />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Definições de colunas da tabela de Vouchers
  const columnsVouchers = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: '20%' },
    { 
      title: 'Valor', 
      dataIndex: 'valor', 
      key: 'valor', 
      width: '20%', 
      render: (v) => formatCurrency(v) 
    },
    { 
      title: 'Status', 
      key: 'status', 
      width: '20%', 
      render: (_, record) => {
        if (record.usado) {
          return <Tag color="red">Utilizado</Tag>;
        }
        return (
          <Tag color={record.ativo ? 'green' : 'orange'}>
            {record.ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        );
      }
    },
    { 
      title: 'Usado Em', 
      dataIndex: 'usado_em', 
      key: 'usado_em', 
      width: '25%', 
      render: (d) => formatDateTime(d) 
    },
    { 
      title: 'Ações', 
      key: 'acoes', 
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          {!record.usado && (
            <Tooltip title={record.ativo ? "Desativar Voucher" : "Ativar Voucher"}>
              <Button 
                type="text" 
                icon={record.ativo ? <FaToggleOn className="text-teal-600 text-lg" /> : <FaToggleOff className="text-gray-500 text-lg" />} 
                onClick={() => handleToggleVoucher(record.id)}
              />
            </Tooltip>
          )}
          
          {!record.usado && (
            <Popconfirm
              title="Deseja excluir este voucher?"
              onConfirm={() => handleDeleteVoucher(record.id)}
              okText="Sim"
              cancelText="Não"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<FaTrash />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card title={<span className="text-xl font-bold text-slate-800">Painel de Configurações</span>}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2">
                  <FaSlidersH /> Geral
                </span>
              ),
              children: (
                <div className="py-4 max-w-lg">
                  <Form
                    form={formGeral}
                    layout="vertical"
                    onFinish={saveGeral}
                  >
                    <Form.Item 
                      name="permitir_venda_funcionarios" 
                      label="Venda para Funcionários (Desconto em Folha)" 
                      valuePropName="checked"
                    >
                      <Switch 
                        checkedChildren="Habilitado" 
                        unCheckedChildren="Desabilitado" 
                        loading={loading}
                      />
                    </Form.Item>

                    <Form.Item 
                      name="permitir_vouchers" 
                      label="Uso de Vouchers" 
                      valuePropName="checked"
                    >
                      <Switch 
                        checkedChildren="Habilitado" 
                        unCheckedChildren="Desabilitado" 
                        loading={loading}
                      />
                    </Form.Item>

                    <Form.Item 
                      name="permitir_cartoes_presente" 
                      label="Uso de Cartões Presente" 
                      valuePropName="checked"
                    >
                      <Switch 
                        checkedChildren="Habilitado" 
                        unCheckedChildren="Desabilitado" 
                        loading={loading}
                      />
                    </Form.Item>

                    <Form.Item 
                      name="valor_padrao_voucher" 
                      label="Valor Padrão de Vouchers (BRL)"
                      rules={[{ required: true, message: 'Digite o valor padrão do voucher.' }]}
                    >
                      <InputNumber 
                        className="w-full" 
                        min={0} 
                        formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\R\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        className="bg-teal-600 hover:bg-teal-700 border-none px-6"
                      >
                        Salvar Configurações
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2">
                  <FaGift /> Cartões Presentes
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                    <Input.Search
                      placeholder="Pesquisar por Código/ID..."
                      onSearch={(value) => {
                        setBuscaCartao(value);
                        loadCartoes(1, value);
                      }}
                      className="max-w-xs"
                      allowClear
                    />
                    <Button 
                      type="primary" 
                      icon={<FaPlus />}
                      onClick={() => setModalCartaoOpen(true)}
                      className="bg-teal-600 hover:bg-teal-700 border-none"
                    >
                      Novo Cartão Presente
                    </Button>
                  </div>

                  <Table
                    columns={columnsCartoes}
                    dataSource={cartoes}
                    loading={cartoesLoading}
                    rowKey="id"
                    pagination={{
                      current: cartoesPagination.current,
                      pageSize: cartoesPagination.pageSize,
                      total: cartoesPagination.total,
                      onChange: (page) => loadCartoes(page, buscaCartao)
                    }}
                  />
                </div>
              )
            },
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2">
                  <FaTicketAlt /> Vouchers
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                    <Input.Search
                      placeholder="Pesquisar por Código..."
                      onSearch={(value) => {
                        setBuscaVoucher(value);
                        loadVouchers(1, value);
                      }}
                      className="max-w-xs"
                      allowClear
                    />
                    <Button 
                      type="primary" 
                      icon={<FaPlus />}
                      onClick={() => setModalVoucherOpen(true)}
                      className="bg-teal-600 hover:bg-teal-700 border-none"
                    >
                      Novo Voucher
                    </Button>
                  </div>

                  <Table
                    columns={columnsVouchers}
                    dataSource={vouchers}
                    loading={vouchersLoading}
                    rowKey="id"
                    pagination={{
                      current: vouchersPagination.current,
                      pageSize: vouchersPagination.pageSize,
                      total: vouchersPagination.total,
                      onChange: (page) => loadVouchers(page, buscaVoucher)
                    }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Modal para Adicionar Cartão Presente */}
      <Modal
        title="Novo Cartão Presente"
        open={modalCartaoOpen}
        onCancel={() => {
          setModalCartaoOpen(false);
          formCartao.resetFields();
        }}
        footer={null}
      >
        <Form
          form={formCartao}
          layout="vertical"
          onFinish={handleAddCartao}
          className="pt-2"
        >
          <Form.Item
            name="id"
            label="Código / ID do Cartão"
            rules={[{ required: true, message: 'Digite o código numérico do cartão presente.' }]}
          >
            <InputNumber className="w-full" precision={0} min={1} placeholder="Ex: 50452" />
          </Form.Item>

          <Form.Item
            name="valor"
            label="Valor do Cartão"
            rules={[{ required: true, message: 'Digite o valor do cartão presente.' }]}
          >
            <InputNumber 
              className="w-full" 
              min={0.01} 
              placeholder="Ex: 100.00"
              formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\R\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalCartaoOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" className="bg-teal-600 hover:bg-teal-700 border-none">
                Criar Cartão
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para Adicionar Voucher */}
      <Modal
        title="Novo Voucher"
        open={modalVoucherOpen}
        onCancel={() => {
          setModalVoucherOpen(false);
          formVoucher.resetFields();
        }}
        footer={null}
      >
        <Form
          form={formVoucher}
          layout="vertical"
          onFinish={handleAddVoucher}
          className="pt-2"
        >
          <Form.Item
            name="codigo"
            label="Código do Voucher"
            rules={[{ required: true, message: 'Digite o código do voucher.' }]}
          >
            <Input placeholder="Ex: AMIGOSDACASA-10" />
          </Form.Item>

          <Form.Item
            name="valor"
            label="Valor do Voucher"
            rules={[{ required: true, message: 'Digite o valor do voucher.' }]}
          >
            <InputNumber 
              className="w-full" 
              min={0.01} 
              placeholder="Ex: 150.00"
              formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\R\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVoucherOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" className="bg-teal-600 hover:bg-teal-700 border-none">
                Criar Voucher
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Configuracoes;
