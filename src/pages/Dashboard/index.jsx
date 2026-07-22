import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Empty, 
  Spin,
  Space,
  Alert,
  Button,
  List,
  Avatar,
  Badge,
  DatePicker
} from 'antd';
import { 
  FaShoppingCart, 
  FaUser, 
  FaDollarSign, 
  FaTags,
  FaChartBar,
  FaChartPie,
  FaChartLine,
  FaSync,
  FaTrophy,
  FaCrown,
  FaUndo
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import axios from 'axios';

// Configurar dayjs para usar o locale pt-BR
dayjs.locale('pt-br');

// URL da API com suporte a desenvolvimento local e produção
const API_URL = `${import.meta.env.VITE_REACT_APP_URL}`

// Cliente axios configurado para evitar problemas de CORS
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Anexa o token de autenticação automaticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("loginToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Cores para os gráficos
const COLORS = ['#E05297', '#1890FF', '#52c41a', '#f5be0b', '#722ed1', '#f67c7e'];

// Componente customizado para o tooltip do gráfico de vendas
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
        <p style={{ margin: '3px 0' }}>Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor)}</p>
        <p style={{ margin: '3px 0' }}>Transações: {data.total_transacoes}</p>
        <p style={{ margin: '3px 0' }}>Peças: {data.total_pecas}</p>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

// Componente customizado para o tooltip do gráfico de formas de pagamento
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{data.nome}</p>
        <p style={{ margin: '3px 0' }}>{data.valor} transações</p>
        <p style={{ margin: '3px 0' }}>Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor_total || 0)}</p>
        <p style={{ margin: '3px 0' }}>{data.percentual.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

PieTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array
};

// Componente para renderizar os rótulos no gráfico de barras
const renderCustomBarLabel = ({ x, y, width, value }) => {
  return (
    <text x={x + width / 2} y={y - 5} fill="#333" textAnchor="middle" fontSize={12} fontWeight="bold">
      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
    </text>
  );
};

renderCustomBarLabel.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  value: PropTypes.number
};

const Dashboard = () => {
  // Estado para o intervalo de datas selecionado
  const [dateRange, setDateRange] = React.useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  
  // Estado para controlar a visualização (diária ou mensal)
  const [viewMode, setViewMode] = React.useState('daily');

  const [data, setData] = React.useState({
    transacoes: [],
    estatisticas_totais: {
      total_clientes: 0,
      total_vendas: 0,
      total_pecas: 0,
      media_venda: 0,
      total_transacoes: 0
    },
    estatisticas_filtradas: {
      total_clientes: 0,
      total_vendas: 0,
      total_pecas: 0,
      media_venda: 0,
      total_transacoes: 0
    },
    vendas_dia: [],
    formas_pagamento: [],
    categorias: {},
    top_clientes: []
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Função para formatar valores em BRL
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  React.useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Formatando as datas para enviar ao servidor
      const dataInicio = dateRange[0].format('YYYY-MM-DD');
      const dataFim = dateRange[1].format('YYYY-MM-DD');
      
      console.log(`Buscando dados da API: ${API_URL}/dashboard.php com filtro: ${dataInicio} até ${dataFim}`);
      
      const response = await apiClient.get(`/dashboard.php?data_inicio=${dataInicio}&data_fim=${dataFim}`);
      
      console.log('Resposta da API:', response.data);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('A resposta da API não está no formato esperado');
      }
      
      setData({
        transacoes: response.data.transacoes || [],
        estatisticas_totais: response.data.estatisticas_totais || {
          total_clientes: 0,
          total_vendas: 0,
          total_pecas: 0,
          media_venda: 0,
          total_transacoes: 0
        },
        estatisticas_filtradas: response.data.estatisticas_filtradas || {
          total_clientes: 0,
          total_vendas: 0,
          total_pecas: 0,
          media_venda: 0,
          total_transacoes: 0
        },
        vendas_dia: response.data.vendas_dia || [],
        formas_pagamento: response.data.formas_pagamento || [],
        categorias: response.data.categorias || {},
        top_clientes: response.data.top_clientes || []
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(`Erro ao carregar dados do dashboard: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Manipulador para o filtro de datas
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange([
        dayjs(dates[0]),
        dayjs(dates[1])
      ]);
    }
  };

  // Função para resetar os filtros para o padrão (últimos 30 dias)
  const handleReset = () => {
    const defaultDateRange = [
      dayjs().subtract(30, 'days'),
      dayjs()
    ];
    setDateRange(defaultDateRange);
    // fetchData será chamado automaticamente pelo useEffect
  };

  // Dados para gráfico de vendas por dia
  const vendasDiaData = data.vendas_dia.length > 0
    ? data.vendas_dia.map(item => {
        const dataFormatada = dayjs(item.data).format('DD/MM/YYYY');
        
        // Agora usamos diretamente o total_pecas que vem da API
        return {
          data: dataFormatada,
          valor: parseFloat(item.valor_total || 0),
          total_transacoes: parseInt(item.total_transacoes || 0),
          total_pecas: parseInt(item.total_pecas || 0)
        };
      })
    : [{
        data: dayjs().format('DD/MM/YYYY'),
        valor: 0,
        total_transacoes: 0,
        total_pecas: 0
      }];

  // Função para agrupar dados por mês
  const agruparPorMes = () => {
    const dadosMensais = {};
    
    data.vendas_dia.forEach(item => {
      const data = dayjs(item.data);
      const mesAno = data.format('MM/YYYY');
      
      if (!dadosMensais[mesAno]) {
        dadosMensais[mesAno] = {
          data: mesAno,
          valor: 0,
          total_transacoes: 0,
          total_pecas: 0
        };
      }
      
      dadosMensais[mesAno].valor += parseFloat(item.valor_total || 0);
      dadosMensais[mesAno].total_transacoes += parseInt(item.total_transacoes || 0);
      dadosMensais[mesAno].total_pecas += parseInt(item.total_pecas || 0);
    });
    
    // Converter para array e ordenar por data
    return Object.values(dadosMensais).sort((a, b) => {
      const [mesA, anoA] = a.data.split('/');
      const [mesB, anoB] = b.data.split('/');
      return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
  };

  // Dados para exibição baseados no modo de visualização
  const dadosGrafico = viewMode === 'daily' ? vendasDiaData : agruparPorMes();

  // Dados para formas de pagamento em formato para Recharts
  const formasPagamentoData = data.formas_pagamento.length > 0 
    ? data.formas_pagamento.map((item, index) => ({
        nome: item.forma_pagamento || 'Não definido',
        valor: parseFloat(item.total || 0),
        valor_total: parseFloat(item.valor_total || 0),
        percentual: parseFloat(item.percentual || 0),
        color: COLORS[index % COLORS.length]
      }))
    : [{ nome: 'Sem dados', valor: 1, percentual: 100, color: '#cccccc' }];

  // Dados para categorias em formato para Recharts
  const categoriasData = Object.keys(data.categorias).length > 0 
    ? Object.entries(data.categorias)
        .map(([tag, quantidade], index) => ({ 
          nome: tag || 'Não categorizado', 
          quantidade: quantidade || 0,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5)
    : [{ nome: 'Sem dados', quantidade: 0, color: '#cccccc' }];

  // Cores para medalhas
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  // Ícones para os primeiros colocados
  const getRankIcon = (index) => {
    if (index === 0) return <FaCrown style={{ color: medalColors[0], fontSize: '20px' }} />;
    return <Badge count={index + 1} style={{ backgroundColor: medalColors[index] }} />;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Erro ao carregar dados"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button icon={<FaSync />} onClick={fetchData}>
                Tentar novamente
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  const hasStatisticsData = data.estatisticas_totais && Object.values(data.estatisticas_totais).some(v => v > 0);
  const hasSalesData = data.vendas_dia && data.vendas_dia.length > 0;
  const hasPaymentData = data.formas_pagamento && data.formas_pagamento.length > 0;
  const hasCategoriesData = data.categorias && Object.keys(data.categorias).length > 0;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {!hasStatisticsData && (
          <Alert 
            message="Sem dados estatísticos disponíveis" 
            description="Não foram encontrados dados estatísticos para exibir. Verifique se existem transações registradas no sistema."
            type="info" 
            showIcon 
          />
        )}
        
        {/* Cards com estatísticas globais */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total de Vendas (Geral)"
                value={data.estatisticas_totais.total_vendas || 0}
                prefix={<FaDollarSign />}
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => formatCurrency(value)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total de Peças (Geral)"
                value={data.estatisticas_totais.total_pecas || 0}
                prefix={<FaTags />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total de Clientes (Geral)"
                value={data.estatisticas_totais.total_clientes || 0}
                prefix={<FaUser />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Média por Venda (Geral)"
                value={data.estatisticas_totais.media_venda || 0}
                prefix={<FaShoppingCart />}
                valueStyle={{ color: '#faad14' }}
                formatter={(value) => formatCurrency(value)}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtro de datas */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <Space>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                />
                <Button icon={<FaUndo />} onClick={handleReset}>
                  Resetar Filtros
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Estatísticas do período filtrado */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Período Selecionado" loading={loading}>
              {dateRange && dateRange.length === 2 ? (
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Statistic title="Total Vendas" value={data.estatisticas_filtradas.total_vendas || 0} formatter={(value) => formatCurrency(value)} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="Total Peças" value={data.estatisticas_filtradas.total_pecas || 0} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="Total Clientes" value={data.estatisticas_filtradas.total_clientes || 0} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="Média por Venda" value={data.estatisticas_filtradas.media_venda || 0} formatter={(value) => formatCurrency(value)} />
                  </Col>
                </Row>
              ) : (
                <Empty description="Selecione um período para visualizar" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Gráfico de Vendas */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title="Vendas por Período" 
              extra={
                <Space>
                  <Button.Group>
                    <Button 
                      type={viewMode === 'daily' ? 'primary' : 'default'}
                      onClick={() => setViewMode('daily')}
                    >
                      Diário
                    </Button>
                    <Button 
                      type={viewMode === 'monthly' ? 'primary' : 'default'}
                      onClick={() => setViewMode('monthly')}
                    >
                      Mensal
                    </Button>
                  </Button.Group>
                  <FaChartLine />
                </Space>
              }
            >
              {hasSalesData ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosGrafico}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="valor"
                        name="Valor de Vendas"
                        fill="#E05297"
                        label={renderCustomBarLabel}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="Não há dados de vendas no período selecionado" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Gráfico de Formas de Pagamento */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card 
              title="Formas de Pagamento" 
              extra={<FaChartPie />}
            >
              {hasPaymentData ? (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formasPagamentoData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="valor"
                        nameKey="nome"
                        label={({ nome, percentual }) => `${nome} (${percentual.toFixed(1)}%)`}
                      >
                        {formasPagamentoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="Não há dados de formas de pagamento no período selecionado" />
              )}
            </Card>
          </Col>
          
          {/* Gráfico de Categorias */}
          <Col span={12}>
            <Card 
              title="Categorias Mais Vendidas" 
              extra={<FaChartBar />}
            >
              {hasCategoriesData ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoriasData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nome" type="category" />
                      <RechartsTooltip
                        formatter={(value) => [`${value} peças`, 'Quantidade']}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="quantidade" name="Peças">
                        {categoriasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="Não há dados de categorias no período selecionado" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title="Top 3 Funcionários por Valor" 
              extra={<FaTrophy style={{ color: '#FFD700' }} />}
            >
              {data.top_clientes && data.top_clientes.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={data.top_clientes}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={<FaUser />} 
                            style={{ 
                              backgroundColor: medalColors[index] || '#E05297',
                              verticalAlign: 'middle'
                            }} 
                          />
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getRankIcon(index)}
                            <span style={{ marginLeft: '8px' }}>{item.nome}</span>
                          </div>
                        }
                        description={`${item.total_transacoes} transações, ${item.total_pecas} peças`}
                      />
                      <div>
                        <Statistic
                          value={item.total_compras}
                          precision={2}
                          valueStyle={{ color: '#E05297' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="Não há dados de funcionários no período selecionado" />
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default Dashboard; 