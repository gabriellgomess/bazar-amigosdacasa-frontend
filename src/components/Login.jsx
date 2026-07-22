import React, { useContext, useState } from "react";
import { Form, Input, Button, Card, message, Select } from "antd";
import { MyContext } from "../contexts/MyContext";
import LogoBazarVertical from "../assets/logotipos_bazar/ADC_bazar_logotipo-06.png";
import LogoCasaHorizontal from "../assets/logos_casa/logo_horizontal_color.png";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons';

import './StyleComponents.css';

function Login() {
  const { loginUser, isLoggedIn } = useContext(MyContext);

  const initialState = {
    userInfo: {
      usuario: "",
      senha: "",
    },
    errorMsg: "",
    successMsg: "",
  };

  const [state, setState] = useState(initialState);
  const [localVenda, setLocalVenda] = useState("Loja Física");
  const [loading, setLoading] = useState(false);

  const onChangeValue = (e) => {
    setState({
      ...state,
      userInfo: {
        ...state.userInfo,
        [e.target.name]: e.target.value,
      },
    });
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const data = await loginUser(state.userInfo);
      if (data.success && data.token) {
        setState({
          ...initialState,
        });
        sessionStorage.setItem("loginToken", data.token);
        sessionStorage.setItem("localVenda", localVenda);
        await isLoggedIn();
        message.success("Login realizado com sucesso!");
      } else {
        setState({
          ...state,
          successMsg: "",
          errorMsg: data.message || "Erro ao fazer login.",
        });
        message.error(data.message || "Usuário ou senha inválidos.");
      }
    } catch (err) {
      setState({
        ...state,
        errorMsg: "Erro de conexão com o servidor.",
      });
      message.error("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  let errorMsg = "";
  if (state.errorMsg) {
    errorMsg = (
      <div className="ant-form-explain error-msg" style={{ color: '#ff4d4f', marginBottom: '15px', textAlign: 'center' }}>
        {state.errorMsg}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '380px' }}>
        <img 
          src={LogoBazarVertical} 
          alt="Bazar Amigos da Casa Logo" 
          className="responsive-image" 
          style={{ width: '100%', maxHeight: '350px', objectFit: 'contain' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Card
          bordered={true}
          style={{
            width: 360,
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f0f0f0'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>Acesso ao Sistema</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Bazar Amigos da Casa</p>
          </div>

          <Form onFinish={submitForm} layout="vertical" requiredMark={false}>
            <Form.Item 
              label="E-mail" 
              name="usuario"
              rules={[{ required: true, message: 'Por favor, insira seu e-mail!' }]}
            >
              <Input
                name="usuario"
                type="email"
                placeholder="exemplo@email.com"
                value={state.userInfo.usuario}
                onChange={onChangeValue}
                style={{ height: '40px', borderRadius: '8px' }}
              />
            </Form.Item>
            <Form.Item 
              label="Senha" 
              name="senha"
              rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
            >
              <Input.Password 
                name="senha" 
                placeholder="Sua senha"
                value={state.userInfo.senha} 
                onChange={onChangeValue} 
                style={{ height: '40px', borderRadius: '8px' }}
              />
            </Form.Item>
            <Form.Item 
              label="Local de Venda" 
              name="local_venda"
              initialValue="Loja Física"
              rules={[{ required: true, message: 'Por favor, selecione o local de venda!' }]}
            >
              <Select 
                value={localVenda} 
                onChange={(value) => setLocalVenda(value)}
                style={{ height: '40px', borderRadius: '8px' }}
              >
                <Select.Option value="Loja Física">Loja Física</Select.Option>
                <Select.Option value="Unidade Móvel">Unidade Móvel</Select.Option>
              </Select>
            </Form.Item>

            {errorMsg}

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '100%',
                  height: '42px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Entrar <FontAwesomeIcon icon={faRightToBracket} />
              </Button>
            </div>
          </Form>

          {/* Apoio Institucional */}
          <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Uma iniciativa de
            </span>
            <img 
              src={LogoCasaHorizontal} 
              alt="Casa de Saúde Menino Jesus de Praga" 
              style={{ height: '34px', objectFit: 'contain' }} 
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Login;
