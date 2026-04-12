import { useEffect, useState } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Users } from 'lucide-react';

export default function AnalyticsScreen() {
    const { historicalStats, fetchHistoricalStats, isLoading } = useMembershipStore();
    const [year, setYear] = useState(2026);

    useEffect(() => {
        fetchHistoricalStats(year);
    }, [fetchHistoricalStats, year]);

    const totalRevenue = historicalStats.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalSignups = historicalStats.reduce((acc, curr) => acc + curr.signups, 0);

    return (
        <div>
            <header className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <h1>Informes Financieros</h1>
                    <p className="subtitle">Métricas corporativas e Ingresos Brutos</p>
                </div>
                <select className="glass-input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                </select>
            </header>

            {isLoading && <p>Cargando datos contables...</p>}

            <div className="dashboard-grid layout-3-col">
                <div className="glass-panel stat-card" style={{background: 'rgba(0, 230, 118, 0.05)'}}>
                    <h3 className="flex-title" style={{color: '#00e676'}}><DollarSign /> Ingreso Anual (Bruto)</h3>
                    <div className="stat-value" style={{color: '#00e676'}}>${totalRevenue.toLocaleString()}</div>
                    <div className="stat-trend positive">Calculado s/ Histórico Real</div>
                </div>

                <div className="glass-panel stat-card" style={{background: 'rgba(88, 166, 255, 0.05)'}}>
                    <h3 className="flex-title" style={{color: '#58a6ff'}}><Users /> Membresías Vendidas</h3>
                    <div className="stat-value" style={{color: '#58a6ff'}}>{totalSignups}</div>
                    <div className="stat-trend">Registros confirmados</div>
                </div>
            </div>

            <div className="glass-panel stat-card chart-card" style={{marginTop: '2rem'}}>
                <h3>Comportamiento Mensual de Ventas e Ingresos ({year})</h3>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={historicalStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                            <YAxis yAxisId="left" orientation="left" stroke="#00e676" />
                            <YAxis yAxisId="right" orientation="right" stroke="#58a6ff" />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px' }} 
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="revenue" name="Ingresos ($)" fill="#00e676" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="signups" name="Ctd. Membresías" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
