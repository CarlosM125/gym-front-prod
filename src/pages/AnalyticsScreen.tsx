import { useEffect, useState } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { useMarketingStore, MarketingProposal } from '../store/marketingStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, CreditCard, Sparkles, RefreshCw, AlertCircle, CheckCircle, Target, Megaphone, Lightbulb } from 'lucide-react';

const TIPO_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'promocion':          { label: 'Promoción',       color: '#d62020', icon: <Target size={14} /> },
    'campaña_marketing':  { label: 'Campaña',         color: '#2563eb', icon: <Megaphone size={14} /> },
    'consejo_retencion':  { label: 'Retención',       color: '#d97706', icon: <AlertCircle size={14} /> },
    'estrategia':         { label: 'Estrategia',      color: '#16a34a', icon: <Lightbulb size={14} /> },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
    'pendiente':   { label: 'Pendiente',   color: '#6b7280' },
    'en_progreso': { label: 'En progreso', color: '#2563eb' },
    'completada':  { label: 'Completada',  color: '#16a34a' },
    'descartada':  { label: 'Descartada',  color: '#ef4444' },
};

function ProposalCard({ proposal }: { proposal: MarketingProposal }) {
    const tipo = TIPO_CONFIG[proposal.tipo] || TIPO_CONFIG['estrategia'];
    const estado = ESTADO_CONFIG[proposal.estado] || ESTADO_CONFIG['pendiente'];
    const fecha = proposal.fechaGeneracion
        ? new Date(proposal.fechaGeneracion).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${tipo.color}`,
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'var(--card-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{proposal.titulo}</h4>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem',
                        backgroundColor: tipo.color + '18', color: tipo.color, fontWeight: 500
                    }}>
                        {tipo.icon} {tipo.label}
                    </span>
                    <span style={{
                        padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem',
                        backgroundColor: estado.color + '18', color: estado.color, fontWeight: 500
                    }}>
                        {estado.label}
                    </span>
                </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {proposal.descripcion}
            </p>

            {proposal.acciones && (
                <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: '6px', padding: '10px 12px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>{proposal.acciones}</p>
                </div>
            )}

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Generado: {fecha}
            </p>
        </div>
    );
}

export default function AnalyticsScreen() {
    const { historicalStats, fetchHistoricalStats } = useMembershipStore();
    const { proposals, isLoading, isRunning, lastRun, fetchProposals, triggerAnalysis } = useMarketingStore();
    const [triggerMsg, setTriggerMsg] = useState('');

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        fetchHistoricalStats(currentYear);
        fetchProposals();
    }, [fetchHistoricalStats, fetchProposals]);

    const handleTrigger = async () => {
        setTriggerMsg('');
        const msg = await triggerAnalysis();
        setTriggerMsg(msg);
    };

    // Calcular datos sumarios
    const totalRevenue = historicalStats.reduce((sum, item) => sum + item.revenue, 0);
    const avgRevenue = historicalStats.length > 0 ? (totalRevenue / historicalStats.length).toFixed(0) : 0;

    const pieDataMock = [
        { name: 'Básica',   value: totalRevenue * 0.224, clients: 3, percentage: '22.4%' },
        { name: 'Premium',  value: totalRevenue * 0.239, clients: 2, percentage: '23.9%' },
        { name: 'VIP',      value: totalRevenue * 0.537, clients: 3, percentage: '53.7%' }
    ];

    const lastRunFormatted = lastRun
        ? new Date(lastRun).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Nunca';

    return (
        <div>
            <h1 className="page-title">Análisis Financiero</h1>
            <p className="page-subtitle">Resumen de ingresos y métricas clave</p>

            {/* Top Cards */}
            <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
                <div className="card" style={{ margin: 0 }}>
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <DollarSign size={18} style={{ color: 'white', background: 'var(--primary-color)', borderRadius: '4px', padding: '2px' }} />
                        <b>Ingresos del Mes</b>
                    </div>
                    <h2 style={{ margin: '0', fontSize: '2rem' }}>${(historicalStats.find(s => s.month === 'Apr')?.revenue || 0)}</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Último mes registrado</p>
                </div>
                <div className="card" style={{ margin: 0 }}>
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Users size={18} style={{ color: 'white', background: '#000', borderRadius: '4px', padding: '2px' }} />
                        <b>Clientes Activos</b>
                    </div>
                    <h2 style={{ margin: '0', fontSize: '2rem' }}>8</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Membresías vigentes</p>
                </div>
                <div className="card" style={{ margin: 0 }}>
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <TrendingUp size={18} style={{ color: 'white', background: '#000', borderRadius: '4px', padding: '2px' }} />
                        <b>Ingreso Total</b>
                    </div>
                    <h2 style={{ margin: '0', fontSize: '2rem' }}>${totalRevenue}</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Todas las membresías</p>
                </div>
                <div className="card" style={{ margin: 0 }}>
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <CreditCard size={18} style={{ color: 'white', background: '#000', borderRadius: '4px', padding: '2px' }} />
                        <b>Promedio</b>
                    </div>
                    <h2 style={{ margin: '0', fontSize: '2rem' }}>${avgRevenue}</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Por cliente</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid-cols-2">
                <div className="card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Ingresos por Tipo de Membresía</h3>
                    <div style={{ flex: 1, width: '100%', minHeight: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pieDataMock} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} width={50} />
                                <Tooltip cursor={{ fill: 'var(--bg-color)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Distribución de Membresías</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {pieDataMock.map(item => (
                            <div key={item.name}>
                                <div className="flex-between" style={{ marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>{item.clients} clientes</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                                    <div style={{ width: item.percentage, height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: '4px' }}></div>
                                </div>
                                <div className="flex-between" style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                                    <span className="text-muted">${item.value.toFixed(0)}</span>
                                    <span className="text-muted">{item.percentage}</span>
                                </div>
                            </div>
                        ))}
                        <div className="flex-between" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ fontWeight: '500' }}>Total Ingresos</span>
                            <h3 style={{ margin: 0 }}>${totalRevenue.toFixed(0)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Ingreso Histórico Anualizado</h3>
                <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historicalStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f0f0f0' }} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#000" name="Ingresos Mensuales ($)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Sección del Agente IA ──────────────────────────────────────── */}
            <div className="card" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={20} style={{ color: 'var(--primary-color)' }} />
                            Propuestas del Agente IA
                        </h3>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                            Generadas automáticamente cada día a las 6:00 AM · Último análisis: <b>{lastRunFormatted}</b>
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {triggerMsg && (
                            <span style={{ fontSize: '0.85rem', color: triggerMsg.includes('✅') ? '#16a34a' : '#ef4444' }}>
                                {triggerMsg.includes('✅') ? <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> : null}
                                {triggerMsg}
                            </span>
                        )}
                        <button
                            className="btn-outline"
                            onClick={handleTrigger}
                            disabled={isRunning}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                            <RefreshCw size={16} style={{ animation: isRunning ? 'spin 1s linear infinite' : 'none' }} />
                            {isRunning ? 'Analizando...' : 'Ejecutar Análisis Ahora'}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>Cargando propuestas...</p>
                ) : proposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Sparkles size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>Aún no hay propuestas generadas.</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>
                            El agente corre automáticamente a las 6 AM o puedes ejecutarlo ahora.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {proposals.slice(0, 8).map(p => (
                            <ProposalCard key={p.id} proposal={p} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
