import { useState, useRef, useEffect } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { useBranchStore } from '../store/branchStore';
import { useMembershipStore } from '../store/membershipStore';
import { Upload, User, Mail } from 'lucide-react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function ClientRegistryScreen() {
    const { registerCustomer } = useCustomerStore();
    const { branches, fetchBranches } = useBranchStore();
    const { plans, fetchPlans, isLoading } = useMembershipStore();
    const navigate = useNavigate();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [docId, setDocId] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [branchId, setBranchId] = useState("");
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

    useEffect(() => {
        fetchBranches();
        fetchPlans();
    }, [fetchBranches, fetchPlans]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRegister = async () => {
        if (!docId || !fullName || !branchId || !selectedPlanId) return alert("LLene Documento, Nombre, Sucursal, y seleccione un Tipo de Membresía");
        
        let finalImageUrl = "";
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
            }
        }

        const success = await registerCustomer({
            documentId: docId, 
            fullName, 
            email, 
            homeBranchId: Number(branchId),
            profileImageUrl: finalImageUrl || undefined
        });

        if (success) {
            alert("Cliente Registrado Físicamente ¡Felicidades!");
            navigate('/clients');
        }
    };

    return (
        <div>
            <h1 className="page-title">Nueva Membresía</h1>
            <p className="page-subtitle">Registra un nuevo cliente</p>

            <div className="grid-cols-2">
                <div>
                    <h3 style={{marginBottom: '10px'}}>Datos del Cliente</h3>
                    
                    <div className="card" style={{textAlign: 'center', marginBottom: '20px', cursor: 'pointer'}} onClick={() => fileInputRef.current?.click()}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover'}} />
                        ) : (
                            <div style={{padding: '20px', border: '2px dashed var(--border-color)', borderRadius: '8px'}}>
                                <Upload size={32} style={{margin: '0 auto 10px', color: 'var(--text-muted)', display: 'block'}} />
                                <span className="text-muted">Click para subir imagen</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div style={{position: 'relative'}}>
                        <User size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input className="form-input" style={{paddingLeft: '40px'}} placeholder="Nombre Completo" value={fullName} onChange={e=>setFullName(e.target.value)} />
                    </div>

                    <div style={{position: 'relative'}}>
                        <User size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input className="form-input" style={{paddingLeft: '40px'}} placeholder="Documento (Cédula)" value={docId} onChange={e=>setDocId(e.target.value)} />
                    </div>

                    <div style={{position: 'relative'}}>
                        <Mail size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input className="form-input" style={{paddingLeft: '40px'}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                    </div>

                    <select className="form-input" value={branchId} onChange={e=>setBranchId(e.target.value)}>
                        <option value="" disabled>Seleccione Su Sucursal Base</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div>
                    <h3 style={{marginBottom: '10px'}}>Tipo de Membresía</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {plans.map(p => (
                            <div 
                                key={p.id} 
                                className="card flex-between" 
                                style={{
                                    border: selectedPlanId === p.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    margin: 0
                                }}
                                onClick={() => setSelectedPlanId(p.id)}
                            >
                                <div>
                                    <h4 style={{margin: '0 0 4px 0'}}>{p.name}</h4>
                                    <span className="text-muted" style={{fontSize: '0.85rem'}}>{p.durationDays} días</span>
                                </div>
                                <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>${p.priceAmount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px'}}>
                <button className="btn-outline" onClick={() => navigate('/dashboard')}>Cancelar</button>
                <button className="btn-primary" onClick={handleRegister} disabled={isLoading}>
                    {isLoading ? 'Guardando...' : 'Crear Membresía'}
                </button>
            </div>
        </div>
    );
}
