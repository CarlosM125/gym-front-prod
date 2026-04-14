import { useEffect } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react';

export default function AnalyticsScreen() {
    const { historicalStats, fetchHistoricalStats } = useMembershipStore();

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        fetchHistoricalStats(currentYear);
    }, [fetchHistoricalStats]);

    // Calcular datos sumarios desde historicalStats mockeado
    const totalRevenue = historicalStats.reduce((sum, item) => sum + item.revenue, 0);
    const avgRevenue = historicalStats.length > 0 ? (totalRevenue / historicalStats.length).toFixed(0) : 0;
    
    const pieDataMock = [
        { name: 'Básica', value: totalRevenue * 0.224, clients: 3, percentage: '22.4%' },
        { name: 'Premium', value: totalRevenue * 0.239, clients: 2, percentage: '23.9%' },
        { name: 'VIP', value: totalRevenue * 0.537, clients: 3, percentage: '53.7%' }
    ];

    return (
        <div>
            <h1 className="page-title">Análisis Financiero</h1>
            <p className="page-subtitle">Resumen de ingresos y métricas clave</p>

            {/* Top Cards */}
            <div className="grid-cols-4" style={{marginBottom: '24px'}}>
                <div className="card" style={{margin: 0}}>
                    <div className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                        <DollarSign size={18} style={{color: 'white', background: 'var(--primary-color)', borderRadius: '4px', padding: '2px'}}/> 
                        <b>Ingresos del Mes</b>
                    </div>
                    <h2 style={{margin: '0', fontSize: '2rem'}}>${(historicalStats.find(s => s.month === '2026-04')?.revenue || 0)}</h2>
                    <p className="text-muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Abril 2026</p>
                </div>
                <div className="card" style={{margin: 0}}>
                    <div className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                        <Users size={18} style={{color: 'white', background: '#000', borderRadius: '4px', padding: '2px'}}/> 
                        <b>Clientes Activos</b>
                    </div>
                    <h2 style={{margin: '0', fontSize: '2rem'}}>8</h2>
                    <p className="text-muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Membresías vigentes</p>
                </div>
                <div className="card" style={{margin: 0}}>
                    <div className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                        <TrendingUp size={18} style={{color: 'white', background: '#000', borderRadius: '4px', padding: '2px'}}/> 
                        <b>Ingreso Total</b>
                    </div>
                    <h2 style={{margin: '0', fontSize: '2rem'}}>${totalRevenue}</h2>
                    <p className="text-muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Todas las membresías</p>
                </div>
                <div className="card" style={{margin: 0}}>
                    <div className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                        <CreditCard size={18} style={{color: 'white', background: '#000', borderRadius: '4px', padding: '2px'}}/> 
                        <b>Promedio</b>
                    </div>
                    <h2 style={{margin: '0', fontSize: '2rem'}}>${avgRevenue}</h2>
                    <p className="text-muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Por cliente</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid-cols-2">
                <div className="card" style={{minHeight: '350px', display: 'flex', flexDirection: 'column'}}>
                    <h3 style={{marginTop: 0, marginBottom: '20px'}}>Ingresos por Tipo de Membresía</h3>
                    <div style={{flex: 1, width: '100%', minHeight: '250px'}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pieDataMock} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} width={50} />
                                <Tooltip cursor={{fill: 'var(--bg-color)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                                <Bar dataKey="value" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{marginTop: 0, marginBottom: '20px'}}>Distribución de Membresías</h3>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                        {pieDataMock.map(item => (
                            <div key={item.name}>
                                <div className="flex-between" style={{marginBottom: '8px'}}>
                                    <span style={{fontWeight: '500'}}>{item.name}</span>
                                    <span className="text-muted" style={{fontSize: '0.9rem'}}>{item.clients} clientes</span>
                                </div>
                                <div style={{width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px'}}>
                                    <div style={{width: item.percentage, height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: '4px'}}></div>
                                </div>
                                <div className="flex-between" style={{marginTop: '8px', fontSize: '0.9rem'}}>
                                    <span className="text-muted">${item.value.toFixed(0)}</span>
                                    <span className="text-muted">{item.percentage}</span>
                                </div>
                            </div>
                        ))}

                        <div className="flex-between" style={{marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)'}}>
                            <span style={{fontWeight: '500'}}>Total Ingresos</span>
                            <h3 style={{margin: 0}}>${totalRevenue.toFixed(0)}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="card" style={{marginTop: '32px'}}>
                <h3 style={{marginTop: 0, marginBottom: '20px'}}>Ingreso Histórico Anualizado</h3>
                <div style={{width: '100%', height: '300px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historicalStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f0f0f0'}} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#000" name="Ingresos Mensuales ($)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
