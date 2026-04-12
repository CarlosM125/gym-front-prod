import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/branchStore';
import { useUserStore } from '../store/userStore';
import { UserPlus, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

export default function ClientRegistryScreen() {
    const { branches, fetchBranches } = useBranchStore();
    const { registerUser, isLoading } = useUserStore();

    const [docId, setDocId] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [branchId, setBranchId] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchBranches(); }, [fetchBranches]);

    const handleRegister = async () => {
        if (!docId || !fullName || !branchId) return alert("Rellene ID, Nombre y Sucursal Mínimo");
        setUploading(true);

        let finalImageUrl = null;

        // Cloudinary Upload Logic (Direct from Client to Nube for 0 server cost)
        if (imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);
            // Reemplaza YOUR_PRESET con el Upload Preset unsigned en Cloudinary y el nombre de tu nube
            // ej: import.meta.env.VITE_CLOUDINARY_URL
            formData.append("upload_preset", "gym_preset"); 
            try {
                // To activate, user will change 'demo' to their cloud name
                const res = await axios.post(`https://api.cloudinary.com/v1_1/demo/image/upload`, formData);
                finalImageUrl = res.data.secure_url;
            } catch (e) {
                console.error("Cloudinary upload failed", e);
                alert("Fallo la subida de imagen, pero se registrará la persona");
            }
        }

        const success = await registerUser({
            documentId: docId, 
            fullName, 
            email, 
            homeBranchId: Number(branchId),
            // profileImageUrl: finalImageUrl // Model is prepared for this
        });

        if (success) {
            alert("Cliente Registrado con Éxito. PIN ZK: " + success.pinZkteco);
            setDocId(""); setFullName(""); setEmail(""); setImageFile(null);
        }
        setUploading(false);
    };

    return (
        <div>
            <header className="page-header">
                <h1>Registro de Nuevo Cliente</h1>
                <p className="subtitle">Módulo de ventas y biometría</p>
            </header>

            <div className="glass-panel action-panel" style={{maxWidth: '600px', margin: 'auto'}}>
                <h2 className="flex-title"><UserPlus /> Formulario de Ingreso</h2>
                
                <div className="form-group vertical-flex">
                    <input className="glass-input full-w" placeholder="Documento de Identidad (CC)" value={docId} onChange={e=>setDocId(e.target.value)} />
                    <input className="glass-input full-w" placeholder="Nombre Completo" value={fullName} onChange={e=>setFullName(e.target.value)} />
                    <input className="glass-input full-w" placeholder="Correo Electrónico" value={email} onChange={e=>setEmail(e.target.value)} />
                    
                    <select className="glass-input full-w" value={branchId} onChange={e=>setBranchId(e.target.value)}>
                        <option value="" disabled>Selecciona su Sucursal Base</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <div className="glass-input full-w" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <ImageIcon size={20} />
                        <label style={{flex: 1, color: 'rgba(255,255,255,0.7)', cursor: 'pointer'}}>
                            {imageFile ? imageFile.name : "Subir Fotografía del Cliente (Opcional)"}
                            <input type="file" style={{display: 'none'}} accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
                        </label>
                    </div>

                    <button onClick={handleRegister} disabled={isLoading || uploading} style={{marginTop: '1rem'}}>
                        {uploading || isLoading ? 'Procesando Nube...' : 'Registrar Cliente en Base'}
                    </button>
                </div>
            </div>
        </div>
    );
}
