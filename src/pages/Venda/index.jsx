import React, { useState, useEffect, useContext, useRef } from "react";
import { Button, notification, Alert, Popconfirm, Space, Tag } from "antd";
import { FaStore, FaTruck } from "react-icons/fa";
import axios from "axios";
import { MyContext } from "../../contexts/MyContext";
import ItemsTable from "./ItemsTable";
import Valores from "./Valores";

const Venda = ({ theme }) => {
  const { rootState } = useContext(MyContext);
  const { theUser } = rootState;

  // Estados para funcionários e venda
  const [funcionarios, setFuncionarios] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [billingType, setBillingType] = useState("");
  const [nomeFuncionario, setNomeFuncionario] = useState("");
  const [limiteTotal, setLimiteTotal] = useState(0);
  const [limiteDisponivel, setLimiteDisponivel] = useState(0);
  const [limiteValorParcela, setLimiteValorParcela] = useState(null);
  const [parcelasComprometidas, setParcelasComprometidas] = useState({});
  const [desabilitaVenda, setDesabilitaVenda] = useState(false);
  const [finalizandoVenda, setFinalizandoVenda] = useState(false);
  const [showCheckbox, setShowCheckbox] = useState(true);
  const [quantity, setQuantity] = useState("1");
  const finalizandoVendaRef = useRef(false);
  const requestIdVendaRef = useRef(null);

  // Estados para UI
  const [code, setCode] = useState("");
  const [showFuncionario, setShowFuncionario] = useState(false);
  const [parcelOptions, setParcelOptions] = useState([
    { value: "1", label: "1x" },
  ]);
  const [selectedParcelOption, setSelectedParcelOption] = useState("1");
  const [roundingValue, setRoundingValue] = useState(null);

  // Implatação dos cartões presentes
  const [show_gift_card, setShow_gift_card] = useState(false);
  const [id_card, setId_card] = useState(0);
  const [valueGiftCard, setValueGiftCard] = useState(0);

  // Implementação de vouchers dinâmicos e configurações do painel
  const [useVoucher, setUseVoucher] = useState(false);
  const [voucherValue, setVoucherValue] = useState(150);
  const [voucherCodigo, setVoucherCodigo] = useState("");
  const [permitirVendaFuncionarios, setPermitirVendaFuncionarios] = useState(true);
  const [permitirVouchers, setPermitirVouchers] = useState(true);
  const [permitirCartoesPresente, setPermitirCartoesPresente] = useState(true);

  // Estados do Comprador e Cashback
  const [compradorCpf, setCompradorCpf] = useState("");
  const [comprador, setComprador] = useState(null);
  const [useCashback, setUseCashback] = useState(false);
  const [cashbackUsado, setCashbackUsado] = useState(0);
  const [descontoPrimeiraCompra, setDescontoPrimeiraCompra] = useState(0);

  // API de notificação
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = (type, message, description) => {
    api[type]({
      message: message,
      description: description,
      placement: "bottomRight",
    });
  };

  // Carregar as configurações gerais de venda do bazar
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_REACT_APP_URL}/configuracoes`)
      .then((res) => {
        if (res.data) {
          setPermitirVendaFuncionarios(res.data.permitir_venda_funcionarios === '1');
          setPermitirVouchers(res.data.permitir_vouchers === '1');
          setPermitirCartoesPresente(res.data.permitir_cartoes_presente === '1');
          setVoucherValue(parseFloat(res.data.valor_padrao_voucher || 150));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar configurações globais:", err);
      });
  }, []);

  const buscarComprador = async (cpf) => {
    if (!cpf) {
      setComprador(null);
      setUseCashback(false);
      setCashbackUsado(0);
      setDescontoPrimeiraCompra(0);
      return;
    }
    
    const cpfLimpo = cpf.replace(/[^\d]+/g, "");
    if (cpfLimpo.length !== 11) {
      setComprador(null);
      setUseCashback(false);
      setCashbackUsado(0);
      setDescontoPrimeiraCompra(0);
      return;
    }
    
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_REACT_APP_URL}/busca_comprador`, {
        cpf: cpfLimpo
      });
      if (data.success && data.comprador) {
        setComprador(data.comprador);
        openNotificationWithIcon(
          "success",
          "Comprador identificado",
          `Cliente ${data.comprador.nome_completo} carregado.`
        );
      }
    } catch (error) {
      console.log("Comprador não encontrado:", error);
      setComprador(null);
      setUseCashback(false);
      setCashbackUsado(0);
      setDescontoPrimeiraCompra(0);
    }
  };

  useEffect(() => {
    if (comprador) {
      if (!comprador.primeira_compra_realizada) {
        const desc = parseFloat((total * 0.10).toFixed(2));
        setDescontoPrimeiraCompra(desc);
        setUseCashback(false);
        setCashbackUsado(0);
      } else {
        setDescontoPrimeiraCompra(0);
        const totalComDesconto = total - valueGiftCard;
        let cbDisponivel = parseFloat(comprador.cashback_acumulado || 0);
        if (useCashback) {
          setCashbackUsado(cbDisponivel > totalComDesconto ? totalComDesconto : cbDisponivel);
        } else {
          setCashbackUsado(0);
        }
      }
    } else {
      setDescontoPrimeiraCompra(0);
      setCashbackUsado(0);
    }
  }, [total, valueGiftCard, useCashback, comprador]);

  useEffect(() => {
    if (showFuncionario) {
      setComprador(null);
      setCompradorCpf("");
      setUseCashback(false);
      setCashbackUsado(0);
    }
  }, [showFuncionario]);

  const gerarRequestIdVenda = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `sale-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  function valorTotalComCartaoPresente(total) {
    return total - valueGiftCard;
  }

  function valorTotalFinal(total) {
    let totalComCartao = total - valueGiftCard;
    let voucherDesconto = useVoucher ? voucherValue : 0;
    let totalFinal = totalComCartao - voucherDesconto - descontoPrimeiraCompra - cashbackUsado;
    return totalFinal > 0 ? totalFinal : 0;
  }

  const clearSale = (notify = false) => {
    setItems([]);
    setTotal(0);
    setBillingType("");
    setNomeFuncionario("");
    setLimiteDisponivel(0);
    setLimiteTotal(0);
    setLimiteValorParcela(null);
    setShowFuncionario(false);
    setId_card(0);
    setValueGiftCard(0);
    setShow_gift_card(false);
    setUseVoucher(false);
    setVoucherCodigo("");
    setCompradorCpf("");
    setComprador(null);
    setUseCashback(false);
    setCashbackUsado(0);
    setDescontoPrimeiraCompra(0);

    // Zera o request_id da venda anterior: sem isso, a próxima venda reusa o
    // mesmo request_id e o backend a trata como idempotente (não grava a
    // transação nova, só confirma "sucesso" de novo).
    requestIdVendaRef.current = null;

    // Recarregar configurações após limpar
    axios.get(`${import.meta.env.VITE_REACT_APP_URL}/configuracoes`)
      .then((res) => {
        if (res.data) {
          setPermitirVendaFuncionarios(res.data.permitir_venda_funcionarios === '1');
          setPermitirVouchers(res.data.permitir_vouchers === '1');
          setPermitirCartoesPresente(res.data.permitir_cartoes_presente === '1');
          setVoucherValue(parseFloat(res.data.valor_padrao_voucher || 150));
        }
      });

    if (notify) {
      openNotificationWithIcon(
        "info",
        "Venda limpa",
        "Todos os dados da venda foram reiniciados."
      );
    }
  };

  const updateParcelOptions = (totalAmount) => {
    const valorComDesconto = totalAmount - valueGiftCard;
    if (valorComDesconto < 150) {
      setParcelOptions([{ value: "1", label: "1x" }]);
      setSelectedParcelOption("1");
    } else {
      setParcelOptions([
        { value: "1", label: "1x" },
        { value: "2", label: "2x" },
        { value: "3", label: "3x" },
      ]);
    }
  };

  const formatarValor = (val) => {
    if (typeof val === "string") {
      const cleanVal = val.replace(",", ".");
      return Number.parseFloat(cleanVal);
    }
    return val;
  };

  useEffect(() => {
    axios
      .post(`${import.meta.env.VITE_REACT_APP_URL}/busca_funcionarios.php`)
      .then((res) => {
        setFuncionarios(res.data);
      })
      .catch((err) => {
        console.log("Erro: ", err);
      });
  }, []);

  const options = funcionarios.map((f) => ({
    value: f.nome,
  }));

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarCodigo(code);
    }
  };

  const handleCodeChange = (e) => {
    const inputValue = e.target.value;
    const number = inputValue.replace(/[^\d]+/g, "");

    if (number === "") {
      setCode("");
      return;
    }

    if (number.length <= 6) {
      setCode(number.padStart(6, "0"));
    } else {
      setCode(number.substring(1).padStart(6, "0"));
    }
  };

  const buscarCodigo = (codigo) => {
    axios
      .post(`${import.meta.env.VITE_REACT_APP_URL}/get_peca_details.php`, {
        codigo: codigo,
      })
      .then((res) => {
        if (res.data && res.data.status === "success") {
          const item = res.data.peca;
          const itemExistente = items.find((i) => i.id === item.id);
          if (itemExistente) {
            const newItems = items.map((i) => {
              if (i.id === item.id) {
                return {
                  ...i,
                  quantidade: String(Number(i.quantidade) + Number(quantity)),
                };
              }
              return i;
            });
            setItems(newItems);
            let totalTemp = 0;
            for (const it of newItems) {
              totalTemp += Number(it.quantidade) * Number(it.valor_sugerido);
            }
            setTotal(totalTemp);
            updateParcelOptions(totalTemp);
            setCode("");
            setQuantity("1");
            return;
          }

          // Regras de cartão presente
          const isCartaoPresente = item.tipo === "cartao_presente";
          const jaTemCartaoPresente = items.some(i => i.tipo === "cartao_presente");
          const jaTemOutroTipo = items.some(i => i.tipo !== "cartao_presente");

          if (jaTemCartaoPresente && !isCartaoPresente) {
            openNotificationWithIcon(
              "error",
              "Venda inválida",
              "Cartão presente só pode ser vendido sozinho."
            );
            return;
          }

          if (!jaTemCartaoPresente && jaTemOutroTipo && isCartaoPresente) {
            openNotificationWithIcon(
              "error",
              "Venda inválida",
              "Cartão presente só pode ser vendido sozinho."
            );
            return;
          }

          if (isCartaoPresente) {
            setShow_gift_card(false);
            setId_card(0);
            setValueGiftCard(0);
          }

          const newItem = {
            ...item,
            quantidade: quantity,
          };
          const newItems = [...items, newItem];
          setItems(newItems);
          const newTotal = total + Number(quantity) * Number(newItem.valor_sugerido);
          setTotal(newTotal);
          updateParcelOptions(newTotal);
          setCode("");
          setQuantity("1");
        } else {
          openNotificationWithIcon(
            "error",
            "Erro ao buscar produto",
            "Código de barras inválido ou produto não encontrado."
          );
        }
      })
      .catch((err) => {
        console.log(err);
        openNotificationWithIcon(
          "error",
          "Erro ao buscar produto",
          "Houve um problema de conexão com o servidor."
        );
      });
  };

  const handleChangeBillingType = (value) => {
    setBillingType(value);
    if (value === "Desconto em Folha") {
      setShowFuncionario(true);
      setShowCheckbox(false);
    } else {
      setShowFuncionario(false);
      setShowCheckbox(true);
      setLimiteDisponivel(0);
      setLimiteTotal(0);
      setLimiteValorParcela(null);
    }
  };

  const habilita_venda = () => {
    if (billingType === "Desconto em Folha") {
      const habilitar_venda = formatarValor(limiteDisponivel) - total * 0.9;
      setDesabilitaVenda(habilitar_venda <= 0);
    } else {
      setDesabilitaVenda(false);
    }
  };

  // consulta se o id_card tem na tabela de cartões de presentes e retorna o valor dele.
  async function consultaIdCartaoPresente(id_card) {
    if (id_card !== 0 && id_card !== "") {
      const { data } = await axios.post(
        `${import.meta.env.VITE_REACT_APP_URL}/busca_cartao_presente.php`,
        { id_card }
      );

      if (data.success) {
        if (data.cartao_presente.usado === 1) {
          openNotificationWithIcon(
            "error",
            "Erro ao buscar cartão presente",
            `${data.message}, tente novamente outro código.`
          );    
        }
        setValueGiftCard(data.cartao_presente.valor);
      } else {
        setValueGiftCard(0);
        openNotificationWithIcon(
          "error",
          "Erro ao buscar cartão presente",
          `${data.message}, tente novamente outro código.`
        );
      }
    }
  }

  // Valida um código de voucher contra o backend
  async function consultaVoucher(codigo) {
    if (codigo !== "") {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_REACT_APP_URL}/valida_voucher`,
          { codigo }
        );

        if (data.success) {
          if (total < data.voucher.valor) {
            openNotificationWithIcon(
              "warning",
              "Valor mínimo não atingido",
              `Este voucher de R$ ${data.voucher.valor} só pode ser usado em compras de no mínimo R$ ${data.voucher.valor}.`
            );
            setUseVoucher(false);
            setVoucherValue(0);
          } else {
            setVoucherValue(parseFloat(data.voucher.valor));
            setUseVoucher(true);
            openNotificationWithIcon(
              "success",
              "Voucher aplicado!",
              `Desconto de R$ ${data.voucher.valor} aplicado com sucesso.`
            );
          }
        } else {
          setUseVoucher(false);
          setVoucherValue(0);
          openNotificationWithIcon(
            "error",
            "Erro ao validar voucher",
            `${data.message}, tente novamente outro código.`
          );
        }
      } catch (error) {
        console.error("Erro ao validar voucher:", error);
        setUseVoucher(false);
        setVoucherValue(0);
        openNotificationWithIcon(
          "error",
          "Erro de comunicação",
          "Não foi possível validar o voucher com o servidor."
        );
      }
    }
  }

  // UseEffect para habilitar a venda
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    habilita_venda();
  }, [total, limiteDisponivel, billingType, nomeFuncionario]);

  // Busca parcelas já comprometidas no mês para Desconto em Folha
  useEffect(() => {
    if (billingType === 'Desconto em Folha' && nomeFuncionario) {
      axios
        .post(`${import.meta.env.VITE_REACT_APP_URL}/consulta_parcelas_mes.php`, {
          nome_funcionario: nomeFuncionario,
        })
        .then((res) => {
          if (res.data.status === 'success') {
            setParcelasComprometidas(res.data.parcelas_por_mes);
          }
        })
        .catch((err) => console.log('Erro ao buscar parcelas comprometidas:', err));
    } else {
      setParcelasComprometidas({});
    }
  }, [billingType, nomeFuncionario]);

  const onChangeGiftCard = (e) => {
    if (e.target.checked) {
      setShow_gift_card(true);
    } else {
      setShow_gift_card(false);
      setId_card(0);
      setValueGiftCard(0);
    }
  };

  const onChange = (e) => {
    if (e.target.checked) {
      setShowFuncionario(true);
    } else {
      setShowFuncionario(false);
      setLimiteDisponivel(0);
      setLimiteTotal(0);
      setLimiteValorParcela(null);
    }
  };

  const onChangeVoucher = (e) => {
    if (e.target.checked) {
      setUseVoucher(true);
    } else {
      setUseVoucher(false);
      setVoucherCodigo("");
      axios.get(`${import.meta.env.VITE_REACT_APP_URL}/configuracoes`)
        .then((res) => {
          if (res.data) {
            setVoucherValue(parseFloat(res.data.valor_padrao_voucher || 150));
          }
        });
    }
  };

  const handleSetName = (value) => {
    setNomeFuncionario(value);
    checkLimit(value);
  };

  const handleFuncionarioInputChange = (value) => {
    setNomeFuncionario(value);
    if (!value) {
      setLimiteDisponivel(0);
      setLimiteTotal(0);
      setLimiteValorParcela(null);
    }
  };

  const checkLimit = (nome) => {
    if (!nome) {
      console.log("O nome do funcionário é obrigatório.");
      return;
    }

    axios
      .post(
        `${import.meta.env.VITE_REACT_APP_URL}/consulta_limites.php`,
        { nome_funcionario: nome }
      )
      .then((res) => {
        if (res.data) {
          setLimiteTotal(res.data.limite_total);
          setLimiteDisponivel(res.data.limite_disponivel);
          setLimiteValorParcela(res.data.limite_valor_parcela ?? null);
        } else {
          console.log("Resposta recebida, mas sem dados de limite.");
        }
      })
      .catch((err) => {
        console.log("Erro: ", err);
      });
  };

  const handleViewData = () => {
    if (finalizandoVendaRef.current || finalizandoVenda) return;

    const totalPecas = items.reduce(
      (acc, item) => acc + Number(item.quantidade),
      0
    );

    const requestIdVenda = requestIdVendaRef.current || gerarRequestIdVenda();
    requestIdVendaRef.current = requestIdVenda;

    const data = {
      request_id: requestIdVenda,
      nome_funcionario: nomeFuncionario,
      data_compra: new Date().toISOString().slice(0, 10),
      valor_compra: showFuncionario ? valorTotalFinal(total).toFixed(2) : valorTotalFinal(total),
      total_pecas: totalPecas,
      quantidade_parcelas: selectedParcelOption,
      valor_parcela: valorTotalFinal(total) / selectedParcelOption,
      forma_pagamento: billingType,
      id_cartao_presente: id_card,
      id_voucher: useVoucher ? 1 : null,
      voucher_codigo: useVoucher ? voucherCodigo : null,
      voucher_valor: useVoucher ? voucherValue : null,
      comprador_cpf: compradorCpf,
      use_cashback: useCashback,
      desconto_primeira_compra: descontoPrimeiraCompra,
      cashback_usado: cashbackUsado,
      usuario: theUser.nome,
      local_venda: sessionStorage.getItem("localVenda") || "Loja Física",
      log_transacao: items.map((item) => {
        return {
          id: item.id,
          codigo: item.codigo,
          descricao: item.descricao,
          tag: item.tag,
          tipo: item.tipo,
          valor_loja: item.valor_loja,
          valor_50: item.valor_50,
          valor_sugerido: item.valor_sugerido,
          desc_func_10: item.desc_func_10,
          quantidade: item.quantidade,
          valor_pago:
          (showFuncionario && !(items.length === 1 && item.tipo === 'cartao_presente'))
            ? item.valor_sugerido * 0.9
            : item.valor_sugerido,
        };
      }),
      check_func: showFuncionario ? 1 : 0,
    };

    if (data.check_func === 1 || data.forma_pagamento === "Desconto em Folha") {
      if (!data.nome_funcionario) {
        openNotificationWithIcon(
          "error",
          "Erro ao finalizar a venda",
          "Selecione o funcionário."
        );
        return;
      }
    }

    if (data.total_pecas <= 0) {
      openNotificationWithIcon(
        "error",
        "Erro ao finalizar a venda",
        "Não há peças na venda."
      );
      return;
    }

    if (!data.forma_pagamento) {
      openNotificationWithIcon(
        "error",
        "Erro ao finalizar a venda",
        "Selecione a forma de pagamento"
      );
      return;
    }

    if (data.valor_compra < 0) {
      data.valor_compra = 0;
    }

    finalizandoVendaRef.current = true;
    setFinalizandoVenda(true);

    axios
      .post(
        `${import.meta.env.VITE_REACT_APP_URL}/finaliza_venda.php`,
        data
      )
      .then((res) => {
        if (res.data && res.data.success) {
          if (res.data.idempotent) {
            // Isso não deveria acontecer numa venda nova: o backend identificou
            // que esse request_id já tinha uma transação gravada e NÃO criou
            // uma linha nova. Avisa em vez de mostrar sucesso normal, pra não
            // esconder uma venda que ficou de fora.
            openNotificationWithIcon(
              "warning",
              "Venda não gravada como nova",
              "O sistema identificou essa venda como uma repetição de outra já registrada e não criou um novo registro. Se essa venda é diferente da anterior, avise o suporte antes de continuar."
            );
          } else {
            openNotificationWithIcon(
              "success",
              "Venda finalizada com sucesso",
              "Sua venda foi processada e finalizada."
            );
          }
          if (
            data.forma_pagamento === "Desconto em Folha" &&
            res.data.email_enviado === false
          ) {
            openNotificationWithIcon(
              "warning",
              "Email não enviado",
              res.data.email_erro ||
                "A venda foi finalizada, mas não foi possível enviar o email ao colaborador."
            );
          }
          clearSale();
        } else {
          openNotificationWithIcon(
            "error",
            "Erro ao finalizar a venda",
            res.data?.message || "Não foi possível processar a venda. Por favor, tente novamente."
          );
        }
      })
      .catch((err) => {
        openNotificationWithIcon(
          "error",
          "Erro ao finalizar a venda",
          err.response?.data?.message || "Houve um problema ao conectar ao servidor. Por favor, verifique sua conexão."
        );
        console.log("Erro: ", err);
      })
      .finally(() => {
        finalizandoVendaRef.current = false;
        setFinalizandoVenda(false);
      });
  };

  const handleRoundingChange = (value) => {
    setRoundingValue(parseInt(value, 10));
  };

  return (
    <div>
      {contextHolder}
      <form>
        <style>
          {`
            .customer-input {
                height: 5rem;
                font-size: 2rem !important;
                font-weight: 700;
            }
          `}
        </style>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '10px',
          paddingRight: '15px'
        }}>
          <Tag 
            color={sessionStorage.getItem("localVenda") === "Unidade Móvel" ? "purple" : "cyan"} 
            style={{ 
              padding: '6px 14px', 
              fontSize: '14px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              border: '1px solid',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}
          >
            {sessionStorage.getItem("localVenda") === "Unidade Móvel" ? <FaTruck /> : <FaStore />} 
            <span>{sessionStorage.getItem("localVenda") || "Loja Física"}</span>
          </Tag>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "30px",
            paddingTop: "0",
          }}
        >
          <ItemsTable
            code={code}
            handleCodeChange={handleCodeChange}
            handleKeyPress={handleKeyPress}
            quantity={quantity}
            setQuantity={setQuantity}
            items={items}
            theme={theme}
            setItems={setItems}
            setTotal={setTotal}
            updateParcelOptions={updateParcelOptions}
            habilita_venda={habilita_venda}
          />
          <Valores
            handleChangeBillingType={handleChangeBillingType}
            showCheckbox={showCheckbox}
            onChange={onChange}
            showFuncionario={showFuncionario}
            options={options}
            handleSetName={handleSetName}
            handleFuncionarioInputChange={handleFuncionarioInputChange}
            nomeFuncionario={nomeFuncionario}
            limiteDisponivel={limiteDisponivel}
            limiteTotal={limiteTotal}
            total={total}
            theme={theme}
            parcelOptions={parcelOptions}
            setSelectedParcelOption={setSelectedParcelOption}
            selectedParcelOption={selectedParcelOption}
            billingType={billingType}
            id_card={id_card}
            setId_card={setId_card}
            show_gift_card={show_gift_card}
            setShow_gift_card={setShow_gift_card}
            onChangeGiftCard={onChangeGiftCard}
            consultaIdCartaoPresente={consultaIdCartaoPresente}
            valueGiftCard={valueGiftCard}
            items={items}
            // Props do voucher
            useVoucher={useVoucher}
            onChangeVoucher={onChangeVoucher}
            voucherValue={voucherValue}
            voucherCodigo={voucherCodigo}
            setVoucherCodigo={setVoucherCodigo}
            consultaVoucher={consultaVoucher}
            // Configurações Gerais
            permitirVendaFuncionarios={permitirVendaFuncionarios}
            permitirVouchers={permitirVouchers}
            permitirCartoesPresente={permitirCartoesPresente}
            // Props do limite de parcela
            limiteValorParcela={limiteValorParcela}
            parcelasComprometidas={parcelasComprometidas}
            // Props do Comprador e Cashback
            compradorCpf={compradorCpf}
            setCompradorCpf={setCompradorCpf}
            comprador={comprador}
            setComprador={setComprador}
            buscarComprador={buscarComprador}
            useCashback={useCashback}
            setUseCashback={setUseCashback}
            cashbackUsado={cashbackUsado}
            descontoPrimeiraCompra={descontoPrimeiraCompra}
          />
        </div>
        
        <Space style={{ marginTop: "30px" }} size="middle">
          <Button
            type="primary"
            size="large"
            style={{ 
              height: '50px', 
              padding: '0 45px', 
              fontSize: '16px', 
              fontWeight: '600',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2), 0 2px 4px -2px rgba(13, 148, 136, 0.2)'
            }}
            onClick={handleViewData}
            disabled={desabilitaVenda || finalizandoVenda}
            loading={finalizandoVenda}
          >
            Finalizar Venda
          </Button>
          <Popconfirm
            title="Limpar venda"
            description="Remover todos os dados preenchidos desta venda?"
            okText="Limpar"
            cancelText="Cancelar"
            onConfirm={() => clearSale(true)}
          >
            <Button 
              type="text" 
              danger 
              size="large"
              style={{ height: '50px', borderRadius: '8px' }}
              disabled={finalizandoVenda}
            >
              Limpar Venda
            </Button>
          </Popconfirm>
        </Space>
      </form>
      {desabilitaVenda && (
        <Alert
          style={{ marginTop: "30px" }}
          message="Limite excedido!"
          description="Não há limite disponível para o funcionário selecionado."
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};

export default Venda;
