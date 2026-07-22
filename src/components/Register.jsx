import React, { useContext, useState } from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import { MyContext } from "../contexts/MyContext";

function Register() {
  const { toggleNav, registerUser } = useContext(MyContext);

  // Atualizado para incluir todos os campos necessários
  const [userInfo, setUserInfo] = useState({
    nome: "",
    usuario: "", // Anteriormente email
    senha: "", // Anteriormente password
    matricula: "",
    nivel_acesso: "", // Adicione outros campos se necessário
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // On Submit the Registration Form
  const submitForm = async (values) => {
    const data = await registerUser(values);
    if (data.success) {
      setSuccessMsg(data.message);
      setErrorMsg('');
      // Limpar o formulário
      setUserInfo({
        nome: "",
        usuario: "",
        senha: "",
        matricula: "",
        nivel_acesso: "",
      });
    } else {
      setSuccessMsg('');
      setErrorMsg(data.message);
    }
  };

  return (
    <Card
      title="Cadastro de Usuário"
      bordered={false}
      style={{
        width: 350,
      }}
    >
      <Form onFinish={submitForm} layout="vertical">
        {/* Campos atualizados para incluir todos os campos necessários */}
        <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Por favor, insira seu nome!' }]}>
          <Input placeholder="Digite seu nome completo" />
        </Form.Item>
        <Form.Item label="Usuário (E-mail)" name="usuario" rules={[{ required: true, message: 'Por favor, insira seu usuário!' }]}>
          <Input placeholder="Digite seu e-mail" />
        </Form.Item>
        <Form.Item label="Senha" name="senha" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
          <Input.Password placeholder="Digite sua senha" />
        </Form.Item>
        <Form.Item label="Matricula" name="matricula" rules={[{ required: true, message: 'Por favor, insira a matrícula!' }]}>
          <Input placeholder="Digite a matrícula" />
        </Form.Item>
        <Form.Item label="Nível de acesso" name="nivel_acesso" rules={[{ required: true, message: 'Por favor, defina o nível de acesso!' }]}>
          <Input placeholder="Nível de acesso" />
        </Form.Item>
        {errorMsg && <Typography.Text type="danger">{errorMsg}</Typography.Text>}
        {successMsg && <Typography.Text type="success">{successMsg}</Typography.Text>}
        <Button type="primary" htmlType="submit">
          Cadastrar
        </Button>
      </Form>
      <Button onClick={toggleNav}>Entrar</Button>
    </Card>
  );
}

export default Register;
