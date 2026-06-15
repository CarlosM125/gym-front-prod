import { useEffect, useState } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { useMarketingStore } from '../store/marketingStore';
import { 
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { DollarSign, Users, TrendingUp, CreditCard, RefreshCw, CheckCircle, Lightbulb, Activity, UserPlus } from 'lucide-react';



const COLORS = ['#d62020', '#2563eb', '#d97706', '#16a34a', '#8b5cf6', '#ec4899'];



export default function AnalyticsScreen() {
    const { dashboardStats, fetchDashboardStats, plans, fetchPlans } = useMembershipStore();
    const { proposals, isLoading: marketingLoading, isRunning, lastRun, fetchProposals, triggerAnalysis } = useMarketingStore();
    const [triggerMsg, setTriggerMsg] = useState('');
    
    // Filtros state
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        branchId: '',
        planId: '',
        status: ''
    });

    useEffect(() => {
        fetchDashboardStats();
        fetchProposals();
        fetchPlans();
    }, [fetchDashboardStats, fetchProposals, fetchPlans]);

    const handleApplyFilters = () => {
        const payload: any = {};
        if (filters.startDate) payload.startDate = filters.startDate;
        if (filters.endDate) payload.endDate = filters.endDate;
        if (filters.branchId) payload.branchId = Number(filters.branchId);
        if (filters.planId) payload.planId = Number(filters.planId);
        if (filters.status) payload.status = filters.status;
        
        fetchDashboardStats(payload);
    };

    const handleTrigger = async () => {
        setTriggerMsg('');
        const msg = await triggerAnalysis();
        setTriggerMsg(msg);
    };

    // Calcular datos sumarios
    const totalRevenue = dashboardStats?.totalRevenue || 0;
    const avgRevenue = dashboardStats?.averageRevenuePerCustomer || 0;
    const activeCustomers = dashboardStats?.activeCustomers || 0;
    const monthlyRevenue = dashboardStats?.monthlyRevenue || 0;
    const planDistribution = dashboardStats?.planDistribution || [];
    const historicalStats = dashboardStats?.historicalStats || [];

    // Nuevas membresías (del mes actual)
    const currentMonthData = historicalStats.length > 0 ? historicalStats[new Date().getMonth()] : null;
    const newSignups = currentMonthData ? currentMonthData.signups : 0;
    
    const topCustomers = dashboardStats?.topCustomers || [];
    const keyMetrics = dashboardStats?.keyMetrics || { renewalRate: [], nonRenewalRate: [], newSignupsRate: [] };
    const membershipAnalysis = dashboardStats?.membershipAnalysis || [];

    const lastRunFormatted = lastRun
        ? new Date(lastRun).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Nunca';

    return (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* ── Columna Izquierda: Filtros ── */}
            <div style={{ width: '250px', flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Activity size={24} style={{ color: 'var(--primary-color)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', lineHeight: '1.2' }}>GYM ANALYTICS</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dashboard Ejecutivo</p>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '20px', background: 'var(--card-bg)' }}>
                        <div className="flex-between" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Filtros</h3>
                            <button 
                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                onClick={() => {
                                    setFilters({ startDate: '', endDate: '', branchId: '', planId: '', status: '' });
                                    fetchDashboardStats();
                                }}
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>Rango de Fechas (Desde)</label>
                            <input type="date" className="form-input" style={{ marginBottom: 0, padding: '8px', fontSize: '0.85rem' }} value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>Rango de Fechas (Hasta)</label>
                            <input type="date" className="form-input" style={{ marginBottom: 0, padding: '8px', fontSize: '0.85rem' }} value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>Plan</label>
                            <select className="form-input" style={{ marginBottom: 0, padding: '8px', fontSize: '0.85rem' }} value={filters.planId} onChange={e => setFilters({...filters, planId: e.target.value})}>
                                <option value="">Todos</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>Estado Membresía</label>
                            <select className="form-input" style={{ marginBottom: 0, padding: '8px', fontSize: '0.85rem' }} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                                <option value="">Activa</option>
                                <option value="EXPIRED">Vencida</option>
                                <option value="CANCELLED">Cancelada</option>
                                <option value="">Todos</option>
                            </select>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }} onClick={handleApplyFilters}>
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Columna Derecha: Contenido ── */}
            <div style={{ flex: 1, minWidth: '0' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>Resumen General</h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vista general del rendimiento del gimnasio</p>
                </div>

                {/* 5 Top Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="flex-between">
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos Totales</span>
                            <div style={{ background: '#8b5cf620', padding: '6px', borderRadius: '50%', color: '#8b5cf6' }}><DollarSign size={16} /></div>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.6rem' }}>${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Histórico</span>
                    </div>

                    <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="flex-between">
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos del Mes</span>
                            <div style={{ background: '#3b82f620', padding: '6px', borderRadius: '50%', color: '#3b82f6' }}><TrendingUp size={16} /></div>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.6rem' }}>${monthlyRevenue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mes en curso</span>
                    </div>

                    <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="flex-between">
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nuevas Membresías</span>
                            <div style={{ background: '#10b98120', padding: '6px', borderRadius: '50%', color: '#10b981' }}><UserPlus size={16} /></div>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.6rem' }}>{newSignups}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mes actual</span>
                    </div>

                    <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="flex-between">
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membresías Activas</span>
                            <div style={{ background: '#f59e0b20', padding: '6px', borderRadius: '50%', color: '#f59e0b' }}><Users size={16} /></div>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.6rem' }}>{activeCustomers}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clientes vigentes</span>
                    </div>

                    <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="flex-between">
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingreso Promedio</span>
                            <div style={{ background: '#ec489920', padding: '6px', borderRadius: '50%', color: '#ec4899' }}><CreditCard size={16} /></div>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.6rem' }}>${avgRevenue.toFixed(2)}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por miembro</span>
                    </div>
                </div>

                {/* Middle Charts Section (Area Chart + Pie Chart) */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px', marginBottom: '20px' }}>
                    
                    {/* Area Chart: Ingresos por Mes */}
                    <div className="card" style={{ margin: 0, padding: '20px' }}>
                        <div className="flex-between" style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Ingresos por Mes</h3>
                        </div>
                        <div style={{ width: '100%', height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historicalStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `$${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Ingresos']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart: Distribución por Plan */}
                    <div className="card" style={{ margin: 0, padding: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 600 }}>Distribución de Ingresos por Plan</h3>
                        <div style={{ width: '100%', height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planDistribution}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                        stroke="none"
                                    >
                                        {planDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                            {planDistribution.map((item, index) => (
                                <div key={item.name} className="flex-between" style={{ fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span style={{ color: 'var(--text-main)' }}>{item.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <span style={{ color: 'var(--text-muted)', width: '40px', textAlign: 'right' }}>{item.percentage}</span>
                                        <span style={{ fontWeight: 600, width: '60px', textAlign: 'right' }}>${item.revenue.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Charts Section (Horizontal Bar Chart) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Horizontal Bar Chart: Ingresos por Duración/Plan */}
                    <div className="card" style={{ margin: 0, padding: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 600 }}>Ingresos por Plan</h3>
                        <div style={{ width: '100%', height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={planDistribution}
                                    layout="vertical"
                                    margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `$${val/1000}k`} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-main)' }} width={100} />
                                    <Tooltip 
                                        cursor={{ fill: 'var(--bg-color)' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Ingresos']}
                                    />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                        {planDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Third Row: Top 10 Clientes & Métricas Clave */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Top 10 Clientes */}
                    <div className="card" style={{ margin: 0, padding: '20px', overflowX: 'auto' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 600 }}>Top 10 Clientes por Ingresos Generados</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px', fontWeight: 500 }}>Cliente</th>
                                    <th style={{ padding: '8px', fontWeight: 500 }}>Plan Actual</th>
                                    <th style={{ padding: '8px', fontWeight: 500 }}>Miembro Desde</th>
                                    <th style={{ padding: '8px', fontWeight: 500, textAlign: 'right' }}>Ingresos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map((c, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--text-main)' }}>{c.name}</td>
                                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{c.planName}</td>
                                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{c.joinedDate}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>${c.revenue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                                    </tr>
                                ))}
                                {topCustomers.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay datos suficientes</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Métricas Clave (Line Charts) */}
                    <div className="card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Métricas Clave</h3>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="flex-between">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasa de Renovación</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>+2.4%</span>
                            </div>
                            <div style={{ height: '60px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={keyMetrics.renewalRate}>
                                        <Line type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="flex-between">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasa de No Renovación</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>-1.2%</span>
                            </div>
                            <div style={{ height: '60px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={keyMetrics.nonRenewalRate}>
                                        <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="flex-between">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasa de Nuevos</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>+5.8%</span>
                            </div>
                            <div style={{ height: '60px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={keyMetrics.newSignupsRate}>
                                        <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fourth Row: Análisis de Membresías */}
                <div className="card" style={{ margin: '0 0 20px 0', padding: '20px', overflowX: 'auto' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 600 }}>Análisis de Membresías</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '8px', fontWeight: 500 }}>Plan</th>
                                <th style={{ padding: '8px', fontWeight: 500, textAlign: 'right' }}>Activas</th>
                                <th style={{ padding: '8px', fontWeight: 500, textAlign: 'right' }}>Vencidas</th>
                                <th style={{ padding: '8px', fontWeight: 500, textAlign: 'right' }}>Canceladas</th>
                                <th style={{ padding: '8px', fontWeight: 500, textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {membershipAnalysis.map((a, idx) => {
                                const total = a.activeCount + a.expiredCount + a.cancelledCount;
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--text-main)' }}>{a.planName}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 500 }}>{a.activeCount}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#f59e0b', fontWeight: 500 }}>{a.expiredCount}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>{a.cancelledCount}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{total}</td>
                                    </tr>
                                );
                            })}
                            {membershipAnalysis.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay datos suficientes</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Sección del Agente IA (INSIGHTS) ──────────────────────────────────────── */}
                <div className="card" style={{ margin: 0, padding: '24px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ backgroundColor: '#c084fc', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Lightbulb size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#6b21a8' }}>
                                    INSIGHTS (Agente IA)
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9333ea' }}>
                                    Generado automáticamente en base a tus datos · Último análisis: <b>{lastRunFormatted}</b>
                                </p>
                            </div>
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
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', borderColor: '#c084fc', color: '#6b21a8' }}
                            >
                                <RefreshCw size={16} style={{ animation: isRunning ? 'spin 1s linear infinite' : 'none' }} />
                                {isRunning ? 'Analizando...' : 'Recalcular'}
                            </button>
                        </div>
                    </div>

                    {marketingLoading ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#9333ea' }}>Analizando datos de la base de datos...</p>
                    ) : proposals.length === 0 ? (
                        <div style={{ padding: '20px', color: '#9333ea' }}>
                            <p style={{ margin: 0 }}>No hay estrategias generadas por el momento.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                            {proposals.slice(0, 3).map(p => (
                                <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(107, 33, 168, 0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }}></div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#4c1d95' }}>{p.titulo}</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>{p.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 1200px) {
                    div[style*="grid-template-columns: repeat(5, 1fr)"] {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
                @media (max-width: 1024px) {
                    div[style*="display: 'flex', gap: '20px'"] {
                        flex-direction: column !important;
                    }
                    div[style*="width: '250px'"] {
                        width: 100% !important;
                    }
                    div[style*="grid-template-columns: 2fr 1.2fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: repeat(3, 1fr)"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </div>
    );
}
