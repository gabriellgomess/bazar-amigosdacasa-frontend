import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, Layout } from "antd";
import MyContextProvider, { MyContext } from "./contexts/MyContext";
import ptBR from "antd/locale/pt_BR"
import PropTypes from 'prop-types';

// Pages
import Home from "./pages/Home";
import Template from "./pages/Template";
import CadastroCliente from "./pages/CadastroCliente";

// Layout components
const { Content } = Layout;

function WithAuthentication({ children }) {
  const { rootState } = useContext(MyContext);
  const { isAuth } = rootState;
  return isAuth ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

WithAuthentication.propTypes = {
  children: PropTypes.node.isRequired,
};

// --primary-100:#86efac; verde claro
// --primary-200:#f0fdf5; verde claro light
// --primary-300:#19725D; verde escuro
// --accent-100:#f5be0b; amarelo
// --accent-200:#fef1c7; amarelo light
// --text-100:#292524; preto
// --text-200:#78716c; cinza
// --bg-100:#fafaf9; branco
// --bg-200:#f5f5f4; branco light
// --bg-300:#E0E2E5; cinza claro


const theme = {
  token: {
    colorPrimary: "#0d9488",
    colorSuccess: "#52c41a",
    colorWarning: "#f5be0b",
    colorError: "#f67c7e",
    colorInfo: "#e6f4f1",
    colorAccent: "#f0f9f8",
    colorTextBase: "#292524",
    colorBgMenus: "#f1f5f9",
    colorTicket: "#fef1c7",
    colorPDF: "#a31616",
    borderRadius: '8px'
  },
};

// const theme = {
//   token: {
//     colorPrimary: "#e9434b",
//     colorSuccess: "#38a900",
//     colorWarning: "#ffdd00",
//     colorError: "#f67c7e",
//     colorInfo: "#e9434b",
//     colorTextBase: "#313131",
//     colorBgMenus: "#74c3bb",
//     borderRadius: '8px'
//   },
// };

const App = () => {
  return (
    <div style={{height: '100vh', width: '100vw'}}>
      <ConfigProvider theme={theme} locale={ptBR}>
        <MyContextProvider>
          <Layout style={{ minHeight: '100vh' }}>
            <Content style={{ display: "flex", justifyContent: "center" }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cadastro-cliente" element={<CadastroCliente />} />
                <Route
                  path="*"
                  element={
                    <WithAuthentication>
                      <Template theme={theme} />
                    </WithAuthentication>
                  }
                />
              </Routes>
            </Content>
          </Layout>
        </MyContextProvider>
      </ConfigProvider>
    </div>

  );
};

export default App;
