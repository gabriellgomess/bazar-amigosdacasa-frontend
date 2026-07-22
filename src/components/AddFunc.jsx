import React, { useState, useContext } from 'react';
import { MyContext } from '../contexts/MyContext';
import { Input, Typography, Button, notification, Form } from 'antd';
import axios from 'axios';

const AddFunc = ({ onSuccess }) => {
    const { rootState } = useContext(MyContext);
    const { theUser } = rootState;
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [salario, setSalario] = useState('');
    const [limiteDisponivel, setLimiteDisponivel] = useState('');
    const [limiteValorParcela, setLimiteValorParcela] = useState('');
    const [loading, setLoading] = useState(false);
    const { Title } = Typography;

    const handleSetSalario = (salario) => {
        setSalario(salario);
        setLimiteDisponivel(salario * 0.2);
    }

    const clearForm = () => {
        setNome('');
        setEmail('');
        setSalario('');
        setLimiteDisponivel('');
        setLimiteValorParcela('');
    }

    const openNotificationWithIcon = (type, message, description) => {
        notification[type]({
            message: message,
            description: description,
            placement: 'bottomRight',
        });
    };

    const addFunc = () => {
        if (nome === '') {
            notification.error({
                message: 'Erro',
                description: 'O nome do funcionário é obrigatório.',
                placement: 'bottomRight',
            });
            return;
        }
        if (salario === '') {
            notification.error({
                message: 'Erro',
                description: 'O salário do funcionário é obrigatório.',
                placement: 'bottomRight',
            });
            return;
        }

        setLoading(true);
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/adiciona_funcionario.php`, { nome, email, salario, limite: limiteDisponivel, limite_valor_parcela: limiteValorParcela, user: theUser.nome })
            .then((res) => {
                setLoading(false);
                if (res.data.status === 'success') {
                    openNotificationWithIcon('success', 'Funcionário adicionado com sucesso!', '');
                    clearForm();
                    
                    // Chamar a função onSuccess se ela existir
                    if (onSuccess && typeof onSuccess === 'function') {
                        onSuccess();
                    }
                } else {
                    openNotificationWithIcon('error', 'Erro ao adicionar funcionário.', '');
                }
            })
            .catch((err) => {
                setLoading(false);
                console.log("Erro: ", err);
                openNotificationWithIcon('error', 'Erro ao adicionar funcionário', err.message);
            });
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '100%'}}>
            <Form layout="vertical">
                <div style={{display: 'flex', gap: '10px'}}>
                    <div style={{flexGrow: '8'}}>
                        <Form.Item
                            label="Nome"
                            required
                            validateStatus={nome ? 'success' : ''}
                        >
                            <Input
                                value={nome}
                                onChange={(e)=>setNome(e.target.value)}
                                placeholder="Nome completo"
                            />
                        </Form.Item>
                    </div>
                    <div style={{flexGrow: '4'}}>
                        <Form.Item label="E-mail">
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                                type="email"
                            />
                        </Form.Item>
                    </div>
                    <div style={{flexGrow: '1'}}>
                        <Form.Item
                            label="Salário"
                            required
                            validateStatus={salario ? 'success' : ''}
                        >
                            <Input 
                                value={salario} 
                                onChange={(e)=>handleSetSalario(e.target.value)}
                                placeholder="R$" 
                            />
                        </Form.Item>
                    </div>
                    <div style={{flexGrow: '1'}}>
                        <Form.Item label="Limite disponível">
                            <Input
                                value={limiteDisponivel ? parseFloat(limiteDisponivel).toFixed(2) : '0.00'}
                                readOnly
                            />
                        </Form.Item>
                    </div>
                    <div style={{flexGrow: '1'}}>
                        <Form.Item label="Limite de parcela">
                            <Input
                                value={limiteValorParcela}
                                onChange={(e) => setLimiteValorParcela(e.target.value)}
                                placeholder="Opcional (R$)"
                            />
                        </Form.Item>
                    </div>
                </div>
                <div>
                    <Button 
                        type="primary" 
                        onClick={addFunc}
                        loading={loading}
                    >
                        Salvar
                    </Button>
                </div>
            </Form>
        </div>
    );
}

export default AddFunc;
