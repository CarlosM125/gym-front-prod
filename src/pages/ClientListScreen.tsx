import { useEffect, useState, useRef } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { Edit2, X, Search, Upload } from 'lucide-react';
import { apiClient } from '../api/client';

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
    
    const { updateMembershipStartDate } = useMembershipStore();

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
            const formData = new FormData();
            formData.append("file", selectedImage);
            try {
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

                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px'}}>
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
            )}
        </div>
    );
}
