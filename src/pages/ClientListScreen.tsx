import { useEffect, useState } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { Search } from 'lucide-react';

export default function ClientListScreen() {
    const { customers, fetchCustomers, isLoading } = useCustomerStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filteredCustomers = customers.filter(c => 
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.documentId || '').includes(searchTerm)
    );

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
                    <button className="btn-primary" style={{backgroundColor: '#000'}}>Todas</button>
                    <button className="btn-outline">Activas</button>
                    <button className="btn-outline">Vencen Hoy</button>
                    <button className="btn-outline">Vencidas</button>
                </div>
            </div>
            
            {isLoading ? <p>Cargando red...</p> : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Foto</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono/CC</th>
                                <th>Membresía</th>
                                <th>PIN / ID</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{textAlign: 'center'}} className="text-muted">No se encontraron clientes</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <img 
                                                src={c.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName)}&background=d62020&color=fff`} 
                                                alt={c.fullName} 
                                                className="client-avatar"
                                                style={{margin:0, width:'40px', height:'40px'}}
                                            />
                                        </td>
                                        <td style={{fontWeight: '500'}}>{c.fullName}</td>
                                        <td className="text-muted">{c.email || '—'}</td>
                                        <td className="text-muted">{c.documentId}</td>
                                        <td><span className="badge dark">Estándar</span></td>
                                        <td>{c.pinZkteco}</td>
                                        <td>
                                            <span className={`badge ${c.status === 'ACTIVE' ? 'success' : 'danger'}`}>
                                                {c.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
