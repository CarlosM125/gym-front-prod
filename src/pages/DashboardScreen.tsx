import { useEffect, useState } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Calendar, CalendarDays, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gymLogo from '../assets/logo gym.jpeg';

type FilterKey = 'today' | 'next3' | 'next7' | 'prev3' | 'prev7';

// Helper: returns ISO date string "YYYY-MM-DD"
const isoDate = (d: Date) => d.toISOString().split('T')[0];

const today = () => new Date();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode; getRange: () => { from: string; to: string } }[] = [
    {
        key: 'prev7',
        label: 'Semana anterior',
        icon: <ChevronLeft size={16} />,
        getRange: () => ({ from: isoDate(addDays(today(), -7)), to: isoDate(addDays(today(), -1)) })
    },
    {
        key: 'prev3',
        label: '3 días anteriores',
        icon: <ChevronLeft size={16} />,
        getRange: () => ({ from: isoDate(addDays(today(), -3)), to: isoDate(addDays(today(), -1)) })
    },
    {
        key: 'today',
        label: 'Hoy',
        icon: <Clock size={16} />,
        getRange: () => ({ from: isoDate(today()), to: isoDate(today()) })
    },
    {
        key: 'next3',
        label: 'Siguientes 3 días',
        icon: <ChevronRight size={16} />,
        getRange: () => ({ from: isoDate(addDays(today(), 1)), to: isoDate(addDays(today(), 3)) })
    },
    {
        key: 'next7',
        label: 'Esta semana',
        icon: <CalendarDays size={16} />,
        getRange: () => ({ from: isoDate(addDays(today(), 1)), to: isoDate(addDays(today(), 7)) })
    },
];

export default function DashboardScreen() {
    const { user } = useAuthStore();
    const { expiringToday, fetchExpiring, isLoading } = useMembershipStore();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<FilterKey>('today');

    useEffect(() => {
        if (user) {
            const range = FILTERS.find(f => f.key === 'today')!.getRange();
            fetchExpiring(range.from, range.to);
        }
    }, [user, fetchExpiring]);

    const handleFilterChange = (filter: typeof FILTERS[0]) => {
        setActiveFilter(filter.key);
        const { from, to } = filter.getRange();
        fetchExpiring(from, to);
    };

    const handleRenewClick = (documentId?: string) => {
        if (documentId) navigate(`/pos?doc=${documentId}`);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        try {
            // Parse as local date to avoid timezone offset shifting the day
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch { return dateStr; }
    };

    const items = (expiringToday || []).filter(item => item != null);
    const activeFilterDef = FILTERS.find(f => f.key === activeFilter)!;
    const activeRange = activeFilterDef.getRange();

    return (
        <div>
            <h1 className="page-title">Control de Vencimientos</h1>
            <p className="page-subtitle">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* ── 5 Filtros ── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={activeFilter === f.key ? 'btn-primary' : 'btn-outline'}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                        onClick={() => handleFilterChange(f)}
                    >
                        {f.icon} {f.label}
                    </button>
                ))}
            </div>

            {/* ── Banner de conteo ── */}
            <div className="alert-banner" style={{ marginBottom: '20px' }}>
                <AlertCircle size={20} />
                <span>
                    {isLoading
                        ? 'Cargando...'
                        : `${items.length} membres\u00eda${items.length !== 1 ? 's' : ''} — ${activeFilterDef.label} (${formatDate(activeRange.from)}${activeRange.from !== activeRange.to ? ` → ${formatDate(activeRange.to)}` : ''})`
                    }
                </span>
            </div>

            {/* ── Lista de cards ── */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                </div>
            ) : items.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p className="text-muted">No hay vencimientos para este período.</p>
                </div>
            ) : (
                <div className="dashboard-list">
                    {items.map((item: any) => {
                        const name      = item?.customerFullName || item?.userFullName || item?.user?.fullName || '—';
                        const docId     = item?.documentId || item?.user?.documentId;
                        const avatar    = item?.profileImageUrl || item?.user?.profileImageUrl;
                        const startDate = item?.startDate;
                        const endDate   = item?.endDate;

                        return (
                            <div key={item.id} className="card dashboard-item" style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                gap: '16px',
                                alignItems: 'center',
                                padding: '16px 20px',
                                marginBottom: '12px'
                            }}>
                                {/* Avatar */}
                                <img
                                    src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d62020&color=fff`}
                                    alt={name}
                                    className="client-avatar"
                                    style={{ width: '56px', height: '56px', flexShrink: 0 }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = gymLogo; }}
                                />

                                {/* Info */}
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>{name}</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        <span className="text-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={13} />
                                            Inicio: <strong>{formatDate(startDate)}</strong>
                                        </span>
                                        <span className="text-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={13} />
                                            Vence: <strong style={{ color: 'var(--danger, #e05252)' }}>{formatDate(endDate)}</strong>
                                        </span>
                                        {docId && (
                                            <span className="badge dark" style={{ fontSize: '0.75rem' }}>
                                                CC: {docId}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Acción */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <button
                                        className="btn-primary"
                                        style={{ whiteSpace: 'nowrap' }}
                                        onClick={() => handleRenewClick(docId)}
                                        disabled={!docId}
                                    >
                                        Renovar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
