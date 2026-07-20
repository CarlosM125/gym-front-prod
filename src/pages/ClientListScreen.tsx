import { useEffect, useState, useRef } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { useMembershipStore } from '../store/membershipStore';
import { Edit2, X, Search, Upload, Trash2, Eye } from 'lucide-react';
import { apiClient } from '../api/client';
import { compressImage } from '../utils/imageCompressor';

export default function ClientListScreen() {
    const { customers, fetchCustomers, isLoading, updateCustomer } = useCustomerStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'EXPIRING_TODAY'>('ALL');

    // Edit Modal State
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editDoc, setEditDoc] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // History Modal State
    const [historyCustomer, setHistoryCustomer] = useState<any>(null);
    const [customerHistory, setCustomerHistory] = useState<any[] | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const { updateMembershipStartDate, fetchCustomerHistory } = useMembershipStore();

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
        setEditStartDate(c.currentStartDate || '');
        setImagePreview(c.profileImageUrl || null);
        setSelectedImage(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleViewHistory = async (c: any) => {
        setHistoryCustomer(c);
        setIsHistoryLoading(true);
        const history = await fetchCustomerHistory(c.id);
        setCustomerHistory(history || []);
        setIsHistoryLoading(false);
    };

    const handleSaveEdit = async () => {
        if (!editingCustomer) return;
        if (!editName || !editDoc) return alert("Nombre y Cédula son obligatorios");

        // Check if anything actually changed
        const hasDataChanged = 
            editName !== editingCustomer.fullName ||
            editDoc !== editingCustomer.documentId ||
            editEmail !== (editingCustomer.email || '');
            
        const hasDateChanged = editStartDate !== (editingCustomer.currentStartDate || '');
        const hasImageChanged = selectedImage !== null;

        if (!hasDataChanged && !hasDateChanged && !hasImageChanged) {
            return setEditingCustomer(null); // No changes made
        }

        setIsSaving(true);
        let finalImageUrl = editingCustomer.profileImageUrl;

        if (selectedImage) {
            try {
                // Resize to max 400px and 60% quality to save Cloudinary space
                const compressedImage = await compressImage(selectedImage, 400, 0.6);
                const formData = new FormData();
                formData.append("file", compressedImage);
                const imgRes = await apiClient.post<{success: boolean, data: {url: string}}>("/users/upload-image", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (imgRes.data.success) {
                    finalImageUrl = imgRes.data.data.url;
                }
            } catch (e) {
                console.error("Backend image upload error", e);
                alert("Error al subir foto de perfil");
                setIsSaving(false);
                return; 
            }
        }

        let customerUpdated = true;
        if (hasDataChanged || hasImageChanged) {
            customerUpdated = await updateCustomer(editingCustomer.id, {
                fullName: editName,
                documentId: editDoc,
                email: editEmail,
                profileImageUrl: finalImageUrl || undefined
            });
        }

        let dateUpdated = true;
        if (hasDateChanged && editingCustomer.membershipStatus === 'ACTIVE') {
            dateUpdated = await updateMembershipStartDate(editingCustomer.id, editStartDate);
        }
        
        setIsSaving(false);

        if (customerUpdated && dateUpdated) {
            setEditingCustomer(null);
            alert("Actualizado exitosamente");
            fetchCustomers(); // Refresh to get recalculated end dates
        } else {
            alert("Hubo un problema al actualizar algunos datos.");
        }
    };

    const handleDeleteCustomer = async () => {
        if (!editingCustomer) return;
        if (confirm("¿Estás seguro de ELIMINAR este cliente?\nEsta acción anonimizará sus datos y borrará su foto para cumplir con la ley de protección de datos. Es irreversible.")) {
            setIsSaving(true);
            try {
                const res = await apiClient.delete(`/customers/${editingCustomer.id}`);
                if (res.data.success) {
                    alert("Cliente eliminado exitosamente según la LOPDP.");
                    setEditingCustomer(null);
                    fetchCustomers();
                }
            } catch (e) {
                console.error(e);
                alert("Hubo un error al eliminar el cliente.");
            }
            setIsSaving(false);
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
                                        <td style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-outline" style={{padding: '6px 10px'}} onClick={() => handleViewHistory(c)} title="Ver Historial">
                                                <Eye size={16} />
                                            </button>
                                            <button className="btn-outline" style={{padding: '6px 10px'}} onClick={() => handleEditClick(c)} title="Editar">
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

                        <div style={{textAlign: 'center', marginBottom: '20px', cursor: 'pointer'}} onClick={() => fileInputRef.current?.click()}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)'}} />
                            ) : (
                                <div style={{width: '100px', height: '100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '50%'}}>
                                    <Upload size={24} style={{color: 'var(--text-muted)', marginBottom: '4px'}} />
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageChange} />
                            <div style={{fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '8px', fontWeight: 500}}>Cambiar Foto</div>
                        </div>
                        
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem'}}>Nombre Completo *</label>
                        <input className="form-input" value={editName} onChange={e=>setEditName(e.target.value)} />
                        
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem'}}>Cédula / Documento *</label>
                        <input className="form-input" value={editDoc} onChange={e=>setEditDoc(e.target.value)} disabled={isSaving} />
                        
                        <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem'}}>Email (Opcional)</label>
                        <input className="form-input" value={editEmail} onChange={e=>setEditEmail(e.target.value)} disabled={isSaving} />

                        {editingCustomer.membershipStatus === 'ACTIVE' && (
                            <>
                                <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--primary-color)'}}>
                                    Fecha Inicio (Membresía Activa)
                                </label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    style={{borderColor: 'var(--primary-color)'}}
                                    value={editStartDate} 
                                    onChange={e=>setEditStartDate(e.target.value)} 
                                    disabled={isSaving}
                                />
                                <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-10px', marginBottom: '16px'}}>
                                    * Cambiar la fecha de inicio recalculará automáticamente la fecha de caducidad.
                                </p>
                            </>
                        )}

                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)'}}>
                            <button 
                                className="btn-outline" 
                                style={{borderColor: 'red', color: 'red', padding: '8px 12px', fontSize: '0.85rem'}} 
                                onClick={handleDeleteCustomer} 
                                disabled={isSaving}
                            >
                                <Trash2 size={14} style={{display: 'inline', marginRight: '4px', verticalAlign: 'middle'}}/>
                                Eliminar (LOPDP)
                            </button>
                            
                            <div style={{display: 'flex', gap: '8px'}}>
                                <button className="btn-outline" onClick={() => setEditingCustomer(null)} disabled={isSaving}>Cancelar</button>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleSaveEdit} 
                                    disabled={isSaving || (!editName || !editDoc)}
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Historial */}
            {historyCustomer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{width: '90%', maxWidth: '500px', margin: 0, maxHeight: '80vh', display: 'flex', flexDirection: 'column'}}>
                        <div className="flex-between" style={{marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)'}}>
                            <div>
                                <h3 style={{margin: 0}}>Historial del Cliente</h3>
                                <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>{historyCustomer.fullName}</p>
                            </div>
                            <button className="btn-outline" style={{border: 'none', padding: '4px'}} onClick={() => setHistoryCustomer(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{overflowY: 'auto', flex: 1, paddingRight: '8px'}}>
                            {isHistoryLoading ? (
                                <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Cargando historial...</p>
                            ) : (
                                customerHistory && customerHistory.length > 0 ? (
                                    <div style={{position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)', margin: '10px 0 10px 10px'}}>
                                        {customerHistory.map((h, idx) => {
                                            const date = new Date(h.transactionDate);
                                            const formattedDate = date.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
                                            
                                            // Check for gaps (e.g. if previous transaction was > 40 days ago)
                                            let showGap = false;
                                            if (idx < customerHistory.length - 1) {
                                                const prevDate = new Date(customerHistory[idx+1].transactionDate);
                                                const diffTime = Math.abs(date.getTime() - prevDate.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                if (diffDays > 40) showGap = true; // More than 40 days implies a missed month/gap
                                            }

                                            return (
                                                <div key={idx} style={{position: 'relative', marginBottom: '24px'}}>
                                                    <div style={{
                                                        position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px',
                                                        borderRadius: '50%', backgroundColor: idx === 0 ? '#16a34a' : '#d62020', border: '2px solid white'
                                                    }}></div>
                                                    <div style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px'}}>
                                                        {formattedDate}
                                                    </div>
                                                    <div className="card" style={{margin: 0, padding: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)'}}>
                                                        <div className="flex-between">
                                                            <strong style={{color: 'var(--text-main)'}}>{h.planName}</strong>
                                                            <span style={{fontWeight: 600, color: '#16a34a'}}>${h.amountPaid}</span>
                                                        </div>
                                                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>
                                                            Sucursal: {h.branchName}
                                                        </div>
                                                    </div>
                                                    
                                                    {showGap && (
                                                        <div style={{
                                                            position: 'relative', 
                                                            padding: '24px 0 0 0',
                                                            color: 'var(--text-muted)',
                                                            fontSize: '0.8rem',
                                                            fontStyle: 'italic',
                                                            left: '-20px'
                                                        }}>
                                                            <div style={{position: 'absolute', left: '-5px', top: '16px', bottom: '0', borderLeft: '2px dashed var(--border-color)', height: '100%'}}></div>
                                                            <span style={{paddingLeft: '24px', opacity: 0.7}}>Período inactivo...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px'}}>No hay pagos registrados para este cliente.</p>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
