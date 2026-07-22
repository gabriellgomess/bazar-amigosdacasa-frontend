import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, message, Modal, Form, Input, Select } from 'antd';
import { FaEdit } from 'react-icons/fa';

const Users = () => {
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = () => {
    axios.get(`${import.meta.env.VITE_REACT_APP_URL}/get_users.php`)
      .then(response => {
        if (response.data.status === 'success') {
          setData(response.data.data);
        } else {
          message.error(response.data.message);
        }
      })
      .catch(() => message.error('Erro ao carregar usuários.'));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      nome: record.nome,
      nivel_acesso: record.nivel_acesso,
      senha: '',
      senha_confirmacao: '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (values.senha && values.senha !== values.senha_confirmacao) {
        message.error('As senhas não coincidem.');
        return;
      }

      setLoading(true);
      const payload = {
        id: editingUser.id,
        nome: values.nome,
        nivel_acesso: values.nivel_acesso,
        senha: values.senha || '',
      };

      axios.post(`${import.meta.env.VITE_REACT_APP_URL}/update_user.php`, payload)
        .then(res => {
          if (res.data.status === 'success') {
            message.success('Usuário atualizado com sucesso.');
            setModalVisible(false);
            fetchUsers();
          } else {
            message.error(res.data.message || 'Erro ao atualizar usuário.');
          }
        })
        .catch(() => message.error('Erro ao conectar ao servidor.'))
        .finally(() => setLoading(false));
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: '5%' },
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Usuário', dataIndex: 'usuario', key: 'usuario' },
    { title: 'Matrícula', dataIndex: 'matricula', key: 'matricula' },
    { title: 'Nível de Acesso', dataIndex: 'nivel_acesso', key: 'nivel_acesso' },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FaEdit />}
          onClick={() => handleEdit(record)}
        >
          Editar
        </Button>
      ),
    },
  ];

  return (
    <>
      <Table columns={columns} dataSource={data} rowKey="id" />

      <Modal
        title={`Editar usuário — ${editingUser?.nome}`}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: 'Informe o nome.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="nivel_acesso"
            label="Nível de Acesso"
            rules={[{ required: true, message: 'Selecione o nível.' }]}
          >
            <Select>
              <Select.Option value="user">Usuário</Select.Option>
              <Select.Option value="gerencia">Gerência</Select.Option>
              <Select.Option value="diretoria">Diretoria</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="senha"
            label="Nova Senha"
            extra="Deixe em branco para não alterar a senha."
          >
            <Input.Password placeholder="Nova senha (opcional)" />
          </Form.Item>

          <Form.Item
            name="senha_confirmacao"
            label="Confirmar Nova Senha"
          >
            <Input.Password placeholder="Confirme a nova senha" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Users;
