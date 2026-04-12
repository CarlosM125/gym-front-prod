import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/branchStore';
import { useMembershipStore } from '../store/membershipStore';
import { useUserStore } from '../store/userStore';
import { CreditCard, Tag } from 'lucide-react';

export default function MembershipPOSScreen() {
    const { branches, fetchBranches } = useBranchStore();
    const { plans, fetchPlans, renewMembership, isLoading } = useMembershipStore();
    const { fetchUserByDocId } = useUserStore();

    const [docId, setDocId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [planId, setPlanId] = useState("");
    const [clientName, setClientName] = useState("");

    useEffect(() => { 
        fetchBranches();
        fetchPlans();
    }, [fetchBranches, fetchPlans]);

    const handleDocIdBlur = async () => {
        if (!docId) return;
        const user = await fetchUserByDocId(docId);
        if (user) {
            setClientName(user.fullName);
            if (user.homeBranchId) {
                setBranchId(user.homeBranchId.toString());
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
            <header className="page-header">
                <h1>Punto de Venta (P.O.S)</h1>
                <p className="subtitle">Cobro de mensualidades y promociones</p>
            </header>

            <div className="glass-panel action-panel" style={{maxWidth: '600px', margin: 'auto'}}>
                <h2 className="flex-title"><CreditCard /> Nueva Venta</h2>
                
                <div className="form-group vertical-flex">
                    <input 
                        className="glass-input full-w" 
                        placeholder="Documento del Cliente (CC)" 
                        value={docId} 
                        onChange={e=>setDocId(e.target.value)} 
                        onBlur={handleDocIdBlur}
                    />

                    {clientName && (
                        <p style={{marginTop: '-0.5rem', marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '0.9rem', textAlign: 'left'}}>
                            Cliente Detectado: <b>{clientName}</b>
                        </p>
                    )}
                    
                    <select className="glass-input full-w" value={branchId} onChange={e=>setBranchId(e.target.value)}>
                        <option value="" disabled>Seleccione Sucursal de Venta (Ingreso)</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <select className="glass-input full-w" value={planId} onChange={e=>setPlanId(e.target.value)}>
                        <option value="" disabled>Seleccione Plan / Promoción</option>
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} - ${p.priceAmount} ({p.durationDays} días) {p.isPromotion ? '⭐ PROMO' : ''}
                            </option>
                        ))}
                    </select>

                    {selectedPlan && (
                        <div style={{background: 'rgba(214, 28, 28, 0.1)', padding: '1rem', borderRadius: '8px', color: 'var(--primary-color)'}}>
                            <h4 style={{margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap:'0.5rem'}}>
                                <Tag size={16}/> Resumen de Compra
                            </h4>
                            <p style={{margin: 0}}>{selectedPlan.description}</p>
                            <h2 style={{margin: '0.5rem 0 0 0'}}>TOTAL A COBRAR: ${selectedPlan.priceAmount}</h2>
                        </div>
                    )}

                    <button onClick={handlePayment} disabled={isLoading} style={{marginTop: '1rem'}}>
                        {isLoading ? 'Autorizando...' : 'Confirmar Pago e Imprimir'}
                    </button>
                </div>
            </div>
        </div>
    );
}
