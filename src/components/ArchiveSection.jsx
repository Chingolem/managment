import { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';

function DaysLeftBadge({ archivedAt, label }) {
  const [daysLeft, setDaysLeft] = useState(() =>
    Math.max(0, Math.ceil((7 * 24 * 60 * 60 * 1000 - (Date.now() - archivedAt)) / (24 * 60 * 60 * 1000)))
  );

  useEffect(() => {
    const update = () => {
      setDaysLeft(Math.max(0, Math.ceil((7 * 24 * 60 * 60 * 1000 - (Date.now() - archivedAt)) / (24 * 60 * 60 * 1000))));
    };
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [archivedAt]);

  return <span className="archive-badge">{daysLeft} {label}</span>;
}

export default function ArchiveSection({ archivedClients, onRestore, onPermanentDelete }) {
  const { t } = useLanguage();

  if (archivedClients.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem', width: '100%', maxWidth: '520px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        <Archive size={16} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('archive')} ({archivedClients.length})
        </span>
      </div>
      {archivedClients.map(c => {
        return (
          <div key={c.id} className="archive-item">
            <div className="archive-item-info">
              <div>
                <div className="archive-item-name">{c.name}</div>
                <div className="archive-item-meta">
                  <DaysLeftBadge archivedAt={c.archivedAt} label={t('daysLeft')} />
                </div>
              </div>
            </div>
            <div className="archive-item-actions">
              <button
                onClick={() => onRestore(c.id)}
                title={t('restore')}
                style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'flex' }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => onPermanentDelete(c.id)}
                title={t('deletePermanently')}
                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'flex' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}