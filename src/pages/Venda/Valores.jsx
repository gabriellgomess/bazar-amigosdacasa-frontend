import React, { useState } from 'react';
import { Typography, Input, Select, AutoComplete, Checkbox, Button, Modal, Form, message, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { FaUserPlus, FaCheck, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const Valores = ({
  theme,
  handleChangeBillingType,
  showCheckbox,
  onChange,
  showFuncionario,
  options,
  handleSetName,
  handleFuncionarioInputChange,
  nomeFuncionario,
  limiteDisponivel,
  limiteTotal,
  total,
  parcelOptions,
  setSelectedParcelOption,
  selectedParcelOption,
  billingType,
  id_card,
  show_gift_card,
  setId_card,
  onChangeGiftCard,
  consultaIdCartaoPresente,
  valueGiftCard,
  items,
  // Props do voucher
  useVoucher,
  onChangeVoucher,
  voucherValue,
  voucherCodigo,
  setVoucherCodigo,
  consultaVoucher,
  // Opções gerais de configurações
  permitirVendaFuncionarios,
  permitirVouchers,
  permitirCartoesPresente,
  // Props do limite de parcela
  limiteValorParcela,
  parcelasComprometidas,
  // Props do Comprador e Cashback
  compradorCpf,
  setCompradorCpf,
  comprador,
  setComprador,
  buscarComprador,
  useCashback,
  setUseCashback,
  cashbackUsado,
  descontoPrimeiraCompra,
}) => {
  const { Text } = Typography;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regForm] = Form.useForm();

  const hoje = new Date().toISOString().split('T')[0];

  const apenasCartaoPresente = items.length === 1 && items[0].tipo === "cartao_presente";
  const temCartaoPresenteValido = show_gift_card && id_card > 0 && valueGiftCard > 0;

  function valorTotalComCartaoPresente(total) {
    return temCartaoPresenteValido ? total - valueGiftCard : total;
  }

  function valorTotalFinal(total) {
    let totalComCartao = valorTotalComCartaoPresente(total);
    let voucherDesconto = useVoucher ? voucherValue : 0;
    let totalFinal = totalComCartao - voucherDesconto - descontoPrimeiraCompra - cashbackUsado;
    return totalFinal > 0 ? totalFinal : 0;
  }

  function calcularValorParcela() {
    let valor = valorTotalComCartaoPresente(total);
    if (showFuncionario && !apenasCartaoPresente) {
      valor *= 0.9;
    }
    return valor / parseInt(selectedParcelOption);
  }

  const formatCPFInput = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const handleRegSubmit = async (values) => {
    setRegistering(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_APP_URL}/registrar_comprador`, {
        nome_completo: values.nome_completo,
        data_nascimento: values.data_nascimento,
        cpf: compradorCpf.replace(/[^\d]+/g, ""),
        telefone: values.telefone,
        email: values.email,
        endereco: values.endereco,
        aceite_lgpd: values.aceite_lgpd ? true : false,
      });

      if (response.data && response.data.success) {
        message.success('Comprador cadastrado com sucesso!');
        buscarComprador(compradorCpf);
        setIsModalOpen(false);
        regForm.resetFields();
      } else {
        message.error(response.data?.message || 'Erro ao registrar comprador.');
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div style={{ width: '48%', minWidth: '320px', paddingTop: '25px', flexGrow: '1' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 260px' }}>
            <Typography.Title style={{ margin: 0 }} level={5}>Forma de Pagamento</Typography.Title>
            <Select
              placeholder="Forma de Pagamento"
              style={{ width: '100%', height: 50 }}
              value={billingType}
              onChange={handleChangeBillingType}
              options={[
                { value: '', label: 'Forma de pagamento' },
                { value: 'Credito', label: 'Crédito' },
                { value: 'Debito', label: 'Débito' },
                ...(permitirVendaFuncionarios ? [{ value: 'Desconto em Folha', label: 'Desconto em Folha' }] : []),
                { value: 'Dinheiro', label: 'Dinheiro' },
                { value: 'Pix', label: 'PIX' },
                { value: 'Acolhido', label: 'Acolhido' },
              ]}
            />
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px', flexWrap: 'wrap', marginTop: '5px' }}>
              {permitirVendaFuncionarios && billingType === 'Desconto em Folha' && (
                <Checkbox onChange={onChange} style={{ fontSize: '15px' }} checked disabled>
                  Funcionário
                </Checkbox>
              )}
              {permitirVendaFuncionarios && showCheckbox && (
                <Checkbox onChange={onChange} style={{ fontSize: '15px' }} disabled={billingType === ''} checked={showFuncionario}>
                  Funcionário
                </Checkbox>
              )}
              {permitirCartoesPresente && (
                <Checkbox
                  onChange={onChangeGiftCard}
                  style={{ fontSize: '15px' }}
                  disabled={billingType === '' || items.some(item => item.tipo === 'cartao_presente')}
                  checked={show_gift_card}
                >
                  Cartão Presente
                </Checkbox>
              )}
              {permitirVouchers && (
                <Checkbox
                  onChange={onChangeVoucher}
                  style={{ fontSize: '15px' }}
                  disabled={billingType === ''}
                  checked={useVoucher}
                >
                  Voucher (R$ {voucherValue})
                </Checkbox>
              )}
            </div>

            {billingType && billingType !== 'Desconto em Folha' && billingType !== 'Acolhido' && !showFuncionario && (
              <div 
                className="mt-4 p-4 rounded-xl border border-slate-200" 
                style={{ 
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                  Identificar Comprador (Cashback / Desconto)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    placeholder="CPF do Cliente"
                    value={compradorCpf}
                    onChange={(e) => {
                      const formatted = formatCPFInput(e.target.value);
                      setCompradorCpf(formatted);
                      const clean = formatted.replace(/[^\d]+/g, "");
                      if (clean.length === 11) {
                        buscarComprador(clean);
                      }
                    }}
                    style={{ height: '40px', borderRadius: '6px' }}
                  />
                  <Button
                    type="default"
                    icon={<FaSearch />}
                    onClick={() => buscarComprador(compradorCpf)}
                    style={{ height: '40px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </div>

                {comprador ? (
                  <div 
                    style={{ 
                      padding: '12px', 
                      backgroundColor: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#166534' }}>{comprador.nome_completo}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{comprador.email}</span>
                    </div>
                    
                    {!comprador.primeira_compra_realizada ? (
                      <div style={{ color: '#15803d', fontSize: '13px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaCheck /> Primeira compra: 10% de desconto automático! (- {formatCurrency(descontoPrimeiraCompra)})
                      </div>
                    ) : (
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Checkbox
                          checked={useCashback}
                          onChange={(e) => setUseCashback(e.target.checked)}
                          style={{ color: '#334155' }}
                        >
                          Usar saldo de Cashback disponível: <strong style={{ color: '#0d9488' }}>{formatCurrency(comprador.cashback_acumulado)}</strong>
                        </Checkbox>
                        {useCashback && (
                          <span style={{ fontSize: '12px', color: '#0369a1', marginLeft: '24px', fontWeight: '600' }}>
                            Cashback utilizado: - {formatCurrency(cashbackUsado)}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '24px', display: 'block' }}>
                          Esta compra renderá: <strong style={{ color: '#0d9488' }}>{formatCurrency(valorTotalFinal(total) * 0.05)}</strong> de cashback
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  compradorCpf.replace(/[^\d]+/g, "").length === 11 && (
                    <div 
                      style={{ 
                        padding: '12px', 
                        backgroundColor: '#fef9c3', 
                        border: '1px solid #fef08a', 
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#854d0e', fontWeight: '600' }}>
                        Comprador não cadastrado.
                      </span>
                      <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<FaUserPlus />}
                        onClick={() => setIsModalOpen(true)}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Cadastrar Novo Comprador
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {showFuncionario && permitirVendaFuncionarios && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 260px' }}>
              <Typography.Title style={{ margin: 0 }} level={5}>Funcionário</Typography.Title>
              <AutoComplete
                style={{ width: '100%', height: 50 }}
                options={options}
                id='nome_funcionario'
                placeholder="Funcionário"
                value={nomeFuncionario}
                filterOption={(inputValue, option) =>
                  option.value.toUpperCase().includes(inputValue.toUpperCase())
                }
                onChange={handleFuncionarioInputChange}
                onSelect={handleSetName}
              />
            </div>
          )}
        </div>

        {/* Inputs dinâmicos para limite, cartão presente e vouchers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '80px', width: '100%' }}>
          {billingType === 'Desconto em Folha' && permitirVendaFuncionarios && (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', width: '100%' }}>
              <div style={{ flex: '1 1 140px' }}>
                <Typography.Title level={5} style={{ margin: '0 0 5px 0' }}>Limite disponível</Typography.Title>
                <Input 
                  value={limiteDisponivel} 
                  style={{ background: '#f1f5f9', height: '40px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }} 
                  readOnly 
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <Typography.Title level={5} style={{ margin: '0 0 5px 0' }}>Limite total</Typography.Title>
                <Input 
                  value={limiteTotal} 
                  style={{ background: '#f1f5f9', height: '40px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }} 
                  readOnly 
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' }}>
            {show_gift_card && permitirCartoesPresente && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flex: '1 1 200px' }}>
                <div style={{ flex: '1' }}>
                  <Typography.Title level={5} style={{ margin: '0 0 5px 0' }}>Cartão presente</Typography.Title>
                  <Input
                    type="number"
                    style={{ background: 'white', height: '40px' }}
                    value={id_card || ''}
                    placeholder="Código ID"
                    onChange={(e) => setId_card(Number(e.target.value))}
                  />
                </div>
                <Button
                  type="primary"
                  style={{ height: '40px' }}
                  onClick={() => consultaIdCartaoPresente(id_card)}
                >
                  Consultar
                </Button>
              </div>
            )}

            {useVoucher && permitirVouchers && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flex: '1 1 240px' }}>
                <div style={{ flex: '1' }}>
                  <Typography.Title level={5} style={{ margin: '0 0 5px 0' }}>Código do Voucher</Typography.Title>
                  <Input
                    type="text"
                    style={{ background: 'white', height: '40px' }}
                    value={voucherCodigo}
                    placeholder="Código"
                    onChange={(e) => setVoucherCodigo(e.target.value)}
                  />
                </div>
                <Button
                  type="primary"
                  style={{ height: '40px' }}
                  onClick={() => consultaVoucher(voucherCodigo)}
                >
                  Validar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', width: '100%', marginTop: '20px' }}>      
        <div style={{ width: '100%' }}>          
          <Typography.Title level={5}>Valor <FontAwesomeIcon icon={faDollarSign} /></Typography.Title>
          <Input
            disabled
            style={{ color: theme.token.colorSuccess }}
            className='customer-input'
            type="text"
            value={valorTotalFinal(total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          />
        </div>
      </div>

      {billingType === "Desconto em Folha" && permitirVendaFuncionarios && (
        <div style={{ marginTop: '20px', maxWidth: '550px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>Parcelas</Typography.Title>
            <Select
              style={{ width: 120 }}
              value={selectedParcelOption}
              onChange={(value) => setSelectedParcelOption(value)}
              options={parcelOptions}
            />
          </div>

          {selectedParcelOption !== "1" && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text>Valor da parcela:</Text>
              <Text strong>{formatCurrency(calcularValorParcela())}</Text>
            </div>
          )}
          
          {(() => {
            if (billingType !== 'Desconto em Folha' || !limiteValorParcela || limiteValorParcela <= 0) return null;
            const currentParcelVal = calcularValorParcela();
            const exceedsLimit = currentParcelVal > limiteValorParcela;
            
            return exceedsLimit ? (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                Atenção: O valor da parcela ({formatCurrency(currentParcelVal)}) excede o limite máximo permitido por parcela ({formatCurrency(limiteValorParcela)}).
              </div>
            ) : null;
          })()}
        </div>
      )}

      <Modal
        title="Cadastrar Novo Comprador"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={regForm}
          layout="vertical"
          onFinish={handleRegSubmit}
          initialValues={{ cpf: compradorCpf }}
        >
          <Form.Item label="CPF">
            <Input value={compradorCpf} disabled style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="nome_completo"
            label="Nome Completo"
            rules={[{ required: true, message: 'Digite o nome completo.' }]}
          >
            <Input placeholder="Ex: João da Silva" style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="data_nascimento"
            label="Data de Nascimento"
            rules={[
              { required: true, message: 'Informe a data de nascimento.' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  return value > hoje
                    ? Promise.reject(new Error('Data de nascimento inválida.'))
                    : Promise.resolve();
                }
              }
            ]}
          >
            <Input type="date" max={hoje} style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="telefone"
            label="Telefone"
            rules={[{ required: true, message: 'Informe o telefone.' }]}
          >
            <Input placeholder="Ex: (51) 99999-9999" style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'Informe o e-mail.' },
              { type: 'email', message: 'E-mail inválido.' }
            ]}
          >
            <Input placeholder="Ex: joao@email.com" style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="endereco"
            label="Endereço (Opcional)"
          >
            <Input placeholder="Ex: Rua das Flores, 123" style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>

          <Text style={{ display: 'block', fontSize: 10, lineHeight: 1.4, color: '#94a3b8', marginBottom: 12 }}>
            Os dados pessoais informados serão utilizados exclusivamente para fins de cadastro, contato e relacionamento com a Casa de Saúde Menino Jesus de Praga, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
          </Text>

          <Form.Item
            name="aceite_lgpd"
            valuePropName="checked"
            rules={[
              {
                validator: (_, checked) =>
                  checked
                    ? Promise.resolve()
                    : Promise.reject(new Error('É necessário o consentimento do comprador para continuar.'))
              }
            ]}
          >
            <Checkbox style={{ fontSize: 11, lineHeight: 1.4, color: '#64748b' }}>
              O comprador foi informado e concorda com o tratamento dos seus dados pessoais para as finalidades acima, nos termos da LGPD.
            </Checkbox>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'end', gap: '8px', marginTop: '16px' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={registering}>
              Salvar Comprador
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );

  function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }
};

export default Valores;
