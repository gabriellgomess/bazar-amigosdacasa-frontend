import { useState, useContext } from 'react';
import { MyContext } from '../contexts/MyContext';
import { Upload, Button, message, Alert, Space, Divider, Typography } from 'antd';
import { FaUpload, FaDownload } from 'react-icons/fa';
import axios from 'axios';

const ImportarLimites = ({ onSuccess }) => {
    const { rootState } = useContext(MyContext);
    const { theUser } = rootState;
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [resultadoImportacao, setResultadoImportacao] = useState(null);
    const { Title } = Typography;

    const props = {
        onRemove: () => {
            setFileList([]);
        },
        beforeUpload: file => {
            // Verificar se é um arquivo Excel
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                          file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
                message.error('Você só pode fazer upload de arquivos Excel!');
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            return false;
        },
        fileList,
    };

    const handleUpload = () => {
        const formData = new FormData();
        fileList.forEach(file => {
            formData.append('file', file);
        });
        formData.append('usuario', theUser.nome);

        setUploading(true);
        setResultadoImportacao(null);

        axios.post(`${import.meta.env.VITE_REACT_APP_URL}/importar_limites.php`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        .then(response => {
            setFileList([]);
            setUploading(false);
            
            if (response.data.status === 'success') {
                message.success('Upload realizado com sucesso!');
                setResultadoImportacao({
                    tipo: 'success',
                    mensagem: 'Importação concluída com sucesso!',
                    detalhes: `Foram importados ${response.data.registros} registros.`
                });
                
                // Chamar a função onSuccess se ela existir
                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess();
                }
            } else {
                message.error('Erro ao fazer upload do arquivo!');
                setResultadoImportacao({
                    tipo: 'error',
                    mensagem: 'Erro na importação!',
                    detalhes: response.data.message || 'Ocorreu um erro ao processar o arquivo.'
                });
            }
        })
        .catch(error => {
            setFileList([]);
            setUploading(false);
            message.error('Erro ao fazer upload do arquivo!');
            setResultadoImportacao({
                tipo: 'error',
                mensagem: 'Erro na importação!',
                detalhes: 'Ocorreu um erro ao enviar o arquivo: ' + error.message
            });
            console.error('Erro:', error);
        });
    };

    const handleDownloadModelo = () => {
        // URL para o modelo de planilha
        const modeloUrl = `${import.meta.env.VITE_REACT_APP_URL}/modelos/modelo_importacao_limites.php`;
        
        // Criando um link para download
        const link = document.createElement('a');
        link.href = modeloUrl;
        link.download = 'modelo_importacao_limites.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('Download do modelo iniciado!');
    };

    return (
        <div style={{ maxWidth: '100%' }}>
            <Title level={4}>Importar Limites de Funcionários</Title>
            <p>
                Faça upload de uma planilha Excel com os dados dos funcionários e seus limites.
                A tabela atual será substituída pelos novos dados.
            </p>
            <Alert
                message="Atenção!"
                description="Esta operação vai substituir TODOS os dados de limites atuais. Tenha certeza que o arquivo está completo e correto."
                type="warning"
                showIcon
                style={{ marginBottom: '20px' }}
            />

            <Divider>Modelo de Importação</Divider>
            
            <p>Baixe o modelo de planilha para importação:</p>
            <Button 
                type="primary" 
                icon={<FaDownload />} 
                onClick={handleDownloadModelo}
                style={{ marginBottom: '20px' }}
            >
                Baixar Modelo de Planilha
            </Button>

            <Divider>Upload de Arquivo</Divider>
            
            <Space direction="vertical" style={{ width: '100%' }}>
                <Upload {...props}>
                    <Button icon={<FaUpload />}>Selecionar arquivo Excel</Button>
                </Upload>
                
                <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0}
                    loading={uploading}
                    style={{ marginTop: '10px' }}
                >
                    {uploading ? 'Importando...' : 'Iniciar Importação'}
                </Button>
                
                {resultadoImportacao && (
                    <Alert
                        message={resultadoImportacao.mensagem}
                        description={resultadoImportacao.detalhes}
                        type={resultadoImportacao.tipo}
                        showIcon
                        style={{ marginTop: '20px' }}
                    />
                )}
            </Space>
        </div>
    );
};

export default ImportarLimites; 