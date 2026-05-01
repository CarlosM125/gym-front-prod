import { useEffect, useState } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { Edit2, X, Search } from 'lucide-react';

export default function ClientListScreen() {
    const { customers, fetchCustomers, isLoading, updateCustomer } = useCustomerStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'EXPIRING_TODAY'>('ALL');

    // Edit Modal State
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editDoc, setEditDoc] = useState('');
    const [editEmail, setEditEmail] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filteredCustomers = customers
        .filter(c => c != null)  // guard against null/undefined entries from API
        .filter(c => {
            const matchesSearch = (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (c.documentId || '').includes(searchTerm);
            
            if (!matchesSearch) return false;

            const today = new Date().toISOString().split('T')[0];

            switch (filterStatus) {
                case 'ACTIVE': return c.membershipStatus === 'ACTIVE';
                case 'EXPIRED': return c.membershipStatus === 'EXPIRED' || !c.membershipStatus;
                case 'EXPIRING_TODAY': return c.currentEndDate === today;
                default: return true;
            }
        });

    const handleEditClick = (c: any) => {
        setEditingCustomer(c);
        setEditName(c.fullName);
        setEditDoc(c.documentId);
        setEditEmail(c.email || '');
    };

    const handleSaveEdit = async () => {
        if (!editingCustomer) return;
        if (!editName || !editDoc) return alert("Nombre y Cédula son obligatorios");

        const success = await updateCustomer(editingCustomer.id, {
            fullName: editName,
            documentId: editDoc,
            email: editEmail
        });
        
        if (success) {
            setEditingCustomer(null);
            alert("Cliente actualizado exitosamente");
        }
    };

    return (
        <div>
            <h1 className="page-title">Todos los Clientes</h1>
            <p className="page-subtitle">{customers.length} clientes registrados</p>

            <div className="flex-between" style={{marginBottom: '20px', flexWrap: 'wrap', gap: '1rem'}}>
                <div style={{position: 'relative', flex: 1, minWidth: '300px'}}>
                    <Search size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                    <input 
                        className="form-input" 
                        style={{paddingLeft: '40px', margin:0}}
                        placeholder="Buscar por nombre o email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{display: 'flex', gap: '8px', overflowX: 'auto'}}>
                    <button className={filterStatus === 'ALL' ? 'btn-primary' : 'btn-outline'} style={filterStatus === 'ALL' ? {backgroundColor: '#000'} : {}} onClick={() => setFilterStatus('ALL')}>Todas</button>
                    <button className={filterStatus === 'ACTIVE' ? 'btn-primary' : 'btn-outline'} onClick={() => setFilterStatus('ACTIVE')}>Activas</button>
                    <button className={filterStatus === 'EXPIRING_TODAY' ? 'btn-primary' : 'btn-outline'} onClick={() => setFilterStatus('EXPIRING_TODAY')}>Vencen Hoy</button>
                    <button className={filterStatus === 'EXPIRED' ? 'btn-primary' : 'btn-outline'} onClick={() => setFilterStatus('EXPIRED')}>Vencidas</button>
                </div>
            </div>
            
            {isLoading ? <p>Cargando red...</p> : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Foto</th>
                                <th>Nombre</th>
                                <th>Cédula</th>
                                <th>Membresía</th>
                                <th>F. Inicio</th>
                                <th>F. Caduca</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{textAlign: 'center'}} className="text-muted">No se encontraron clientes</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <img 
                                                src={c?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c?.fullName || 'Cliente')}&background=d62020&color=fff`} 
                                                alt={c?.fullName || 'Cliente'} 
                                                className="client-avatar"
                                                style={{margin:0, width:'40px', height:'40px'}}
                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=C&background=d62020&color=fff`; }}
                                            />
                                        </td>
                                        <td style={{fontWeight: '500'}}>{c?.fullName || '—'}</td>
                                        <td className="text-muted">{c?.documentId || '—'}</td>
                                        <td><span className="badge dark">{c?.currentPlanName || 'Ninguna'}</span></td>
                                        <td className="text-muted">{c?.currentStartDate || '—'}</td>
                                        <td className="text-muted">{c?.currentEndDate || '—'}</td>
                                        <td>
                                            <span className={`badge ${c?.membershipStatus === 'ACTIVE' ? 'success' : 'danger'}`}>
                                                {c?.membershipStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-outline" style={{padding: '6px 10px'}} onClick={() => handleEditClick(c)}>
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Edición */}
            {editingCustomer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{width: '90%', maxWidth: '400px', margin: 0}}>
                        <div className="flex-between" style={{marginBottom: '16px'}}>
                            <h3 style={{margin: 0}}>Editar Cliente</h3>
                            <button className="btn-outline" style={{border: 'none', padding: '4px'}} onClick={() => setEditingCustomer(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem'}}>Nombre Completo *</label>
                        <input className="form-input" value={editName} onChange={e=>setEditName(e.target.value)} />
                        
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem'}}>Cédula / Documento *</label>
                        <input className="form-input" value={editDoc} onChange={e=>setEditDoc(e.target.value)} />
                        
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem'}}>Email (Opcional)</label>
                        <input className="form-input" value={editEmail} onChange={e=>setEditEmail(e.target.value)} />

                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px'}}>
                            <button className="btn-outline" onClick={() => setEditingCustomer(null)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSaveEdit}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
