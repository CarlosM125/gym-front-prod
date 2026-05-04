import { useEffect, useState } from 'react';
import { useMembershipStore } from '../store/membershipStore';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Calendar, Clock, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gymLogo from '../assets/logo gym.jpeg';

// Returns "YYYY-MM-DD" in local timezone (avoids UTC offset issues)
const localIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDisplay = (iso: string) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
};

export default function DashboardScreen() {
    const { user } = useAuthStore();
    const { expiringToday, fetchExpiring, isLoading } = useMembershipStore();
    const navigate = useNavigate();

    const todayIso = localIso(new Date());
    const [fromDate, setFromDate] = useState(todayIso);
    const [toDate,   setToDate]   = useState(todayIso);

    // Fetch on mount (today by default)
    useEffect(() => {
        if (user) fetchExpiring(todayIso, todayIso);
    }, [user]); // eslint-disable-line

    // Auto-fetch whenever a date changes (only if range is valid)
    const handleFromChange = (val: string) => {
        setFromDate(val);
        if (val <= toDate) fetchExpiring(val, toDate);
    };

    const handleToChange = (val: string) => {
        setToDate(val);
        if (fromDate <= val) fetchExpiring(fromDate, val);
    };

    const handleRenewClick = (documentId?: string) => {
        if (documentId) navigate(`/pos?doc=${documentId}`);
    };

    const items = (expiringToday || []).filter(Boolean);

    const isToday = fromDate === todayIso && toDate === todayIso;
    const isSameDay = fromDate === toDate;

    return (
        <div>
            <h1 className="page-title">Control de Vencimientos</h1>
            <p className="page-subtitle">
                {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
            </p>

            {/* ── Selector de fechas ── */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    flexWrap: 'wrap'
                }}>
                    <Calendar size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                                DESDE
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                style={{ margin: 0, minWidth: '160px', cursor: 'pointer' }}
                                value={fromDate}
                                max={toDate}
                                onChange={e => handleFromChange(e.target.value)}
                            />
                        </div>

                        <span style={{ color: 'var(--text-muted)', marginTop: '18px', fontWeight: 600 }}>→</span>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                                HASTA
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                style={{ margin: 0, minWidth: '160px', cursor: 'pointer' }}
                                value={toDate}
                                min={fromDate}
                                onChange={e => handleToChange(e.target.value)}
                            />
                        </div>

                        {!isToday && (
                            <button
                                className="btn-outline"
                                style={{ marginTop: '18px', fontSize: '0.85rem' }}
                                onClick={() => {
                                    setFromDate(todayIso);
                                    setToDate(todayIso);
                                    fetchExpiring(todayIso, todayIso);
                                }}
                            >
                                Volver a hoy
                            </button>
                        )}
                    </div>

                    {isLoading && (
                        <RefreshCw size={18} style={{
                            animation: 'spin 1s linear infinite',
                            color: 'var(--text-muted)',
                            marginTop: '18px',
                            flexShrink: 0
                        }} />
                    )}
                </div>
            </div>

            {/* ── Banner de resultado ── */}
            <div className="alert-banner" style={{ marginBottom: '20px' }}>
                <AlertCircle size={20} />
                <span>
                    {isLoading
                        ? 'Consultando...'
                        : `${items.length} membres\u00eda${items.length !== 1 ? 's' : ''} — ${
                            isSameDay
                                ? isToday ? 'Hoy' : formatDisplay(fromDate)
                                : `${formatDisplay(fromDate)} → ${formatDisplay(toDate)}`
                          }`
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
                    <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p className="text-muted" style={{ margin: 0 }}>
                        No hay vencimientos en el rango seleccionado.
                    </p>
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
                            <div
                                key={item.id}
                                className="card dashboard-item"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr auto',
                                    gap: '16px',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    marginBottom: '12px'
                                }}
                            >
                                {/* Avatar */}
                                <img
                                    src={avatar
                                        || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d62020&color=fff`}
                                    alt={name}
                                    className="client-avatar"
                                    style={{ width: '56px', height: '56px', flexShrink: 0 }}
                                    onError={e => { (e.target as HTMLImageElement).src = gymLogo; }}
                                />

                                {/* Info */}
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>
                                        {name}
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        <span className="text-muted" style={{
                                            fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <Calendar size={13} />
                                            Inicio: <strong>{formatDisplay(startDate)}</strong>
                                        </span>
                                        <span className="text-muted" style={{
                                            fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <Clock size={13} />
                                            Vence:{' '}
                                            <strong style={{ color: 'var(--danger, #e05252)' }}>
                                                {formatDisplay(endDate)}
                                            </strong>
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
