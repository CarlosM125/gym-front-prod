import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function LoginScreen() {
    const { login, isLoading, error } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        const success = await login(username, password);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="login-container">
            <div className="glass-panel action-panel login-box">
                <h2>GymOS Login</h2>
                {error && <div className="error-banner">{error}</div>}
                <div className="form-group vertical-flex">
                    <input 
                        className="glass-input full-w" 
                        placeholder="Admin / Employee ID" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                    <input 
                        className="glass-input full-w" 
                        type="password"
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button onClick={handleLogin} disabled={isLoading || !username || !password}>
                        {isLoading ? 'Verifying...' : 'Acceder'}
                    </button>
                    <p className="text-muted" style={{marginTop: '1rem', fontSize: '12px'}}>
                        For setup use credentials: admin / admin123
                    </p>
                </div>
            </div>
        </div>
    );
}
