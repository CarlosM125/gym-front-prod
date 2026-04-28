import { useEffect } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gymLogo from '../assets/logo gym.jpeg';

export default function DashboardScreen() {
    const { user } = useAuthStore();
    const { expiringToday, fetchExpiringToday } = useMembershipStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) fetchExpiringToday();
    }, [user, fetchExpiringToday]);

    const handleRenewClick = (documentId: string) => {
        navigate(`/pos?doc=${documentId}`);
    };

    return (
        <div>
            <h1 className="page-title">Vencimientos Hoy</h1>
            <p className="page-subtitle">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <div className="alert-banner">
                <AlertCircle size={20} />
                <span>{expiringToday.length} membresías vencen hoy</span>
            </div>

            <div className="dashboard-list">
                {expiringToday.length === 0 ? (
                    <p className="text-muted">No hay vencimientos reportados para hoy.</p>
                ) : (
                    expiringToday.map((item: any) => (
                        <div key={item.id} className="card dashboard-item flex-between" style={{flexWrap: 'wrap'}}>
                            <div style={{display: 'flex', alignItems: 'center', minWidth: '250px'}}>
                                <img 
                                    src={item.user.profileImageUrl || gymLogo} 
                                    alt="Client" 
                                    className="client-avatar" 
                                />
                                <div>
                                    <h3 style={{margin: '0 0 4px 0', fontSize: '1rem'}}>{item.user.fullName}</h3>
                                    <span className="badge dark">{item.membershipPlan.name}</span>
                                </div>
                            </div>
                            
                            <div style={{flex: 1, display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center'}}>
                                <div className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}>
                                    <Mail size={16} /> {item.user.email}
                                </div>
                                <div className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}>
                                    <Phone size={16} /> CC: {item.user.documentId}
                                </div>
                            </div>

                            <div style={{textAlign: 'right', minWidth: '150px'}}>
                                <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>${item.membershipPlan.priceAmount}</div>
                                <div className="text-muted" style={{fontSize: '0.8rem', marginBottom: '8px'}}>Mensual</div>
                                <button className="btn-primary" onClick={() => handleRenewClick(item.user.documentId)}>
                                    Renovar Ahora
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
