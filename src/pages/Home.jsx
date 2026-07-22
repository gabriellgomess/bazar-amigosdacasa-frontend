import { useContext, useEffect } from 'react'
import { MyContext } from '../contexts/MyContext'
import { useNavigate } from 'react-router-dom'

// Importing the Login & Register Component
import Login from '../components/Login'
import Register from '../components/Register'

function Home() {

    const { rootState, logoutUser } = useContext(MyContext);
    const { isAuth, theUser, showLogin } = rootState;

    // Hook from react-router-dom
    const navigate = useNavigate();

    useEffect(() => {
        // If user Logged in
        if (isAuth) {
            // Navigate to Dashboard
            navigate(`/venda`);
        }
    }, [isAuth, navigate]);

    // Showing Login Or Register Page According to the condition

    return (
        <div style={{height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {showLogin ? <Login /> : <Register />}

        </div>

    );


}

export default Home;
