import { useState, useRef, useEffect } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { useBranchStore } from '../store/branchStore';
import { useMembershipStore } from '../store/membershipStore';
import { Upload, User, Mail, Calendar } from 'lucide-react';
import { apiClient } from '../api/client';
import { compressImage } from '../utils/imageCompressor';
import { useNavigate } from 'react-router-dom';

export default function ClientRegistryScreen() {
    const { registerCustomer } = useCustomerStore();
    const { branches, fetchBranches } = useBranchStore();
    const { plans, fetchPlans, isLoading, renewMembership } = useMembershipStore();
    const navigate = useNavigate();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [docId, setDocId] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [branchId, setBranchId] = useState("");
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [consentGiven, setConsentGiven] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!fullName || !docId || !branchId || !selectedPlanId) return alert("Nombre, Cédula, Sucursal y Plan son obligatorios");
        if (!consentGiven) return alert("Debe aceptar la política de privacidad");
        
        setIsSubmitting(true);
        const selectedPlan = plans.find(p => p.id === selectedPlanId);
        let finalImageUrl = "";
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
                setIsSubmitting(false);
                return;
            }
        }

        // 1. Registra al cliente
        const customer = await registerCustomer({
            documentId: docId || undefined, 
            fullName, 
            email: email || undefined, 
            homeBranchId: branchId ? Number(branchId) : undefined,
            profileImageUrl: finalImageUrl || undefined,
            consentGiven
        });

        if (customer) {
            // 2. Registra la membresía usando los datos de fecha y plan
            const memSuccess = await renewMembership({
                customerId: customer.id,
                documentId: docId || undefined,
                customerFullName: fullName,
                branchId: branchId ? Number(branchId) : undefined,
                planId: selectedPlanId,
                amountPaid: selectedPlan ? selectedPlan.priceAmount : 0,
                startDate: transactionDate
            });

            if (memSuccess) {
                alert("Cliente Registrado y Membresía Creada ¡Felicidades!");
                navigate('/clients');
            } else {
                alert("Cliente registrado, pero hubo un error creando la membresía.");
            }
        }
        setIsSubmitting(false);
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

                    <div style={{position: 'relative', marginBottom: '16px'}}>
                        <User size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input className="form-input" style={{paddingLeft: '40px', margin:0}} placeholder="Nombre Completo *" value={fullName} onChange={e=>setFullName(e.target.value)} required />
                    </div>

                    <div style={{position: 'relative', marginBottom: '16px'}}>
                        <User size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input className="form-input" style={{paddingLeft: '40px', margin:0}} placeholder="Documento (Cédula) *" value={docId} onChange={e=>setDocId(e.target.value)} required />
                    </div>

                    <div style={{position: 'relative', marginBottom: '16px'}}>
                        <Mail size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input className="form-input" style={{paddingLeft: '40px', margin:0}} placeholder="Email (Opcional)" value={email} onChange={e=>setEmail(e.target.value)} />
                    </div>

                    <select className="form-input" value={branchId} onChange={e=>setBranchId(e.target.value)} required>
                        <option value="">Seleccione Su Sucursal Base *</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div>
                    <h3 style={{marginBottom: '10px'}}>Detalles del Pago y Membresía</h3>
                    
                    <div className="card" style={{marginBottom: '20px'}}>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Fecha de Registro</label>
                            <div style={{position: 'relative'}}>
                                <Calendar size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                                <input 
                                    type="date"
                                    className="form-input" 
                                    style={{paddingLeft: '40px', margin:0}}
                                    value={transactionDate} 
                                    onChange={e=>setTransactionDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <h3 style={{marginBottom: '10px'}}>Elegir Plan *</h3>
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
                                    <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        {p.durationMonths} {p.durationMonths === 1 ? 'mes' : 'meses'}
                                    </span>
                                </div>
                                <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>${p.priceAmount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '20px'}}>
                <input 
                    type="checkbox" 
                    id="consent" 
                    checked={consentGiven} 
                    onChange={e => setConsentGiven(e.target.checked)} 
                    style={{marginTop: '4px'}}
                />
                <label htmlFor="consent" style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                    El cliente acepta la política de tratamiento de datos personales y uso de imagen para la gestión interna del gimnasio según la Ley Orgánica de Protección de Datos Personales (LOPDP). *
                </label>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px'}}>
                <button className="btn-outline" onClick={() => navigate('/dashboard')} disabled={isSubmitting || isLoading}>Cancelar</button>
                <button 
                    className="btn-primary" 
                    onClick={handleRegister} 
                    disabled={isSubmitting || isLoading || !fullName || !docId || !branchId || !selectedPlanId || !consentGiven}
                    style={{ opacity: (!fullName || !docId || !branchId || !selectedPlanId || !consentGiven) ? 0.6 : 1 }}
                >
                    {isSubmitting || isLoading ? 'Guardando...' : 'Crear Membresía y Cliente'}
                </button>
            </div>
        </div>
    );
}
