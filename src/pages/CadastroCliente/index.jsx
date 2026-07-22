import React, { useState } from 'react';
import { Card, Input, Button, Form, Alert, Typography } from 'antd';
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import LogoBazarVertical from "../../assets/logotipos_bazar/ADC_bazar_logotipo-06.png";
import LogoCasaHorizontal from "../../assets/logos_casa/logo_horizontal_color.png";

const { Title, Text } = Typography;

const CadastroCliente = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Máscara básica para CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  // Máscara básica para Telefone
  const formatTelefone = (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 14);
    }
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const onCPFChange = (e) => {
    form.setFieldsValue({ cpf: formatCPF(e.target.value) });
  };

  const onTelefoneChange = (e) => {
    form.setFieldsValue({ telefone: formatTelefone(e.target.value) });
  };

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_APP_URL}/registrar_comprador`, {
        nome_completo: values.nome_completo,
        cpf: values.cpf,
        telefone: values.telefone,
        email: values.email,
        endereco: values.endereco,
      });

      if (response.data && response.data.success) {
        setSuccess(true);
      } else {
        setErrorMsg(response.data?.message || 'Erro ao realizar o cadastro. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro de cadastro:', error);
      setErrorMsg(error.response?.data?.message || 'Não foi possível completar o cadastro. Por favor, verifique os campos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card 
        className="w-full max-w-lg shadow-xl border-t-4 border-teal-600 rounded-xl"
        style={{ padding: '8px' }}
      >
        <div className="flex flex-col items-center mb-6">
          <img src={LogoBazarVertical} alt="Logo Bazar Amigos da Casa" className="h-28 object-contain mb-4" />
          <Title level={3} className="text-teal-800 text-center m-0">Cadastro do Comprador</Title>
          <Text className="text-slate-500 text-center mt-2 block">
            Cadastre-se agora e ganhe <strong>10% de desconto na primeira compra</strong>!
          </Text>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <FaCheckCircle className="text-teal-600 text-6xl mb-4" />
            <Title level={4} className="text-teal-800">Cadastro Realizado com Sucesso!</Title>
            <Text className="text-slate-600 text-base max-w-sm">
              Seu desconto de <strong>10%</strong> está ativado! Basta informar o seu CPF ao operador do caixa na hora de finalizar suas compras.
            </Text>
            <Button 
              type="primary" 
              className="mt-6 bg-teal-600 hover:bg-teal-700 h-11 px-8 rounded-lg"
              onClick={() => {
                setSuccess(false);
                form.resetFields();
              }}
            >
              Realizar Novo Cadastro
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            requiredMark={false}
          >
            {errorMsg && (
              <Alert 
                message={errorMsg} 
                type="error" 
                showIcon 
                closable 
                className="mb-4"
                onClose={() => setErrorMsg(null)}
              />
            )}

            <Form.Item
              name="nome_completo"
              label="Nome Completo"
              rules={[
                { required: true, message: 'Por favor, digite seu nome completo.' },
                { min: 3, message: 'Nome muito curto.' }
              ]}
            >
              <Input 
                prefix={<FaUser className="text-slate-400 mr-2" />} 
                placeholder="Ex: João da Silva" 
                className="h-11 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="cpf"
              label="CPF"
              rules={[
                { required: true, message: 'Por favor, informe seu CPF.' },
                { len: 14, message: 'O CPF deve ter 11 dígitos.' }
              ]}
            >
              <Input 
                prefix={<FaIdCard className="text-slate-400 mr-2" />} 
                placeholder="000.000.000-00" 
                onChange={onCPFChange}
                className="h-11 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="telefone"
              label="Telefone / Celular"
              rules={[{ required: true, message: 'Por favor, informe seu telefone.' }]}
            >
              <Input 
                prefix={<FaPhone className="text-slate-400 mr-2" />} 
                placeholder="(00) 00000-0000" 
                onChange={onTelefoneChange}
                className="h-11 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: 'Por favor, informe seu e-mail.' },
                { type: 'email', message: 'E-mail inválido.' }
              ]}
            >
              <Input 
                prefix={<FaEnvelope className="text-slate-400 mr-2" />} 
                placeholder="seuemail@exemplo.com" 
                className="h-11 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="endereco"
              label="Endereço (Opcional)"
            >
              <Input 
                prefix={<FaMapMarkerAlt className="text-slate-400 mr-2" />} 
                placeholder="Rua, Número, Bairro, Cidade" 
                className="h-11 rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 h-11 text-base font-semibold rounded-lg mt-4"
              >
                Cadastrar e Obter Desconto
              </Button>
            </Form.Item>
          </Form>
        )}

        <div className="flex flex-col items-center mt-6 pt-6 border-t border-slate-100 text-center">
          <Text className="text-slate-400 text-xs mb-2">Realização</Text>
          <img src={LogoCasaHorizontal} alt="Logo Casa de Saúde" className="h-8 object-contain opacity-70" />
        </div>
      </Card>
    </div>
  );
};

export default CadastroCliente;
