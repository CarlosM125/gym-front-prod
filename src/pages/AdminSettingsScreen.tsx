import { useState, useEffect } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { Shield, Plus } from 'lucide-react';
import { apiClient } from '../api/client';

export default function AdminSettingsScreen() {
    const { plans, fetchPlans } = useMembershipStore();
    const [activeTab, setActiveTab] = useState<'PLANS' | 'ACCOUNTS'>('PLANS');

    // System Accounts State
    const [accounts, setAccounts] = useState<any[]>([]);
    
    // New Account Form
    const [newAccUsername, setNewAccUsername] = useState('');
    const [newAccPassword, setNewAccPassword] = useState('');
    const [newAccRole, setNewAccRole] = useState('EMPLOYEE');
    const [newAccFirstName, setNewAccFirstName] = useState('');

    // New Plan Form
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDuration, setNewPlanDuration] = useState('');
    const [newPlanPrice, setNewPlanPrice] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');
    const [newPlanIsPromo, setNewPlanIsPromo] = useState(false);

    useEffect(() => {
        fetchPlans();
        fetchAccounts();
    }, [fetchPlans]);

    const fetchAccounts = async () => {
        try {
            const res = await apiClient.get('/users');
            if (res.data.success) {
                setAccounts(res.data.data);
            }
        } catch (e) {
            console.error("Error fetching accounts", e);
        }
    };

    const handleCreateAccount = async () => {
        if (!newAccUsername || !newAccPassword) return alert("Usuario y contraseña obligatorios");
        try {
            await apiClient.post('/users', {
                username: newAccUsername,
                password: newAccPassword,
                role: newAccRole,
                firstName: newAccFirstName,
                lastName: ''
            });
            alert("Empleado creado.");
            setNewAccUsername('');
            setNewAccPassword('');
            setNewAccFirstName('');
            fetchAccounts();
        } catch (e) {
            alert("Error al crear cuenta.");
        }
    };

    const handleDeleteAccount = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este acceso al sistema?")) {
            try {
                await apiClient.delete(`/users/${id}`);
                fetchAccounts();
            } catch (e) {
                alert("No se pudo eliminar.");
            }
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName || !newPlanDuration || !newPlanPrice) return alert("Nombre, Duración y Precio son obligatorios");
        try {
            await apiClient.post('/memberships/plans', {
                name: newPlanName,
                durationMonths: Number(newPlanDuration),
                priceAmount: Number(newPlanPrice),
                description: newPlanDescription,
                isPromotion: newPlanIsPromo
            });
            alert("Plan creado exitosamente.");
            setNewPlanName('');
            setNewPlanDuration('');
            setNewPlanPrice('');
            setNewPlanDescription('');
            setNewPlanIsPromo(false);
            fetchPlans();
        } catch (e) {
            alert("Error al crear el plan.");
        }
    };

    return (
        <div>
            <div className="flex-between" style={{marginBottom: '24px'}}>
                <div>
                    <h1 className="page-title">Configuración del Sistema</h1>
                    <p className="page-subtitle">Modifica la lógica financiera y personal del ERP</p>
                </div>
            </div>

            <div style={{display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)'}}>
                <button 
                    className={`btn-outline ${activeTab === 'PLANS' ? 'active-tab' : ''}`}
                    style={{borderBottom: activeTab === 'PLANS' ? '2px solid var(--primary-color)' : 'none', borderRadius: 0, border: 'none'}}
                    onClick={() => setActiveTab('PLANS')}
                >
                    Planes de Membresía
                </button>
                <button 
                    className={`btn-outline ${activeTab === 'ACCOUNTS' ? 'active-tab' : ''}`}
                    style={{borderBottom: activeTab === 'ACCOUNTS' ? '2px solid var(--primary-color)' : 'none', borderRadius: 0, border: 'none'}}
                    onClick={() => setActiveTab('ACCOUNTS')}
                >
                    Cuentas de Empleado
                </button>
            </div>

            {activeTab === 'PLANS' && (
                <div className="grid-cols-2">
                    <div className="card">
                        <h3 style={{marginTop: 0, marginBottom: '16px'}}>Crear Nuevo Plan</h3>
                        <input className="form-input" placeholder="Nombre del Plan (Ej. Mensualidad)" value={newPlanName} onChange={e=>setNewPlanName(e.target.value)} />
                        <input className="form-input" placeholder="Descripción breve" value={newPlanDescription} onChange={e=>setNewPlanDescription(e.target.value)} />
                        <input className="form-input" type="number" placeholder="Duración en Meses (Ej. 1)" value={newPlanDuration} onChange={e=>setNewPlanDuration(e.target.value)} />
                        <input className="form-input" type="number" placeholder="Precio Base (Ej. 35.00)" value={newPlanPrice} onChange={e=>setNewPlanPrice(e.target.value)} />
                        <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                            <input type="checkbox" checked={newPlanIsPromo} onChange={e=>setNewPlanIsPromo(e.target.checked)} />
                            ¿Es una promoción?
                        </label>
                        <button className="btn-primary" style={{width: '100%'}} onClick={handleCreatePlan}>
                            <Plus size={16} style={{marginRight: '8px'}} /> Registrar Plan
                        </button>
                    </div>

                    <div className="card">
                        <h3 style={{marginTop: 0, marginBottom: '16px'}}>Membresías Vigentes</h3>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nombre del Plan</th>
                                        <th>Duración / Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div style={{fontWeight: '500'}}>{p.name}</div>
                                                <span className={`badge ${p.isPromotion ? 'danger' : 'dark'}`} style={{marginTop: '4px'}}>
                                                    {p.isPromotion ? 'Promoción' : 'Estándar'}
                                                </span>
                                            </td>
                                            <td>
                                                <div>{p.durationMonths} {p.durationMonths === 1 ? 'mes' : 'meses'}</div>
                                                <div style={{color: 'green', fontWeight: 'bold'}}>${p.priceAmount}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ACCOUNTS' && (
                <div className="grid-cols-2">
                    <div className="card">
                        <h3 style={{marginTop: 0, marginBottom: '16px'}}>Crear Nuevo Acceso</h3>
                        <input className="form-input" placeholder="Nombre Real del Empleado" value={newAccFirstName} onChange={e=>setNewAccFirstName(e.target.value)} />
                        <input className="form-input" placeholder="Nombre de Usuario (Login)" value={newAccUsername} onChange={e=>setNewAccUsername(e.target.value)} />
                        <input className="form-input" type="password" placeholder="Contraseña Temporal" value={newAccPassword} onChange={e=>setNewAccPassword(e.target.value)} />
                        <select className="form-input" value={newAccRole} onChange={e=>setNewAccRole(e.target.value)}>
                            <option value="EMPLOYEE">Recepcionista Estándar</option>
                            <option value="ADMIN_GYM">Gerente Administrativo</option>
                        </select>
                        <button className="btn-primary" style={{width: '100%'}} onClick={handleCreateAccount}>
                            Registrar Credenciales <Shield size={16} style={{marginLeft: '8px'}}/>
                        </button>
                    </div>

                    <div className="card">
                        <h3 style={{marginTop: 0, marginBottom: '16px'}}>Accesos Existentes</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex-between" style={{padding: '12px', border: '1px solid var(--border-color)', borderRadius: '4px'}}>
                                    <div>
                                        <h4 style={{margin: '0 0 4px 0'}}>{acc.username}</h4>
                                        <span className="text-muted" style={{fontSize: '0.85rem'}}>{acc.role} - {acc.firstName}</span>
                                    </div>
                                    {acc.role !== 'ADMIN_TI' && (
                                        <button className="btn-outline" style={{borderColor: 'red', color: 'red'}} onClick={() => handleDeleteAccount(acc.id)}>
                                            Revocar
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
