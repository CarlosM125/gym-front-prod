import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/branchStore';
import { useMembershipStore } from '../store/membershipStore';
import { useCustomerStore } from '../store/customerStore';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';

const MIN_DOC_LENGTH = 5; // mínimo de caracteres antes de buscar

export default function MembershipPOSScreen() {
    const { branches, fetchBranches } = useBranchStore();
    const { plans, fetchPlans, renewMembership, isLoading } = useMembershipStore();
    const { fetchCustomerByDocId } = useCustomerStore();

    const [searchParams] = useSearchParams();

    const [docId, setDocId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [planId, setPlanId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [consentGiven, setConsentGiven] = useState(false);
    const [docStatus, setDocStatus] = useState<'idle' | 'found' | 'not_found' | 'searching'>('idle');

    useEffect(() => { 
        fetchBranches();
        fetchPlans();
    }, [fetchBranches, fetchPlans]);

    // Pre-fill doc from dashboard shortcut
    useEffect(() => {
        const doc = searchParams.get('doc');
        if (doc) {
            setDocId(doc);
            if (doc.length >= MIN_DOC_LENGTH) {
                setDocStatus('searching');
                fetchCustomerByDocId(doc).then(customer => {
                    if (customer) {
                        setCustomerName(customer.fullName);
                        if (customer.homeBranchId) setBranchId(customer.homeBranchId.toString());
                        setDocStatus('found');
                    } else {
                        setDocStatus('not_found');
                    }
                });
            }
        }
    }, [searchParams, fetchCustomerByDocId]);

    const handleDocIdBlur = async () => {
        // Solo buscar si tiene el mínimo de caracteres requeridos
        if (!docId || docId.trim().length < MIN_DOC_LENGTH) {
            setDocStatus('idle');
            return;
        }
        setDocStatus('searching');
        const customer = await fetchCustomerByDocId(docId.trim());
        if (customer) {
            setCustomerName(customer.fullName);
            if (customer.homeBranchId) {
                setBranchId(customer.homeBranchId.toString());
            }
            setDocStatus('found');
        } else {
            setDocStatus('not_found');
            // No limpiar nombre — puede ser un cliente nuevo
        }
    };

    const handleDocIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDocId(e.target.value);
        // Resetear estado al escribir para que no muestre encontrado/no encontrado mientras escribe
        if (docStatus !== 'idle') setDocStatus('idle');
        if (!e.target.value) setCustomerName('');
    };

    const handlePayment = async () => {
        if (!customerName || !docId || !branchId || !planId) return alert("Nombre, Cédula, Sucursal y Plan son obligatorios");
        if (!consentGiven) return alert("Debe aceptar la política de privacidad LOPDP");
        
        const selectedPlan = plans.find(p => p.id === Number(planId));
        
        const payload = {
            documentId: docId || undefined,
            customerFullName: customerName,
            branchId: branchId ? Number(branchId) : undefined,
            planId: Number(planId),
            amountPaid: selectedPlan ? selectedPlan.priceAmount : 0,
            startDate: transactionDate,
            consentGiven
        };

        const success = await renewMembership(payload);
        if (success) {
            alert("Membresía Registrada Correctamente.");
            setDocId(""); 
            setPlanId(""); 
            setCustomerName(""); 
            setBranchId("");
            setDocStatus('idle');
            setTransactionDate(new Date().toISOString().split('T')[0]);
        }
    };

    return (
        <div>
            <h1 className="page-title">Registrar Membresía</h1>
            <p className="page-subtitle">Crea o renueva membresías (Nombre, Cédula, Sucursal y Plan requeridos)</p>

            <div className="grid-cols-2">
                <div>
                    <h3 style={{marginBottom: '10px'}}>Datos del Cliente</h3>
                    <div style={{marginBottom: '16px'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Documento *</label>
                        <div style={{position: 'relative'}}>
                            <Search size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                            <input 
                                className="form-input" 
                                style={{
                                    paddingLeft: '40px', 
                                    paddingRight: '40px', 
                                    margin: 0,
                                    borderColor: docStatus === 'found' 
                                        ? 'var(--success, #22c55e)' 
                                        : docStatus === 'not_found' 
                                        ? 'var(--warning, #f59e0b)' 
                                        : undefined
                                }}
                                placeholder="Buscar por Documento" 
                                value={docId} 
                                onChange={handleDocIdChange}
                                onBlur={handleDocIdBlur}
                                required
                            />
                            {/* Ícono de estado */}
                            {docStatus === 'found' && (
                                <CheckCircle size={18} style={{position:'absolute', right:'12px', top:'14px', color:'var(--success, #22c55e)'}} />
                            )}
                            {docStatus === 'not_found' && (
                                <AlertCircle size={18} style={{position:'absolute', right:'12px', top:'14px', color:'var(--warning, #f59e0b)'}} />
                            )}
                            {docStatus === 'searching' && (
                                <span style={{position:'absolute', right:'14px', top:'14px', fontSize:'0.7rem', color:'var(--text-muted)'}}>•••</span>
                            )}
                        </div>
                        {docStatus === 'not_found' && (
                            <p style={{fontSize:'0.8rem', color:'var(--warning, #f59e0b)', marginTop:'6px'}}>
                                ⚠️ Cliente no encontrado. Puedes ingresar el nombre manualmente.
                            </p>
                        )}
                        {docStatus === 'found' && (
                            <p style={{fontSize:'0.8rem', color:'var(--success, #22c55e)', marginTop:'6px'}}>
                                ✓ Cliente encontrado automáticamente
                            </p>
                        )}
                    </div>
                    
                    <div style={{marginBottom: '16px'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Nombre Completo *</label>
                        <input 
                            className="form-input" 
                            placeholder="Nombre del cliente" 
                            value={customerName} 
                            onChange={e=>setCustomerName(e.target.value)} 
                            required
                        />
                    </div>
                </div>

                <div>
                    <h3 style={{marginBottom: '10px'}}>Detalles de Registro</h3>
                    <div className="card" style={{minHeight: '200px'}}>
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Fecha de Membresía</label>
                            <input 
                                type="date"
                                className="form-input" 
                                value={transactionDate} 
                                onChange={e=>setTransactionDate(e.target.value)}
                            />
                        </div>
                        
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Sucursal *</label>
                            <select className="form-input" value={branchId} onChange={e=>setBranchId(e.target.value)} required>
                                <option value="">Seleccione Sucursal</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Plan de Membresía *</label>
                            <select className="form-input" value={planId} onChange={e=>setPlanId(e.target.value)}>
                                <option value="">Seleccione un Plan</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} - ${p.priceAmount} ({p.durationMonths} {p.durationMonths === 1 ? 'mes' : 'meses'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px'}}>
                            <input 
                                type="checkbox" 
                                id="consent-pos" 
                                checked={consentGiven} 
                                onChange={e => setConsentGiven(e.target.checked)} 
                                style={{marginTop: '4px'}}
                            />
                            <label htmlFor="consent-pos" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                                Acepta la política de datos personales (LOPDP). *
                            </label>
                        </div>

                        <div style={{paddingTop: '16px', borderTop: '1px solid var(--border-color)', display:'flex', justifyContent:'flex-end'}}>
                            <button 
                                className="btn-primary" 
                                onClick={handlePayment} 
                                disabled={isLoading || !customerName || !docId || !branchId || !planId || !consentGiven}
                                style={{ opacity: (!customerName || !docId || !branchId || !planId || !consentGiven) ? 0.6 : 1 }}
                            >
                                {isLoading ? 'Procesando...' : 'Registrar Membresía'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
