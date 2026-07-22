import React, { useContext, useState } from 'react';
import { MyContext } from '../contexts/MyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBoxesStacked,
  faCartShopping,
  faChartSimple,
  faChevronLeft,
  faChevronRight,
  faGears,
  faGear,
  faShirt,
  faUserGear,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Avatar, Button, Drawer, Grid, Layout, Tooltip } from 'antd';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

import Venda from './Venda/';
import Dashboard from './Dashboard/';
import Estoque from './Estoque/';
import Backoffice from './Backoffice';
import Perfil from './Perfil';
import Transacoes from './Transacoes';
import Configuracoes from './Configuracoes';

// Importações dos novos Logotipos
import LogoBazarHorizontal from '../assets/logotipos_bazar/thumbnail_ADC_bazar_logotipo-04.png';
import LogoAmigosDaCasaHorizontal from '../assets/logos_amigos_da_casa/logo_horizontal.png';
import LogoAmigosDaCasaVertical from '../assets/logos_amigos_da_casa/logo_vertical.png';
import LogoCasaHorizontalColor from '../assets/logos_casa/logo_horizontal_color.png';
import LogoCasaVerticalColor from '../assets/logos_casa/logo_vertical_color.png';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS = [
  { path: '/venda', label: 'Venda', icon: faShirt },
  { path: '/dashboard', label: 'Dashboard', icon: faChartSimple },
  { path: '/backoffice', label: 'Gerenciamento', icon: faGears },
  { path: '/estoque', label: 'Estoque', icon: faBoxesStacked },
  { path: '/transacoes', label: 'Transações', icon: faCartShopping },
  { path: '/perfil', label: 'Perfil', icon: faUserGear },
  { path: '/configuracoes', label: 'Configurações', icon: faGear },
];

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`;
  }
  return parts[0]?.[0] || 'U';
};

const getFirstAndLastName = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return name || 'Usuário';
};

const SidebarContent = ({ collapsed, currentPath, onNavigate, userName, nivelAcesso }) => {
  const showCompact = collapsed;
  const isDiretoria = nivelAcesso?.toLowerCase() === 'diretoria';
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.path === '/perfil') return isDiretoria;
    if (item.path === '/backoffice') return nivelAcesso?.toLowerCase() !== 'user';
    if (item.path === '/configuracoes') return true; // Habilitado para visualização e testes de todos os usuários
    return true;
  });

  return (
    <aside className={`app-sidebar ${showCompact ? 'app-sidebar--compact' : ''}`}>
      <div className="app-sidebar__profile">
        {/* Identidade Amigos da Casa no Topo */}
        <div style={{ 
          padding: showCompact ? '8px 0' : '8px 10px 18px 10px', 
          borderBottom: '1px solid #e2e8f0', 
          marginBottom: '15px', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {showCompact ? (
            <img src={LogoAmigosDaCasaVertical} alt="Amigos da Casa" style={{ height: '36px', objectFit: 'contain' }} />
          ) : (
            <img src={LogoAmigosDaCasaHorizontal} alt="Amigos da Casa" style={{ height: '42px', objectFit: 'contain' }} />
          )}
        </div>

        <div className="app-sidebar__user">
          <Avatar
            size={showCompact ? 48 : 46}
            className="app-sidebar__avatar"
          >
            {getInitials(userName)}
          </Avatar>

          {!showCompact && (
            <div className="app-sidebar__user-copy">
              <span>{'Olá,'}</span>
              <strong>{getFirstAndLastName(userName)}</strong>
            </div>
          )}
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label={'Navegação principal'}>
        {visibleItems.map((item) => {
          const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/venda');
          const link = (
            <Link
              key={item.path}
              to={item.path}
              className={`app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="app-sidebar__icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              {!showCompact && <span className="app-sidebar__label">{item.label}</span>}
            </Link>
          );

          return showCompact ? (
            <Tooltip key={item.path} placement="right" title={item.label}>
              {link}
            </Tooltip>
          ) : link;
        })}
      </nav>

      {/* Rodapé Institucional com a Casa de Saúde */}
      <div style={{ flexGrow: 1 }} />
      
      <div style={{ 
        borderTop: '1px solid #e2e8f0', 
        paddingTop: '20px', 
        marginTop: '20px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {!showCompact ? (
          <>
            <span style={{ 
              fontSize: '10px', 
              color: '#94a3b8', 
              display: 'block', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              marginBottom: '8px' 
            }}>
              Uma iniciativa de
            </span>
            <img 
              src={LogoCasaHorizontalColor} 
              alt="Casa de Saúde Menino Jesus de Praga" 
              style={{ width: '100%', maxHeight: '42px', objectFit: 'contain' }} 
            />
          </>
        ) : (
          <Tooltip title="Casa de Saúde Menino Jesus de Praga" placement="right">
            <img 
              src={LogoCasaVerticalColor} 
              alt="Casa de Saúde Logo" 
              style={{ height: '36px', width: '36px', objectFit: 'contain' }} 
            />
          </Tooltip>
        )}
      </div>
    </aside>
  );
};

const Template = (props) => {
  const { logoutUser, rootState } = useContext(MyContext);
  const { theUser } = rootState;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = props;
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(true);
      return;
    }
    setCollapsed((current) => !current);
  };

  return (
    <Layout className="app-shell">
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          collapsedWidth={92}
          className="app-sider"
        >
          <SidebarContent
            collapsed={collapsed}
            currentPath={location.pathname}
            userName={theUser.nome}
            nivelAcesso={theUser.nivel_acesso}
          />
        </Sider>
      )}

      <Drawer
        placement="left"
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={320}
        closeIcon={null}
        rootClassName="app-sidebar-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <div className="app-sidebar-drawer__top">
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faXmark} />}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          />
        </div>
        <SidebarContent
          collapsed={false}
          currentPath={location.pathname}
          userName={theUser.nome}
          nivelAcesso={theUser.nivel_acesso}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </Drawer>

      <Layout className="app-main">
        <Header className="app-header">
          <Button
            type="text"
            icon={
              isMobile ? (
                <FontAwesomeIcon icon={faBars} />
              ) : collapsed ? (
                <FontAwesomeIcon icon={faChevronRight} />
              ) : (
                <FontAwesomeIcon icon={faChevronLeft} />
              )
            }
            onClick={toggleSidebar}
            className="app-header__toggle"
            aria-label={isMobile ? 'Abrir menu' : 'Alternar sidebar'}
          />

          <img src={LogoBazarHorizontal} alt="Bazar Amigos da Casa" className="app-header__logo" style={{ maxHeight: '54px', objectFit: 'contain' }} />

          <Button
            onClick={logoutUser}
            color="primary"
            variant="ghost"
            className="app-header__logout"
            style={{ color: theme.token.colorPrimary }}
          >
            Sair
          </Button>
        </Header>

        <Content className="app-content">
          <Routes>
            <Route path="venda" element={<Venda theme={theme} />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="estoque" element={<Estoque theme={theme} />} />
            <Route path="transacoes" element={<Transacoes theme={theme} />} />
            <Route path="backoffice" element={<Backoffice theme={theme} />} />
            <Route path="perfil" element={<Perfil theme={theme} />} />
            <Route path="configuracoes" element={<Configuracoes theme={theme} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Template;
