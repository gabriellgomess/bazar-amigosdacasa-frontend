import React, { useState, useEffect, useContext } from "react";
import { MyContext } from '../contexts/MyContext';
import axios from 'axios';
import { AutoComplete, Typography, Input, Button, notification, Alert } from "antd";

const LimitManager = () => {
    const { rootState } = useContext(MyContext);
    const { theUser } = rootState;

    const [funcionarios, setFuncionarios] = useState([])
    const [limiteTotal, setLimiteTotal] = useState('')
    const [limiteDisponivel, setLimiteDisponivel] = useState('')
    const [selectedName, setSelectedName] = useState('')
    const [newLimiteDisponivel, setNewLimiteDisponivel] = useState('')
    const [newLimiteTotal, setNewLimiteTotal] = useState('')
    const [autoCompleteValue, setAutoCompleteValue] = useState('');

    useEffect(() => {
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/busca_funcionarios.php`)
            .then((res) => {
                setFuncionarios(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    const options = funcionarios.map((funcionario) => {
        return { value: funcionario };
    });

    const handleSetName = (nome) => {
        if (!nome) {
            console.log("O nome do funcionário é obrigatório.");
            setLimiteTotal('')
            setLimiteDisponivel('')
            setSelectedName('')
            setNewLimiteTotal('')
            setNewLimiteDisponivel('')
            return;
        }
        setSelectedName(nome);
        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/consulta_limites.php`, { nome_funcionario: nome })
            .then((res) => {
                if (res.data) {
                    setLimiteTotal(res.data.limite_total);
                    setLimiteDisponivel(res.data.limite_disponivel);
                    setNewLimiteTotal(res.data.limite_total)
                    setNewLimiteDisponivel(res.data.limite_disponivel)
                    console.log(res.data)

                } else {
                    console.log("Resposta recebida, mas sem dados de limite.");
                }
            })
            .catch((err) => {
                console.log("Erro: ", err);
            });
    }


    const handleLimiteDisponivelChange = (e) => {
        setNewLimiteDisponivel(e.target.value);
    };

    const handleLimiteTotalChange = (e) => {
        setNewLimiteTotal(e.target.value);
    };

    const openNotificationWithIcon = (type, message, description) => {
        notification[type]({
            message: message,
            description: description,
            placement: 'bottomRight',
        });
    };

    const handleSetLimit = () => {

        const dados = {
            nome: selectedName,
            user: theUser.nome,
            limite_disponivel: limiteDisponivel,
            limite_total: limiteTotal,
            new_limite_disponivel: newLimiteDisponivel,
            new_limite_total: newLimiteTotal
        }

        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/ajuste_limites.php`, dados)
            .then((res) => {
                if (res.data.status === 'success') {
                    openNotificationWithIcon('success', 'Sucesso!', 'Limite ajustado com sucesso.');

                    // Limpar o formulário
                    setLimiteTotal('');
                    setLimiteDisponivel('');
                    setSelectedName('');
                    setNewLimiteDisponivel('');
                    setNewLimiteTotal('');

                    // Limpar o AutoComplete
                    setAutoCompleteValue('');
                }
            })
            .catch((err) => {
                console.log("Erro: ", err);
            });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div>
                    <Typography.Title level={5}>Funcionário</Typography.Title>
                    <AutoComplete
                        style={{ width: 200 }}
                        options={options}
                        id='nome_funcionario'
                        placeholder="Funcionário"
                        value={autoCompleteValue}  // Adicionado o controle do valor
                        filterOption={(inputValue, option) =>
                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                        onChange={(nome) => {
                            handleSetName(nome);
                            setAutoCompleteValue(nome);  // Atualizando o valor do AutoComplete
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', flexGrow: '1' }}>
                    <div>
                        <Typography.Title level={5}>Limite Disponível</Typography.Title>
                        <Input
                            value={newLimiteDisponivel}
                            onChange={handleLimiteDisponivelChange}
                        />
                    </div>
                    <div>
                        <Typography.Title level={5}>Limite Total</Typography.Title>
                        <Input
                            value={newLimiteTotal}
                            onChange={handleLimiteTotalChange}
                        />
                    </div>
                </div>
            </div>

            <div>
                <Button onClick={() => handleSetLimit()}>Ajustar Limites</Button>
            </div>

        </div>
    )
}

export default LimitManager;
