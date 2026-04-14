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
    const [clientName, setClientName] = useState("");

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
                    setClientName(customer.fullName);
                    if (customer.homeBranchId) setBranchId(customer.homeBranchId.toString());
                }
            });
        }
    }, [searchParams, fetchCustomerByDocId]);

    const handleDocIdBlur = async () => {
        if (!docId) return;
        const customer = await fetchCustomerByDocId(docId);
        if (customer) {
            setClientName(customer.fullName);
            if (customer.homeBranchId) {
                setBranchId(customer.homeBranchId.toString());
            }
        } else {
            setClientName("No encontrado. Regístrelo primero.");
            setBranchId("");
        }
    };

    const handlePayment = async () => {
        if (!docId || !branchId || !planId) return alert("Rellene Documento, Sucursal de Venta, y Plan");
        const success = await renewMembership(docId, Number(branchId), Number(planId));
        if (success) {
            alert("Pago Procesado Correctamente. Membresía Activada y Registrada en Contabilidad.");
            setDocId(""); setPlanId(""); setClientName("");
        }
    };

    const selectedPlan = plans.find(p => p.id === Number(planId));

    return (
        <div>
            <h1 className="page-title">Renovar Membresía</h1>
            <p className="page-subtitle">Busca y renueva membresías existentes</p>

            <div className="grid-cols-2">
                <div>
                    <h3 style={{marginBottom: '10px'}}>Buscar Cliente</h3>
                    <div style={{position: 'relative', marginBottom: '16px'}}>
                        <Search size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                        <input 
                            className="form-input" 
                            style={{paddingLeft: '40px', margin:0}}
                            placeholder="Documento del Cliente (CC)" 
                            value={docId} 
                            onChange={e=>setDocId(e.target.value)} 
                            onBlur={handleDocIdBlur}
                        />
                    </div>
                    {clientName && (
                        <div className="card" style={{display: 'flex', alignItems: 'center', borderColor: 'var(--primary-color)'}}>
                            <img src="https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" alt="user" className="client-avatar" />
                            <div>
                                <h4 style={{margin: '0 0 4px 0'}}>{clientName}</h4>
                                <span className="text-muted" style={{fontSize: '0.85rem'}}>Seleccionado a Renovar</span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 style={{marginBottom: '10px'}}>Detalles de Renovación</h3>
                    <div className="card" style={{minHeight: '200px'}}>
                        {!clientName ? (
                            <div style={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', color: 'var(--text-muted)'}}>
                                Selecciona un cliente para renovar
                            </div>
                        ) : (
                            <div>
                                <div style={{marginBottom: '1rem'}}>
                                    <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Sucursal de Pago</label>
                                    <select className="form-input" value={branchId} onChange={e=>setBranchId(e.target.value)}>
                                        <option value="" disabled>Seleccione Sucursal</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                
                                <div style={{marginBottom: '1.5rem'}}>
                                    <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Plan de Membresía</label>
                                    <select className="form-input" value={planId} onChange={e=>setPlanId(e.target.value)}>
                                        <option value="" disabled>Seleccione Plan a cobrar</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - ${p.priceAmount} ({p.durationDays} días)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedPlan && (
                                    <div style={{paddingTop: '16px', borderTop: '1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <div>
                                            <p style={{margin:0, fontSize:'0.9rem'}} className="text-muted">Total a Pagar</p>
                                            <h2 style={{margin:0, color: 'var(--primary-color)'}}>${selectedPlan.priceAmount}</h2>
                                        </div>
                                        <button className="btn-primary" onClick={handlePayment} disabled={isLoading}>
                                            {isLoading ? 'Cobrando...' : 'Renovar Ahora'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
