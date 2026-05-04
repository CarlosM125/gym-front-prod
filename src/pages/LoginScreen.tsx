import { useState, KeyboardEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import gymLogo from '../assets/logo gym.jpeg';

export default function LoginScreen() {
    const { login, isLoading, error } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        const success = await login(username, password);
        if (success) navigate('/dashboard');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && username && password) handleLogin();
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* Logo + encabezado */}
                <div className="login-header">
                    <img src={gymLogo} alt="Friends Fitness" className="login-logo" />
                    <h1 className="login-title">Friends Fitness</h1>
                    <p className="login-subtitle">Sistema de Gestión</p>
                </div>

                {/* Error */}
                {error && <div className="login-error">{error}</div>}

                {/* Usuario */}
                <div className="login-input-wrap">
                    <span className="login-input-icon"><User size={18} /></span>
                    <input
                        id="login-username"
                        type="text"
                        placeholder="Usuario"
                        autoComplete="username"
                        className="login-input"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Contraseña */}
                <div className="login-input-wrap last">
                    <span className="login-input-icon"><Lock size={18} /></span>
                    <input
                        id="login-password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Contraseña"
                        autoComplete="current-password"
                        className="login-input has-toggle"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        className="login-toggle-btn"
                        onClick={() => setShowPass(p => !p)}
                        tabIndex={-1}
                    >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* Botón de acceso */}
                <button
                    className="login-btn"
                    onClick={handleLogin}
                    disabled={isLoading || !username || !password}
                >
                    {isLoading ? 'Verificando...' : 'Ingresar'}
                </button>

                <p className="login-footer">
                    © {new Date().getFullYear()} Friends Fitness ERP
                </p>
            </div>
        </div>
    );
}
