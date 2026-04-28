import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, RefreshCw, UserPlus, Users, BarChart2, LogOut, Menu, Settings } from 'lucide-react';
import gymLogo from '../../assets/logo gym.jpeg';

export default function MasterLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeMobileMenu = () => setMobileOpen(false);

    return (
        <div className="layout-wrapper">
            {/* Mobile Toggle Button */}
            <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                <Menu size={24} />
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img 
                        src={gymLogo} 
                        alt="Friends Fitness Logo" 
                        className="sidebar-logo"
                    />
                    <p className="sidebar-subtitle">Sistema de Membresías</p>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/dashboard" onClick={closeMobileMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Home size={20} /> Vencimientos Hoy
                    </NavLink>
                    <NavLink to="/pos" onClick={closeMobileMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <RefreshCw size={20} /> Renovar Membresía
                    </NavLink>
                    <NavLink to="/clients/new" onClick={closeMobileMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <UserPlus size={20} /> Nueva Membresía
                    </NavLink>
                    <NavLink to="/clients" end onClick={closeMobileMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} /> Todos los Clientes
                    </NavLink>
                    
                    {(user?.role === 'ADMIN_TI' || user?.role === 'ADMIN_GYM') && (
                        <>
                            <NavLink to="/analytics" onClick={closeMobileMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <BarChart2 size={20} /> Análisis Financiero
                            </NavLink>
                            <NavLink to="/admin" onClick={closeMobileMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Settings size={20} /> Ajustes / Admin
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-link">
                        <LogOut size={20} /> Salir
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {mobileOpen && (
                <div 
                    style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.5)', zIndex: 900}} 
                    onClick={closeMobileMenu}
                />
            )}

            {/* Content Area */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
