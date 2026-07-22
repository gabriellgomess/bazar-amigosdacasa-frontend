import { FaSearch } from 'react-icons/fa';
import React, { useRef, useState, useEffect } from 'react';
import Highlighter from 'react-highlight-words';
import { Button, Input, Space, Table, Modal, Form, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faRotateRight, faTrash, faPenToSquare, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { set } from 'react-hook-form';

const Estoque = (props) => {
    const { theme } = props;
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [data, setData] = useState([]);
    const searchInput = useRef(null);
    const { Option } = Select;
    const [update, setUpdate] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingPiece, setEditingPiece] = useState(null);
    const [formValues, setFormValues] = useState({
        descricao: '',
        tag: '',
        tipo: '',
        valor_sugerido: '',
        desc_func_10: '',
        codigo: ''
    });



    const [newCode, setNewCode] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tag, setTag] = useState('');
    const [tipo, setTipo] = useState('');
    const [valor_sugerido, setValor_sugerido] = useState('');
    const [valor_desconto, setValor_desconto] = useState('0');

    useEffect(() => {
        if (editingPiece) {
            setFormValues({
                descricao: editingPiece.descricao,
                tag: editingPiece.tag,
                tipo: editingPiece.tipo,
                valor_sugerido: editingPiece.valor_sugerido,
                desc_func_10: editingPiece.desc_func_10,// Presumi que você tem um campo assim
                codigo: editingPiece.codigo,
            });
        }
    }, [editingPiece]);

    const handleValueChange = (changedValues) => {
        setFormValues({ ...formValues, ...changedValues });
    };

    const showEditModal = (record) => {
        setIsEditModalVisible(true);
        setEditingPiece(record);
    };

    const showModal = () => {
        setIsModalVisible(true);
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/buscar_codigo.php`)
            .then((res) => {
                setNewCode(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleOk = () => {

        const dados = {
            codigo: newCode,
            descricao: descricao,
            tag: tag,
            tipo: tipo,
            valor_sugerido: valor_sugerido,
            valor_desconto: valor_sugerido * 0.9,
        }

        // Enviar dados do formulário para o banco de dados
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/add_estoque.php`, dados)
            .then((res) => {
                setIsModalVisible(false);
                setNewCode('');
                setUpdate(!update);
            })
            .catch((err) => {
                console.log(err);
            });
        setNewCode('');

    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setNewCode('');
    };

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };
    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };

    useEffect(() => {
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/get_all_peca_details.php`)
            .then((res) => {
                setData(res.data.pecas);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [update]);

    const handleEditOk = (record) => {
        // Implement your edit logic here using the record data
        console.log("Edit clicked for record:", record);
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/edit_estoque.php`, record)
            .then((res) => {
                setIsEditModalVisible(false);
                setUpdate(!update);
                console.log(res.data);
            })
            .catch((err) => {
                console.log(err);
            });

    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
    };

    const handleDelete = (record) => {
        // Implement your delete logic here using the record data
        console.log("Delete clicked for record:", record);
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/delete_estoque.php`, record)
            .then((res) => {
                setUpdate(!update);
                console.log(res.data);
            })
            .catch((err) => {
                console.log(err);
            });

    };



    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div
                style={{
                    padding: 8,
                }}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<FaSearch />}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({
                                closeDropdown: false,
                            });
                            setSearchText(selectedKeys[0]);
                            setSearchedColumn(dataIndex);
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            close();
                        }}
                    >
                        close
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <FaSearch
                style={{
                    color: filtered ? '#1677ff' : undefined,
                }}
            />
        ),
        onFilter: (value, record) =>
            record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{
                        backgroundColor: '#ffc069',
                        padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });
    const columns = [
        {
            title: 'Código',
            dataIndex: 'codigo',
            key: 'codigo',
            width: '15%',
            ...getColumnSearchProps('codigo'),
        },
        {
            title: 'Descrição',
            dataIndex: 'descricao',
            key: 'descricao',
            width: '30%',
            ...getColumnSearchProps('descricao'),
        },
        {
            title: 'TAG',
            dataIndex: 'tag',
            key: 'tag',
            width: '20%',
            ...getColumnSearchProps('tag'),
        },
        {
            title: 'Tipo',
            dataIndex: 'tipo',
            key: 'tipo',
            width: '20%',
            ...getColumnSearchProps('tipo'),
        },
        {
            title: 'Valor',
            dataIndex: 'valor_sugerido',
            key: 'valor_sugerido',
            width: '20%',
            ...getColumnSearchProps('valor_sugerido'),
        },
        {
            title: 'Ações',
            dataIndex: 'actions',
            key: 'actions',
            width: '20%',
            render: (text, record) => (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button style={{ color: theme.token.colorPrimary, background: theme.token.colorInfo, border: 'transparent' }} icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => showEditModal(record)} />
                    <Button danger icon={<FontAwesomeIcon icon={faTrash} />} onClick={() => handleDelete(record)} />
                </div>
            ),
        },
    ];


    // const getCode = () => {
    //     axios.post('${import.meta.env.VITE_REACT_APP_URL}/api/buscar_codigo.php')
    //         .then((res) => {
    //             console.log(res.data);
    //             setNewCode(res.data);
    //         })
    //         .catch((err) => {
    //             console.log(err);
    //         });
    // }

 

    return (
        <div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                {/* link download pdf */}
                <Button ghost style={{ borderColor: theme.token.colorPDF, color: theme.token.colorPDF }} icon={<FontAwesomeIcon icon={faFilePdf}/>}  href={`${import.meta.env.VITE_REACT_APP_URL}/pdf_estoque.php`} target='_blank' >
                    Imprimir estoque
                </Button>
                <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={showModal}>
                    Adicionar peça
                </Button>
            </div>
            <Table scroll={{y: 350 }} columns={columns} dataSource={data} size="small" />

            <Modal title="Adicionar peça" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel} style={{top: 20}}>
                <Form layout="vertical">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Form.Item label="Código" style={{ width: '150px' }}>
                            <Input value={newCode} readOnly />
                        </Form.Item>
                        {/* <Button type="primary" icon={<FontAwesomeIcon icon={faRotateRight} />} onClick={getCode} ghost>
                            Gerar Código
                        </Button> */}
                    </div>
                    <Form.Item label="Descrição">
                        <Input onChange={(e) => setDescricao(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Tag">
                        <Input onChange={(e) => setTag(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Tipo">
                        <Select onChange={(e) => setTipo(e)}>
                            <Option value="masculino">Masculino</Option>
                            <Option value="feminino">Feminino</Option>
                            <Option value="unissex">Unissex</Option>
                        </Select>
                    </Form.Item>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Form.Item style={{ flexGrow: '1' }} label="Valor sugerido">
                            <Input onChange={(e) => setValor_sugerido(e.target.value)} />
                        </Form.Item>
                        <Form.Item style={{ flexGrow: '1' }} label="Valor com desconto">
                            <Input style={{ background: 'lightgrey' }} readOnly value={valor_sugerido * 0.9} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
            {/* *************************edição********************** */}
            <Modal
                title="Editar peça"
                visible={isEditModalVisible}
                onOk={() => handleEditOk(formValues)}
                onCancel={handleEditCancel}
                style={{top: 20}}
            >
                <Form layout="vertical">
                    {/* Código - Apenas leitura */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Form.Item label="Código" style={{ width: '150px' }}>
                            <Input value={editingPiece ? editingPiece.codigo : ''} readOnly />
                        </Form.Item>
                    </div>

                    {/* Descrição */}
                    <Form.Item label="Descrição">
                        <Input
                            value={formValues.descricao}
                            onChange={(e) => handleValueChange({ descricao: e.target.value })}
                        />
                    </Form.Item>

                    {/* Tag */}
                    <Form.Item label="Tag">
                        <Input
                            value={formValues.tag}
                            onChange={(e) => handleValueChange({ tag: e.target.value })}
                        />
                    </Form.Item>

                    {/* Tipo */}
                    <Form.Item label="Tipo">
                        <Select
                            value={formValues.tipo}
                            onChange={(value) => handleValueChange({ tipo: value })}
                        >
                            <Option value="masculino">Masculino</Option>
                            <Option value="feminino">Feminino</Option>
                            <Option value="unissex">Unissex</Option>
                        </Select>
                    </Form.Item>

                    {/* Valor Sugerido e Valor com Desconto */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Form.Item label="Valor sugerido" style={{ flexGrow: '1' }}>
                            <Input
                                value={formValues.valor_sugerido}
                                onChange={(e) => handleValueChange({ valor_sugerido: e.target.value })}
                            />
                        </Form.Item>
                        <Form.Item label="Valor com desconto" style={{ flexGrow: '1' }}>
                            <Input
                                style={{ background: 'lightgrey' }}
                                value={(formValues.valor_sugerido * 0.9).toFixed(2)}// Se este campo é calculado automaticamente, então deve ser apenas para leitura
                            />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>



    );
};
export default Estoque;