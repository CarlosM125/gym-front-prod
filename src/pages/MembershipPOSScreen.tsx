import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/branchStore';
import { useMembershipStore } from '../store/membershipStore';
import { useCustomerStore } from '../store/customerStore';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle } from 'lucide-react';

export default function MembershipPOSScreen() {
    const { branches, fetchBranches } = useBranchStore();
    const { plans, fetchPlans, renewMembership, isLoading } = useMembershipStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const [searchParams] = useSearchParams();

    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [docId, setDocId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [planId, setPlanId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [consentGiven, setConsentGiven] = useState(false);

    useEffect(() => { 
        fetchBranches();
        fetchPlans();
        fetchCustomers();
    }, [fetchBranches, fetchPlans, fetchCustomers]);

    // Pre-fill doc from dashboard shortcut
    useEffect(() => {
        const doc = searchParams.get('doc');
        if (doc) {
            setSearchQuery(doc);
            setDocId(doc);
            // We rely on fetchCustomers to populate the customer list, then we can match it
            const matchedCustomer = customers.find(c => c.documentId === doc);
            if (matchedCustomer) {
                setCustomerName(matchedCustomer.fullName);
                setSearchQuery(`${matchedCustomer.documentId} - ${matchedCustomer.fullName}`);
                if (matchedCustomer.homeBranchId) setBranchId(matchedCustomer.homeBranchId.toString());
            }
        }
    }, [searchParams, customers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setShowDropdown(true);
        // Reset selected customer if they start typing again
        if (docId) {
            setDocId("");
            setCustomerName("");
        }
    };

    const selectCustomer = (c: any) => {
        setDocId(c.documentId);
        setCustomerName(c.fullName);
        setSearchQuery(`${c.documentId} - ${c.fullName}`);
        if (c.homeBranchId) setBranchId(c.homeBranchId.toString());
        setShowDropdown(false);
    };

    const filteredCustomers = searchQuery.length >= 2 && showDropdown
        ? customers.filter(c => 
            c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.documentId.includes(searchQuery)
          ).slice(0, 10) // Limit to 10 results
        : [];

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
            setSearchQuery("");
            setBranchId("");
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
                    
                    <div style={{marginBottom: '16px', position: 'relative'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Buscar Cliente Existente (Nombre o Cédula)</label>
                        <div style={{position: 'relative'}}>
                            <Search size={18} style={{position:'absolute', left:'12px', top:'14px', color:'var(--text-muted)'}}/>
                            <input 
                                className="form-input" 
                                style={{ paddingLeft: '40px', margin: 0 }}
                                placeholder="Ej. Juan Pérez o 17XXXXXXXX" 
                                value={searchQuery} 
                                onChange={handleSearchChange}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // delay to allow click
                            />
                            {docId && (
                                <CheckCircle size={18} style={{position:'absolute', right:'12px', top:'14px', color:'var(--success, #22c55e)'}} />
                            )}
                        </div>
                        
                        {showDropdown && filteredCustomers.length > 0 && (
                            <ul style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, 
                                backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', 
                                borderRadius: '4px', zIndex: 10, maxHeight: '250px', overflowY: 'auto',
                                listStyle: 'none', padding: 0, margin: '4px 0 0 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)'
                            }}>
                                {filteredCustomers.map(c => (
                                    <li 
                                        key={c.id} 
                                        onClick={() => selectCustomer(c)}
                                        style={{padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between'}}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div>
                                            <div style={{fontWeight: 500}}>{c.fullName}</div>
                                            <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Cédula: {c.documentId}</div>
                                        </div>
                                        {c.currentPlanName && (
                                            <div style={{fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'right'}}>
                                                {c.currentPlanName}<br/>
                                                <span style={{color: 'var(--text-muted)'}}>{c.membershipStatus}</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {showDropdown && searchQuery.length >= 2 && filteredCustomers.length === 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, 
                                backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', 
                                padding: '12px 16px', zIndex: 10, borderRadius: '4px', marginTop: '4px',
                                color: 'var(--warning, #f59e0b)', fontSize: '0.9rem'
                            }}>
                                No se encontraron clientes. Ingresa los datos manualmente abajo para crear uno nuevo.
                            </div>
                        )}
                    </div>
                    
                    <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                        <div style={{flex: 1}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Documento *</label>
                            <input 
                                className="form-input" 
                                placeholder="Número de documento" 
                                value={docId} 
                                onChange={e => {
                                    setDocId(e.target.value);
                                    if(searchQuery) setSearchQuery(''); // Clear search if manually editing
                                }} 
                                required
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>Nombre Completo *</label>
                            <input 
                                className="form-input" 
                                placeholder="Nombre del cliente" 
                                value={customerName} 
                                onChange={e => {
                                    setCustomerName(e.target.value);
                                    if(searchQuery) setSearchQuery(''); // Clear search if manually editing
                                }} 
                                required
                            />
                        </div>
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
