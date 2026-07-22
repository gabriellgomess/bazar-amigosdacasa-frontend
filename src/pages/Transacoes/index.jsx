import { useState, useEffect, useRef, useContext } from 'react';
import { 
  Button, 
  Input, 
  Space, 
  Table, 
  Card, 
  DatePicker, 
  Select, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Tooltip,
  message,
  Popconfirm
} from 'antd';
import { 
  FaSearch, 
  FaFileExcel, 
  FaFilePdf,
  FaSync,
  FaFilter,
  FaTrash
} from 'react-icons/fa';
import Highlighter from 'react-highlight-words';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MyContext } from '../../contexts/MyContext';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Configurar dayjs para usar o locale pt-BR
dayjs.locale('pt-br');

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

// URL da API com suporte a desenvolvimento local e produção
const API_URL = `${import.meta.env.VITE_REACT_APP_URL}`;

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

const Transacoes = () => {
  const { rootState } = useContext(MyContext);
  const { theUser } = rootState;
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Estados para filtros
  const [dateRange, setDateRange] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState(null);
  const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState(null);
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [localVendaFiltro, setLocalVendaFiltro] = useState(null);
  const [beneficioFiltro, setBeneficioFiltro] = useState(null);
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);
  const canDeleteTransaction = theUser?.nivel_acesso?.toLowerCase() === 'diretoria';

  // Função para formatar valores monetários de forma robusta e segura
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(isNaN(num) ? 0 : num);
  };

  // Função para buscar dados da API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros de filtro
      let params = {};
      
      if (dateRange && dateRange.length === 2) {
        params.data_inicio = dateRange[0].format('YYYY-MM-DD');
        params.data_fim = dateRange[1].format('YYYY-MM-DD');
      }
      
      if (tipoFiltro) {
        params.tipo = tipoFiltro;
      }
      
      if (formaPagamentoFiltro) {
        params.forma_pagamento = formaPagamentoFiltro;
      }
      
      if (nomeFiltro) {
        params.nome = nomeFiltro;
      }

      if (localVendaFiltro) {
        params.local_venda = localVendaFiltro;
      }

      if (usuarioFiltro) {
        params.usuario = usuarioFiltro;
      }

      if (beneficioFiltro) {
        params.beneficio = beneficioFiltro;
      }
      
      const response = await apiClient.get('/busca_transacoes.php', { params });
      
      // Formatar dados recebidos
      const formattedData = response.data.map(item => {
        let parsedLog = [];
        if (Array.isArray(item.log_transacao)) {
          parsedLog = item.log_transacao;
        } else if (typeof item.log_transacao === 'string' && item.log_transacao) {
          try {
            parsedLog = JSON.parse(item.log_transacao);
          } catch (e) {
            console.error("Erro ao analisar log_transacao:", e);
            parsedLog = [];
          }
        }
        return {
          ...item,
          log_transacao: parsedLog
        };
      });
      
      setDataSource(formattedData);
      setFilteredData(formattedData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      message.error("Erro ao carregar as transações");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTransaction = async (record) => {
    try {
      setDeletingId(record.id);

      const { data } = await apiClient.post('/deletar_transacao.php', {
        id: record.id,
        usuario: theUser.nome,
        nivel_acesso: theUser.nivel_acesso
      });

      if (data.status === 'success') {
        message.success(data.message || 'Transação excluída com sucesso.');
        fetchData();
      } else {
        message.error(data.message || 'Erro ao excluir transação.');
      }
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      message.error('Erro ao excluir transação.');
    } finally {
      setDeletingId(null);
    }
  };

  // Configurações de pesquisa nas colunas
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };
  
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Pesquisar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<FaSearch />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Limpar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <FaSearch style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  // Renderizador para expandir as linhas mostrando os itens da transação
  const expandedRowRender = (record) => {
    const subColumns = [
      { title: 'ID', dataIndex: 'id', key: 'id', width: '5%' },
      { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: '8%' },
      { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', width: '25%' },
      { title: 'Quantidade', dataIndex: 'quantidade', key: 'quantidade', width: '10%' },
      { title: 'Tag', dataIndex: 'tag', key: 'tag', width: '15%', render: (tag) => (
        <Tag color="blue">{tag || 'Sem Categoria'}</Tag>
      )},
      { 
        title: 'Valor', 
        dataIndex: 'valor_pago', 
        key: 'valor', 
        width: '15%',
        render: (text, item) => {
          // Fallbacks de valor caso valor_pago esteja ausente
          const valor = text ?? item.desc_func_10 ?? item.valor_sugerido ?? 0;
          return formatCurrency(valor);
        }
      }
    ];

    // Se log_transacao estiver vazio
    if (!record.log_transacao) {
      return <p style={{ padding: '8px 0' }}>Não há detalhes para esta transação</p>;
    } else {
      // Garantir que temos um array para renderizar
      let items = [];
      try {
        if (Array.isArray(record.log_transacao)) {
          items = record.log_transacao;
        } else if (typeof record.log_transacao === 'string') {
          items = JSON.parse(record.log_transacao);
        }
      } catch (e) {
        console.error("Erro ao analisar log_transacao:", e);
        items = [];
      }

      const hasDiscounts = 
        parseFloat(record.desconto_primeira_compra || 0) > 0 ||
        parseFloat(record.cashback_usado || 0) > 0 ||
        parseFloat(record.voucher_valor || 0) > 0 ||
        parseFloat(record.cartao_presente_valor || 0) > 0 ||
        parseFloat(record.cashback_gerado || 0) > 0;

      return (
        <div style={{ padding: '10px' }}>
          {hasDiscounts && (
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px' }}>
              <Typography.Text strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                Resumo de Descontos e Créditos da Venda #{record.id}
              </Typography.Text>
              <Space size="middle" wrap>
                {parseFloat(record.desconto_primeira_compra || 0) > 0 && (
                  <Tag color="green" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <strong>Desconto 1ª Compra (10%):</strong> - {formatCurrency(record.desconto_primeira_compra)}
                  </Tag>
                )}
                {parseFloat(record.cashback_usado || 0) > 0 && (
                  <Tag color="blue" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <strong>Cashback Utilizado:</strong> - {formatCurrency(record.cashback_usado)}
                  </Tag>
                )}
                {parseFloat(record.voucher_valor || 0) > 0 && (
                  <Tag color="purple" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <strong>Voucher:</strong> - {formatCurrency(record.voucher_valor)}
                  </Tag>
                )}
                {parseFloat(record.cartao_presente_valor || 0) > 0 && (
                  <Tag color="cyan" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <strong>Cartão Presente:</strong> - {formatCurrency(record.cartao_presente_valor)}
                  </Tag>
                )}
                {parseFloat(record.cashback_gerado || 0) > 0 && (
                  <Tag color="orange" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <strong>Cashback Gerado:</strong> + {formatCurrency(record.cashback_gerado)}
                  </Tag>
                )}
              </Space>
            </div>
          )}
          <Table 
            columns={subColumns} 
            dataSource={items} 
            pagination={false} 
            rowKey={(item, index) => `${record.id}-item-${index}`}
            size="small"
          />
        </div>
      );
    }
  };

  // Definição das colunas da tabela principal
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      sortDirections: ['descend', 'ascend'],
      width: '5%'
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      ...getColumnSearchProps('nome'),
      onFilter: (value, record) => {
        const searchVal = value.toLowerCase();
        const nomeMatch = record.nome?.toLowerCase().includes(searchVal);
        const compradorNomeMatch = record.comprador_nome?.toLowerCase().includes(searchVal);
        const compradorCpfMatch = record.comprador_cpf?.toLowerCase().includes(searchVal);
        return !!(nomeMatch || compradorNomeMatch || compradorCpfMatch);
      },
      width: '20%',
      render: (text, record) => {
        if (record.comprador_nome) {
          const formatCPF = (cpf) => {
            if (!cpf) return '';
            const clean = cpf.replace(/\D/g, '');
            if (clean.length === 11) {
              return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            }
            return cpf;
          };
          return (
            <Tooltip title={`Comprador identificado. CPF: ${formatCPF(record.comprador_cpf)}`}>
              <span>
                {text} <span style={{ color: '#0d9488', fontWeight: '600' }}>({record.comprador_nome})</span>
              </span>
            </Tooltip>
          );
        }
        return text;
      }
    },
    {
      title: 'Peças',
      dataIndex: 'total_pecas',
      key: 'total_pecas',
      width: '5%',
      sorter: (a, b) => a.total_pecas - b.total_pecas
    },
    {
      title: 'Parcelas',
      dataIndex: 'parcelas',
      key: 'parcelas',
      width: '7%'
    },
    {
      title: 'Pagamento',
      dataIndex: 'forma_pagamento',
      key: 'forma_pagamento',
      width: '10%',
      filters: [
        { text: 'Débito', value: 'Debito' },
        { text: 'Crédito', value: 'Credito' },
        { text: 'Dinheiro', value: 'Dinheiro' },
        { text: 'Pix', value: 'Pix' },
        { text: 'Desconto em Folha', value: 'Desconto em Folha' },
      ],
      onFilter: (value, record) => record.forma_pagamento.indexOf(value) === 0,
      render: (text) => {
        let color = 'default';
        switch(text) {
          case 'Credito': color = 'blue'; break;
          case 'Debito': color = 'green'; break;
          case 'Dinheiro': color = 'gold'; break;
          case 'Pix': color = 'purple'; break;
          case 'Desconto em Folha': color = 'orange'; break;
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: '8%',
      filters: [
        { text: 'Funcionário', value: 'funcionario' },
        { text: 'Externo', value: 'externo' },
        { text: 'Externo Promo', value: 'externo promo' },
      ],
      onFilter: (value, record) => record.tipo.indexOf(value) === 0,
      render: (text) => {
        let color = text === 'funcionario' ? 'green' : (text === 'externo promo' ? 'volcano' : 'geekblue');
        let label = text === 'funcionario' ? 'Funcionário' : (text === 'externo promo' ? 'Ext. Promo' : 'Externo');
        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: 'Local',
      dataIndex: 'local_venda',
      key: 'local_venda',
      width: '10%',
      filters: [
        { text: 'Loja Física', value: 'Loja Física' },
        { text: 'Unidade Móvel', value: 'Unidade Móvel' },
      ],
      onFilter: (value, record) => (record.local_venda || 'Loja Física').indexOf(value) === 0,
      render: (text) => {
        const val = text || 'Loja Física';
        const color = val === 'Unidade Móvel' ? 'purple' : 'default';
        return <Tag color={color}>{val}</Tag>;
      }
    },
    {
      title: 'Valor',
      dataIndex: 'valor_compra',
      key: 'valor_compra',
      width: '10%',
      sorter: (a, b) => a.valor_compra - b.valor_compra,
      sortDirections: ['descend', 'ascend'],
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Cartão Presente',
      dataIndex: 'cartao_presente_valor',
      key: 'cartao_presente_valor',
      width: '10%',
      render: (text, record) => {
        if (!text) return '-';
        const usado = record.cartao_presente_usado === '1';
        return (
          <Tooltip title={usado ? 'Cartão já utilizado' : 'Cartão disponível'}>
            <Tag color={usado ? 'red' : 'green'}>
              {formatCurrency(text)}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Voucher',
      dataIndex: 'voucher_valor',
      key: 'voucher_valor',
      width: '8%',
      render: (text) => {
        if (!text || text === 0) return '-';
        return (
          <Tooltip title="Voucher de R$ 200,00 aplicado">
            <Tag color="purple">
              {formatCurrency(text)}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Descontos / Cashback',
      key: 'descontos_cashback',
      width: '12%',
      render: (_, record) => {
        const hasDesc1 = parseFloat(record.desconto_primeira_compra || 0) > 0;
        const hasCashbackUsado = parseFloat(record.cashback_usado || 0) > 0;
        const hasCashbackGerado = parseFloat(record.cashback_gerado || 0) > 0;
        
        if (!hasDesc1 && !hasCashbackUsado && !hasCashbackGerado) return '-';
        
        return (
          <Space direction="vertical" size="2px">
            {hasDesc1 && (
              <Tooltip title="Desconto de 10% da Primeira Compra">
                <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>
                  1ª Compra: -{formatCurrency(record.desconto_primeira_compra)}
                </Tag>
              </Tooltip>
            )}
            {hasCashbackUsado && (
              <Tooltip title="Saldo de Cashback Utilizado como desconto">
                <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>
                  Uso Cashback: -{formatCurrency(record.cashback_usado)}
                </Tag>
              </Tooltip>
            )}
            {hasCashbackGerado && (
              <Tooltip title="Cashback gerado nesta compra para uso futuro">
                <Tag color="orange" style={{ fontSize: '11px', margin: 0 }}>
                  Ganho: +{formatCurrency(record.cashback_gerado)}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: '8%',
      sorter: (a, b) => {
        // Converter de DD/MM/YYYY para formato de data para comparação
        const partsA = a.data.split('/');
        const partsB = b.data.split('/');
        const dateA = new Date(partsA[2], partsA[1]-1, partsA[0]);
        const dateB = new Date(partsB[2], partsB[1]-1, partsB[0]);
        return dateA - dateB;
      },
      sortDirections: ['descend', 'ascend'],
      defaultSortOrder: 'descend'
    },
    {
      title: 'Usuário',
      dataIndex: 'usuario',
      key: 'usuario',
      width: '10%',
      ...getColumnSearchProps('usuario')
    },
    ...(canDeleteTransaction ? [{
      title: 'Ações',
      key: 'acoes',
      width: '8%',
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="Excluir transação"
          description={`Tem certeza que deseja excluir a transação #${record.id}?`}
          okText="Excluir"
          cancelText="Cancelar"
          okButtonProps={{ danger: true, loading: deletingId === record.id }}
          onConfirm={() => handleDeleteTransaction(record)}
        >
          <Button
            danger
            size="small"
            icon={<FaTrash />}
            loading={deletingId === record.id}
          >
            Excluir
          </Button>
        </Popconfirm>
      )
    }] : []),
  ];

  // Função para aplicar os filtros externos
  const handleApplyFilters = () => {
    fetchData();
  };

  // Função para resetar todos os filtros
  const handleResetFilters = () => {
    setDateRange(null);
    setTipoFiltro(null);
    setFormaPagamentoFiltro(null);
    setNomeFiltro('');
    setLocalVendaFiltro(null);
    setBeneficioFiltro(null);
    setUsuarioFiltro('');
    
    // Recarregar os dados sem filtros
    // Usamos setTimeout para garantir que os estados resetados sejam aplicados antes de fetchData
    setTimeout(() => {
      fetchData();
    }, 50);
  };

  // Função para exportação em Excel
  const exportToExcel = () => {
    // Preparar dados para exportação, excluindo a coluna log_transacao
    const exportData = filteredData.map(item => {
      // Criar um novo objeto sem log_transacao
      const newItem = { ...item };
      delete newItem.log_transacao;
      
      return {
        ...newItem,
        valor_compra: parseFloat(newItem.valor_compra),
        // Formatar os valores para exibição no Excel
        valor_compra_formatado: formatCurrency(newItem.valor_compra),
        cartao_presente_valor_formatado: newItem.cartao_presente_valor ? formatCurrency(newItem.cartao_presente_valor) : '-',
        voucher_valor_formatado: newItem.voucher_valor ? formatCurrency(newItem.voucher_valor) : '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = { Sheets: { 'Transações': ws }, SheetNames: ['Transações'] };

    // Configurar larguras de coluna
    ws['!cols'] = [
      { width: 5 },   // ID
      { width: 30 },  // Nome
      { width: 5 },   // Peças
      { width: 5 },   // Parcelas
      { width: 15 },  // Pagamento
      { width: 10 },  // Tipo
      { width: 15 },  // Valor
      { width: 15 },  // Cartão Presente
      { width: 12 },  // Voucher
      { width: 10 },  // Data
      { width: 15 },  // Usuário
    ];
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Gerar nome do arquivo com data atual
    const fileName = `transacoes_${new Date().toISOString().split('T')[0]}`;
    FileSaver.saveAs(fileData, `${fileName}.xlsx`);
    
    message.success('Arquivo Excel exportado com sucesso!');
  };

  const exportToExcelDescontos = () => {
    const empTransactions = dataSource.filter(item => item.forma_pagamento === 'Desconto em Folha');

    if (empTransactions.length === 0) {
      message.warning('Não há transações de funcionários para exportar.');
      return;
    }

    // Monta o cronograma de parcelas
    const installments = [];

    empTransactions.forEach(item => {
      const parts = item.data.split('/');
      const purchaseDate = new Date(parts[2], parts[1] - 1, parts[0]);
      const numParcelas = parseInt(item.parcelas) || 1;
      const valorParcela = parseFloat(item.valor_compra) / numParcelas;

      for (let i = 1; i <= numParcelas; i++) {
        const deductionDate = new Date(purchaseDate);
        deductionDate.setMonth(deductionDate.getMonth() + i);
        const month = String(deductionDate.getMonth() + 1).padStart(2, '0');
        const year = deductionDate.getFullYear();
        const monthYear = `${month}/${year}`;

        installments.push({
          nome: item.nome,
          data_compra: item.data,
          valor_total: parseFloat(item.valor_compra),
          num_parcelas: numParcelas,
          parcela: i,
          valor_parcela: valorParcela,
          mes_desconto: monthYear,
          forma_pagamento: item.forma_pagamento,
        });
      }
    });

    installments.sort((a, b) => {
      if (a.nome !== b.nome) return a.nome.localeCompare(b.nome);
      const [mA, yA] = a.mes_desconto.split('/');
      const [mB, yB] = b.mes_desconto.split('/');
      return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    // Monta resumo pivot: funcionário × mês
    const summary = {};
    const allMonths = new Set();

    installments.forEach(inst => {
      allMonths.add(inst.mes_desconto);
      if (!summary[inst.nome]) summary[inst.nome] = {};
      if (!summary[inst.nome][inst.mes_desconto]) summary[inst.nome][inst.mes_desconto] = 0;
      summary[inst.nome][inst.mes_desconto] += inst.valor_parcela;
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const [mA, yA] = a.split('/');
      const [mB, yB] = b.split('/');
      return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    const summaryRows = Object.keys(summary).sort().map(nome => {
      const row = { 'Funcionário': nome };
      let total = 0;
      sortedMonths.forEach(month => {
        const val = summary[nome][month] ? parseFloat(summary[nome][month].toFixed(2)) : 0;
        row[month] = val;
        total += val;
      });
      row['Total'] = parseFloat(total.toFixed(2));
      return row;
    });

    // Linha de totais por mês
    const totalsRow = { 'Funcionário': 'TOTAL' };
    let grandTotal = 0;
    sortedMonths.forEach(month => {
      const val = parseFloat(
        summaryRows.reduce((sum, r) => sum + (r[month] || 0), 0).toFixed(2)
      );
      totalsRow[month] = val;
      grandTotal += val;
    });
    totalsRow['Total'] = parseFloat(grandTotal.toFixed(2));
    summaryRows.push(totalsRow);

    // Linhas de detalhamento
    const detailRows = installments.map(inst => ({
      'Funcionário': inst.nome,
      'Data Compra': inst.data_compra,
      'Valor Total (R$)': inst.valor_total,
      'Parcelas': inst.num_parcelas,
      'Nº Parcela': inst.parcela,
      'Valor Parcela (R$)': parseFloat(inst.valor_parcela.toFixed(2)),
      'Mês de Desconto': inst.mes_desconto,
      'Forma de Pagamento': inst.forma_pagamento,
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { width: 35 },
      ...sortedMonths.map(() => ({ width: 12 })),
      { width: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo por Mês');

    const wsDetail = XLSX.utils.json_to_sheet(detailRows);
    wsDetail['!cols'] = [
      { width: 35 },
      { width: 12 },
      { width: 16 },
      { width: 10 },
      { width: 12 },
      { width: 16 },
      { width: 15 },
      { width: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhamento');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    const fileName = `descontos_funcionarios_${new Date().toISOString().split('T')[0]}`;
    FileSaver.saveAs(fileData, `${fileName}.xlsx`);

    message.success('Planilha de descontos exportada com sucesso!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
  
    doc.setFontSize(18);
    doc.text('Relatório de Transações', 14, 22);
  
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  
    let filtersText = 'Filtros aplicados: ';
    if (dateRange && dateRange.length === 2) {
      filtersText += `Período: ${dateRange[0].format('DD/MM/YYYY')} a ${dateRange[1].format('DD/MM/YYYY')}; `;
    }
    if (tipoFiltro) {
      filtersText += `Tipo: ${tipoFiltro}; `;
    }
    if (formaPagamentoFiltro) {
      filtersText += `Forma de Pagamento: ${formaPagamentoFiltro}; `;
    }
  
    if (filtersText !== 'Filtros aplicados: ') {
      doc.setFontSize(8);
      doc.text(filtersText, 14, 35);
    }
  
    // 👉 Calcular totais
    const totalTransacoes = filteredData.length;
    const totalPecas = filteredData.reduce((sum, item) => sum + parseInt(item.total_pecas || 0), 0);
    const totalValor = filteredData.reduce((sum, item) => sum + parseFloat(item.valor_compra || 0), 0);
    const totalVouchers = filteredData.reduce((sum, item) => sum + parseFloat(item.voucher_valor || 0), 0);

    // 👉 Mostrar totais no topo
    doc.setFontSize(10);
    doc.text(`Total de Transações: ${totalTransacoes}`, 14, 42);
    doc.text(`Total de Peças: ${totalPecas}`, 80, 42);
    doc.text(`Total em Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}`, 140, 42);
    doc.text(`Total em Vouchers: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVouchers)}`, 220, 42);
  
    // 👉 Avançar um pouco a linha para a tabela
    const startY = 50;
  
    // 👉 Preparar dados para a tabela
    const tableData = filteredData.map(item => [
      item.id,
      item.nome.substring(0, 20) + (item.nome.length > 20 ? '...' : ''),
      item.total_pecas,
      item.forma_pagamento,
      item.tipo === 'funcionario' ? 'Func.' : 'Ext.',
      item.local_venda || 'Loja Física',
      formatCurrency(item.valor_compra),
      item.voucher_valor ? formatCurrency(item.voucher_valor) : '-',
      item.data,
      item.usuario
    ]);

    const tableColumns = [
      'ID',
      'Nome',
      'Peças',
      'Pagamento',
      'Tipo',
      'Local',
      'Valor',
      'Voucher',
      'Data',
      'Usuário'
    ];
  
    // 👉 Criar a tabela
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: startY,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10 },  // ID
        1: { cellWidth: 35 },  // Nome
        2: { cellWidth: 10 },  // Peças
        3: { cellWidth: 20 },  // Pagamento
        4: { cellWidth: 10 },  // Tipo
        5: { cellWidth: 22 },  // Local
        6: { cellWidth: 22 },  // Valor
        7: { cellWidth: 18 },  // Voucher
        8: { cellWidth: 16 },  // Data
        9: { cellWidth: 22 }   // Usuário
      }
    });
  
    const fileName = `transacoes_${new Date().toISOString().split('T')[0]}`;
    doc.save(`${fileName}.pdf`);
  
    message.success('Arquivo PDF exportado com sucesso!');
  };
  
  

  // Função de tratamento de mudanças na tabela
  const handleTableChange = (pagination, filters, sorter, extra) => {
    if (extra.action === 'filter') {
      setFilteredData(extra.currentDataSource);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>Transações</Title>
      
      {/* Card de filtros */}
      <Card 
        title={<Space><FaFilter /> Filtros</Space>} 
        style={{ marginBottom: 20 }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Período:</label>
              <RangePicker 
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Nome ou CPF do Cliente:</label>
              <Input 
                placeholder="Buscar por nome ou CPF"
                value={nomeFiltro}
                onChange={(e) => setNomeFiltro(e.target.value)}
                allowClear
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Tipo:</label>
              <Select 
                style={{ width: '100%' }}
                value={tipoFiltro}
                onChange={(value) => setTipoFiltro(value)}
                allowClear
                placeholder="Selecione o tipo"
              >
                <Option value="funcionario">Funcionário</Option>
                <Option value="externo">Externo</Option>
                <Option value="externo promo">Externo Promo</Option>
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Forma de Pagamento:</label>
              <Select 
                style={{ width: '100%' }}
                value={formaPagamentoFiltro}
                onChange={(value) => setFormaPagamentoFiltro(value)}
                allowClear
                placeholder="Selecione a forma de pagamento"
              >
                <Option value="Debito">Débito</Option>
                <Option value="Credito">Crédito</Option>
                <Option value="Dinheiro">Dinheiro</Option>
                <Option value="Pix">Pix</Option>
                <Option value="Desconto em Folha">Desconto em Folha</Option>
              </Select>
            </div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 10 }}>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Local de Venda:</label>
              <Select 
                style={{ width: '100%' }}
                value={localVendaFiltro}
                onChange={(value) => setLocalVendaFiltro(value)}
                allowClear
                placeholder="Selecione o local"
              >
                <Option value="Loja Física">Loja Física</Option>
                <Option value="Unidade Móvel">Unidade Móvel</Option>
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Deduções / Benefícios:</label>
              <Select 
                style={{ width: '100%' }}
                value={beneficioFiltro}
                onChange={(value) => setBeneficioFiltro(value)}
                allowClear
                placeholder="Filtrar por benefício"
              >
                <Option value="qualquer">Qualquer benefício/desconto</Option>
                <Option value="voucher">Uso de Voucher</Option>
                <Option value="cartao_presente">Uso de Cartão Presente</Option>
                <Option value="cashback">Uso de Cashback</Option>
                <Option value="desconto_1_compra">Desconto 1ª Compra (10%)</Option>
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>Operador (Usuário):</label>
              <Input 
                placeholder="Buscar por operador"
                value={usuarioFiltro}
                onChange={(e) => setUsuarioFiltro(e.target.value)}
                allowClear
              />
            </div>
          </Col>
          <Col span={6}></Col>
        </Row>
        <Row style={{ marginTop: 15 }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<FaSync />} onClick={handleResetFilters}>
                Limpar Filtros
              </Button>
              <Button type="primary" icon={<FaSearch />} onClick={handleApplyFilters}>
                Aplicar Filtros
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Card da tabela de dados */}
      <Card>
        <Row style={{ marginBottom: 16 }} justify="end">
          <Col>
            <Space>
              <Button 
                icon={<FaFileExcel />} 
                onClick={exportToExcel}
                style={{ backgroundColor: '#52c41a', color: 'white' }}
              >
                Exportar Excel
              </Button>
              <Button
                icon={<FaFilePdf />}
                onClick={exportToPDF}
                style={{ backgroundColor: '#f5222d', color: 'white' }}
              >
                Exportar PDF
              </Button>
              <Button
                icon={<FaFileExcel />}
                onClick={exportToExcelDescontos}
                style={{ backgroundColor: '#1890ff', color: 'white' }}
              >
                Descontos Funcionários
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={dataSource}
          columns={columns}
          onChange={handleTableChange}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total: ${total} transações`
          }}
          scroll={{ x: 1300, y: 500 }}
          size='small'
          loading={loading}
          summary={(pageData) => {
            const totalValue = pageData.reduce((sum, item) => sum + parseFloat(item.valor_compra), 0);
            const totalItems = pageData.reduce((sum, item) => sum + parseInt(item.total_pecas), 0);
            
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>Total na página:</Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>{totalItems}</Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={4}></Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>{formatCurrency(totalValue)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={5}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default Transacoes;
