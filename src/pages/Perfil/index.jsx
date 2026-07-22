import { Tabs } from 'antd';
import AddUser from '../../components/AddUser';
import Users from '../../components/Users';
const Perfil = () => {
    const { TabPane } = Tabs;
    return(
        <div>
            <h1>Perfil</h1>
            <Tabs defaultActiveKey="1">
                <TabPane tab="Adiciona usuário" key="1">
                    <AddUser />
                </TabPane>
                <TabPane tab="Lista de usuários" key="2">
                    <Users />
                </TabPane>
            </Tabs>
        </div>
    )

}

export default Perfil;