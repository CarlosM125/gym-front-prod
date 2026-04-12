import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMembershipStore } from '../store/membershipStore';
import { AlertCircle } from 'lucide-react';

export default function DashboardScreen() {
    const { user } = useAuthStore();
    const { expiringToday, fetchExpiringToday, isLoading } = useMembershipStore();

    useEffect(() => {
        fetchExpiringToday();
    }, [fetchExpiringToday]);

    return (
        <div>
            <header className="page-header">
                <h1>Panel Principal</h1>
                <p className="subtitle">Bienvenido, {user?.fullName} ({user?.role})</p>
            </header>

            <div className="dashboard-grid layout-3-col">
                <div className="glass-panel stat-card alert-card">
                    <h3 className="flex-title"><AlertCircle color="#ff7b72" /> Caducan Hoy</h3>
                    {isLoading ? <p>Cargando...</p> : 
                        expiringToday.length === 0 ? (
                            <p className="text-muted">Ninguna membresía vence hoy.</p>
                        ) : (
                            <ul className="branch-list">
                                {expiringToday.map(mem => (
                                    <li key={mem.id}>
                                        <strong>{mem.userFullName}</strong><br/>
                                        <small>CC: {mem.documentId} | {mem.endDate}</small>
                                    </li>
                                ))}
                            </ul>
                        )
                    }
                </div>
                <div className="glass-panel stat-card" style={{gridColumn: 'span 2'}}>
                    <h3>Accesos Rápidos</h3>
                    <p className="text-muted">Utiliza el menú lateral para navegar por las herramientas del sistema. Todas las acciones registran auditoría interna.</p>
                </div>
            </div>
        </div>
    );
}
