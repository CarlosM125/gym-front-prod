import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { Users } from 'lucide-react';

export default function ClientListScreen() {
    const { users, fetchUsers, isLoading } = useUserStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <div>
            <header className="page-header">
                <h1>Directorio de Clientes</h1>
                <p className="subtitle">Exploración total de usuarios registrados</p>
            </header>

            <div className="glass-panel" style={{margin: 'auto'}}>
                <h2 className="flex-title" style={{color: 'var(--primary-color)'}}><Users /> Buscar Clientes</h2>
                
                {isLoading ? <p>Cargando red...</p> : (
                    <div className="clients-grid">
                        {users.map(u => (
                            <div className="client-card" key={u.id}>
                                <img 
                                    src={u.profileImageUrl || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"} 
                                    alt={u.fullName} 
                                    className="client-avatar"
                                    onError={(e) => { e.currentTarget.src = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" }} 
                                />
                                <h3 style={{margin: '0.5rem 0', color: 'var(--text-primary)'}}>{u.fullName}</h3>
                                <p className="text-muted" style={{margin: '0', fontSize: '0.9rem'}}>CC: {u.documentId}</p>
                                <p style={{margin: '0', color: 'var(--primary-color)', fontWeight: 'bold'}}>PIN ZKT: {u.pinZkteco}</p>
                            </div>
                        ))}
                        {users.length === 0 && <p>No existen perfiles en el sistema.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
