import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/branchStore';
import { useMembershipStore } from '../store/membershipStore';
import { useCustomerStore } from '../store/customerStore';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

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

    useEffect(() => { 
        fetchBranches();
        fetchPlans();
    }, [fetchBranches, fetchPlans]);

    // Pre-fill doc from dashboard shortcut
    useEffect(() => {
        const doc = searchParams.get('doc');
        if (doc) {
            setDocId(doc);
            fetchCustomerByDocId(doc).then(customer => {
                if (customer) {
                    setCustomerName(customer.fullName);
                    if (customer.homeBranchId) setBranchId(customer.homeBranchId.toString());
                }
            });
        }
    }, [searchParams, fetchCustomerByDocId]);

    const handleDocIdBlur = async () => {
        if (!docId) return;
        const customer = await fetchCustomerByDocId(docId);
        if (customer) {
            setCustomerName(customer.fullName);
            if (customer.homeBranchId) {
                setBranchId(customer.homeBranchId.toString());
            }
        }
    };

    const handlePayment = async () => {
        if (!customerName || !planId) return alert("El nombre y el plan son obligatorios");
        
        const selectedPlan = plans.find(p => p.id === Number(planId));
        
        const payload = {
            documentId: docId || undefined,
            customerFullName: customerName,
            branchId: branchId ? Number(branchId) : undefined,
            planId: Number(planId),
            amountPaid: selectedPlan ? selectedPlan.priceAmount : 0,
            startDate: transactionDate
        };

        const success = await renewMembership(payload);
        if (success) {
            alert("Membresía Registrada Correctamente.");
            setDocId(""); 
            setPlanId(""); 
            setCustomerName(""); 
            setBranchId("");
            setTransactionDate(new Date().toISOString().split('T')[0]);
        }
    };

    return (
        <div>
            <h1 className="page-title">Registrar Membresía</h1>
            <p className="page-subtitle">Crea o renueva membresías (Nombre y Plan requeridos)</p>

            <div className="grid-cols-2">
                <div>
                    <h3 style={{marginBottom: '10px'}}>Datos del Cliente</h3>
                    <div style={{marginBottom: '16px'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Documento (Opcional)</label>
                        <div style={{position: 'relative'}}>
                            <Search size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                            <input 
                                className="form-input" 
                                style={{paddingLeft: '40px', margin:0}}
                                placeholder="Buscar por Documento" 
                                value={docId} 
                                onChange={e=>setDocId(e.target.value)} 
                                onBlur={handleDocIdBlur}
                            />
                        </div>
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
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Sucursal (Opcional)</label>
                            <select className="form-input" value={branchId} onChange={e=>setBranchId(e.target.value)}>
                                <option value="">Sin Sucursal (Opcional)</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Plan de Membresía *</label>
                            <select className="form-input" value={planId} onChange={e=>setPlanId(e.target.value)}>
                                <option value="">Seleccione un Plan</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} - ${p.priceAmount} ({p.durationDays} días)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{paddingTop: '16px', borderTop: '1px solid var(--border-color)', display:'flex', justifyContent:'flex-end'}}>
                            <button className="btn-primary" onClick={handlePayment} disabled={isLoading}>
                                {isLoading ? 'Procesando...' : 'Registrar Membresía'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
