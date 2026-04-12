import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function MasterLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <nav className="glass-panel navbar">
                <div className="logo">GymOS Pro</div>
                <div className="nav-links">
                    <Link to="/dashboard">Panel Principal</Link>
                    <Link to="/pos">Cobro P.O.S</Link>
                    <Link to="/clients/new">Registro (+)</Link>
                    <Link to="/clients">Directorio</Link>
                    {user?.role === 'ADMIN_TI' || user?.role === 'ADMIN_GYM' ? (
                        <Link to="/analytics">Finanzas</Link>
                    ) : null}
                    <button onClick={handleLogout} className="logout-btn">Salir</button>
                </div>
            </nav>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
