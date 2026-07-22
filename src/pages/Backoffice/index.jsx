import React, { useContext, useEffect, useState } from 'react';
import { Button, Drawer, Input, message, Modal, Popconfirm, Space, Table, Tooltip, Typography } from 'antd';
import { FaTrash, FaEdit, FaFileExcel, FaFileImport, FaSearch, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import AddFunc from '../../components/AddFunc';
import ImportarLimites from '../../components/ImportarLimites';
import { MyContext } from '../../contexts/MyContext';

const { Title } = Typography;

const formatCurrency = (value) => {
    const parsedValue = parseFloat(value || 0);
    return parsedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Backoffice = () => {
    const { rootState } = useContext(MyContext);
    const { theUser } = rootState;
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalEditVisible, setModalEditVisible] = useState(false);
    const [modalAddVisible, setModalAddVisible] = useState(false);
    const [drawerImportVisible, setDrawerImportVisible] = useState(false);
    const [funcionarioAtual, setFuncionarioAtual] = useState(null);
    const [email, setEmail] = useState('');
    const [limiteTotal, setLimiteTotal] = useState('');
    const [limiteDisponivel, setLimiteDisponivel] = useState('');
    const [limiteValorParcela, setLimiteValorParcela] = useState('');
    const [searchText, setSearchText] = useState('');
    const [deletingNome, setDeletingNome] = useState(null);

    const carregarFuncionarios = () => {
        setLoading(true);
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/busca_funcionarios.php`)
            .then((res) => {
                setFuncionarios(res.data.map((func) => ({
                    ...func,
                    key: func.id || func.nome
                })));
            })
            .catch((err) => {
                console.log(err);
                message.error('Erro ao carregar os funcionários');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        carregarFuncionarios();
    }, []);

    const consultarLimites = (nome) => {
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/consulta_limites.php`, { nome_funcionario: nome })
            .then((res) => {
                if (res.data) {
                    setEmail(res.data.email ?? '');
                    setLimiteTotal(res.data.limite_total);
                    setLimiteDisponivel(res.data.limite_disponivel);
                    setLimiteValorParcela(res.data.limite_valor_parcela ?? '');
                }
            })
            .catch((err) => {
                console.log("Erro: ", err);
            });
    };

    const handleEdit = (funcionario) => {
        setFuncionarioAtual(funcionario);
        consultarLimites(funcionario.nome);
        setModalEditVisible(true);
    };

    const handleSaveEdit = () => {
        const dados = {
            nome: funcionarioAtual.nome,
            user: theUser.nome,
            new_email: email,
            limite_disponivel: funcionarioAtual.limite_disponivel,
            limite_total: funcionarioAtual.limite_total,
            new_limite_disponivel: limiteDisponivel,
            new_limite_total: limiteTotal,
            new_limite_valor_parcela: limiteValorParcela
        };

        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/ajuste_limites.php`, dados)
            .then((res) => {
                if (res.data.status === 'success') {
                    message.success('Limite ajustado com sucesso.');
                    setModalEditVisible(false);
                    carregarFuncionarios();
                } else {
                    message.error(res.data.message || 'Erro ao ajustar o limite');
                }
            })
            .catch((err) => {
                console.log("Erro: ", err);
                message.error('Erro ao ajustar o limite');
            });
    };

    const handleDelete = (funcionario) => {
        setDeletingNome(funcionario.nome);

        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/deletar_funcionario.php`, {
            id: funcionario.id,
            nome: funcionario.nome,
            user: theUser.nome
        })
            .then((res) => {
                if (res.data.status === 'success') {
                    message.success('Funcionário removido com sucesso.');
                    carregarFuncionarios();
                } else {
                    message.error(res.data.message || 'Erro ao remover funcionário.');
                }
            })
            .catch((err) => {
                console.log("Erro: ", err);
                message.error('Erro ao remover funcionário.');
            })
            .finally(() => {
                setDeletingNome(null);
            });
    };

    const handleAddSuccess = () => {
        setModalAddVisible(false);
        carregarFuncionarios();
    };

    const handleImportSuccess = () => {
        setDrawerImportVisible(false);
        carregarFuncionarios();
        message.success('Importação concluída com sucesso');
    };

    const filteredFuncionarios = funcionarios.filter((func) =>
        func.nome && func.nome.toLowerCase().includes(searchText.toLowerCase())
    );

    const exportToExcel = () => {
        const exportData = filteredFuncionarios.map((func) => ({
            'Nome': func.nome || '',
            'E-mail': func.email || '',
            'Salário': parseFloat(func.salario || 0),
            'Limite Total': parseFloat(func.limite_total || 0),
            'Limite Disponível': parseFloat(func.limite_disponivel || 0),
            'Limite Parcela': parseFloat(func.limite_valor_parcela || 0),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const fileName = `funcionarios_limites_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
        FileSaver.saveAs(fileData, `${fileName}.xlsx`);
        message.success('Arquivo Excel exportado com sucesso!');
    };

    const columns = [
        {
            title: 'Nome',
            dataIndex: 'nome',
            key: 'nome',
            sorter: (a, b) => a.nome.localeCompare(b.nome),
        },
        {
            title: 'E-mail',
            dataIndex: 'email',
            key: 'email',
            render: (value) => value || '-',
        },
        {
            title: 'Salário',
            dataIndex: 'salario',
            key: 'salario',
            render: formatCurrency,
            sorter: (a, b) => parseFloat(a.salario) - parseFloat(b.salario),
        },
        {
            title: 'Limite Total',
            dataIndex: 'limite_total',
            key: 'limite_total',
            render: formatCurrency,
            sorter: (a, b) => parseFloat(a.limite_total) - parseFloat(b.limite_total),
        },
        {
            title: 'Limite Disponível',
            dataIndex: 'limite_disponivel',
            key: 'limite_disponivel',
            render: formatCurrency,
            sorter: (a, b) => parseFloat(a.limite_disponivel) - parseFloat(b.limite_disponivel),
        },
        {
            title: 'Limite Parcela',
            dataIndex: 'limite_valor_parcela',
            key: 'limite_valor_parcela',
            render: (value) => value ? formatCurrency(value) : '-',
            sorter: (a, b) => parseFloat(a.limite_valor_parcela || 0) - parseFloat(b.limite_valor_parcela || 0),
        },
        {
            title: 'Ações',
            key: 'acoes',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<FaEdit />}
                        onClick={() => handleEdit(record)}
                    >
                        Editar
                    </Button>
                    <Popconfirm
                        title="Remover funcionário"
                        description={`Tem certeza que deseja remover ${record.nome}?`}
                        okText="Remover"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true, loading: deletingNome === record.nome }}
                        onConfirm={() => handleDelete(record)}
                    >
                        <Button
                            danger
                            icon={<FaTrash />}
                            loading={deletingNome === record.nome}
                        >
                            Remover
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={2}>Gerenciamento de Funcionários e Limites</Title>
                <Space>
                    <Tooltip title="Adicionar Funcionário">
                        <Button
                            type="primary"
                            icon={<FaUserPlus />}
                            onClick={() => setModalAddVisible(true)}
                        >
                            Adicionar
                        </Button>
                    </Tooltip>
                    <Tooltip title="Exportar Excel">
                        <Button
                            icon={<FaFileExcel />}
                            onClick={exportToExcel}
                        >
                            Exportar Excel
                        </Button>
                    </Tooltip>
                    <Tooltip title="Importar Limites">
                        <Button
                            icon={<FaFileImport />}
                            onClick={() => setDrawerImportVisible(true)}
                        >
                            Importar
                        </Button>
                    </Tooltip>
                </Space>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <Input
                    placeholder="Buscar funcionário pelo nome..."
                    prefix={<FaSearch />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                />
            </div>

            <Table
                columns={columns}
                dataSource={filteredFuncionarios}
                loading={loading}
                rowKey="key"
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={`Editar Limites - ${funcionarioAtual?.nome}`}
                open={modalEditVisible}
                onOk={handleSaveEdit}
                onCancel={() => setModalEditVisible(false)}
                okText="Salvar"
                cancelText="Cancelar"
            >
                <div style={{ marginBottom: '16px' }}>
                    <Typography.Text>Salário: </Typography.Text>
                    <Typography.Text strong>
                        {funcionarioAtual?.salario ? formatCurrency(funcionarioAtual.salario) : ''}
                    </Typography.Text>
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <Typography.Text>E-mail:</Typography.Text>
                    <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        type="email"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <Typography.Text>Limite Total:</Typography.Text>
                    <Input
                        value={limiteTotal}
                        onChange={(e) => setLimiteTotal(e.target.value)}
                        placeholder="Limite Total"
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <Typography.Text>Limite Disponível:</Typography.Text>
                    <Input
                        value={limiteDisponivel}
                        onChange={(e) => setLimiteDisponivel(e.target.value)}
                        placeholder="Limite Disponível"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <Typography.Text>Limite de Valor de Parcela:</Typography.Text>
                    <Input
                        value={limiteValorParcela}
                        onChange={(e) => setLimiteValorParcela(e.target.value)}
                        placeholder="Deixe vazio para sem limite"
                        style={{ width: '100%' }}
                    />
                </div>
            </Modal>

            <Modal
                title="Adicionar Funcionário"
                open={modalAddVisible}
                onCancel={() => setModalAddVisible(false)}
                footer={null}
                width={800}
            >
                <AddFunc onSuccess={handleAddSuccess} />
            </Modal>

            <Drawer
                title="Importar Limites"
                placement="right"
                width={800}
                onClose={() => setDrawerImportVisible(false)}
                open={drawerImportVisible}
            >
                <ImportarLimites onSuccess={handleImportSuccess} />
            </Drawer>
        </div>
    );
};

export default Backoffice;
