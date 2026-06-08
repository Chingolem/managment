import { useState, useEffect } from 'react';
import { Plus, RotateCcw, Trash2, Download, Upload, Palette, X, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth, WORKSPACE_CONFIGS } from '../hooks/useAuth.jsx';

function ArchiveDaysItem({ c, t, onRestore, onPermanentDelete }) {
  const [daysLeft, setDaysLeft] = useState(() => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((oneWeek - (Date.now() - c.archivedAt)) / (24 * 60 * 60 * 1000)));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      setDaysLeft(Math.max(0, Math.ceil((oneWeek - (Date.now() - c.archivedAt)) / (24 * 60 * 60 * 1000))));
    }, 60000);
    return () => clearInterval(interval);
  }, [c.archivedAt]);

  return (
    <div className="archive-item" style={{ padding: '0.5rem', margin: '0 0.5rem 0.35rem' }}>
      <div className="archive-item-info">
        <div>
          <div className="archive-item-name">{c.name}</div>
          <div className="archive-item-meta"><span className="archive-badge">{daysLeft} {t('daysLeft')}</span></div>
        </div>
      </div>
      <div className="archive-item-actions">
        <button className="btn-ghost" onClick={() => onRestore(c.id)} style={{ padding: '0.25rem', color: 'var(--success)' }} aria-label="Restore project">
          <RotateCcw size={14} />
        </button>
        <button className="btn-ghost" onClick={() => onPermanentDelete(c.id)} style={{ padding: '0.25rem', color: 'var(--danger)' }} aria-label="Delete project permanently">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  clients, activeClientId, onSelectClient, onAddClick,
  archivedClients, onRestore, onPermanentDelete,
  onExport, onImport, onThemeClick, onPrivacyClick, onChangelogClick, onProfileClick, onAdminClick,
  isMobileOpen, onCloseMobile,
  collapsed, onToggleCollapse
}) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const config = WORKSPACE_CONFIGS[user?.role || 'video_editor'];

  return (
    <>
      <div className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} onClick={onCloseMobile} />
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`} style={{
        width: collapsed ? '64px' : 'var(--sidebar-width)',
        minWidth: collapsed ? '64px' : 'var(--sidebar-width)',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div className="sidebar-header" style={{ padding: collapsed ? '1rem 0.75rem' : '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!collapsed && (
              <div>
                <div className="sidebar-logo">TIMEROI</div>
                <div className="sidebar-subtitle">Management</div>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.35rem',
                borderRadius: '8px',
                transition: 'all 0.15s',
                margin: collapsed ? '0 auto' : '0'
              }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </div>

        {!collapsed && <div className="sidebar-section-title">{t('projects')}</div>}
        <div className="sidebar-clients" style={{ padding: collapsed ? '0.25rem' : '0.5rem' }}>
          {clients.map(c => {
            const done = c.videos.filter(v => v.status === 'finished').length;
            return (
              <button
                key={c.id}
                className={`client-item ${activeClientId === c.id ? 'active' : ''}`}
                onClick={() => { onSelectClient(c.id); onCloseMobile(); }}
                style={collapsed ? { justifyContent: 'center', padding: '0.6rem' } : {}}
                title={collapsed ? `${c.name} (${done}/${c.videos.length})` : undefined}
              >
                <div className="client-avatar">{c.name.charAt(0).toUpperCase()}</div>
                {!collapsed && (
                  <div className="client-info">
                    <span className="client-name">{c.name}</span>
                    <span className="client-meta">{done}/{c.videos.length} {t(config.pluralKey)}</span>
                  </div>
                )}
              </button>
            );
          })}
          <button
            className="sidebar-add-btn"
            onClick={onAddClick}
            style={collapsed ? { justifyContent: 'center', padding: '0.6rem', border: 'none' } : {}}
            title={collapsed ? t('newProject') : undefined}
          >
            <Plus size={16} />
            {!collapsed && t('newProject')}
          </button>

          {!collapsed && archivedClients.length > 0 && (
            <>
              <div className="sidebar-section-title" style={{ padding: '1rem 0.5rem 0.5rem' }}>{t('archive')} ({archivedClients.length})</div>
              {archivedClients.map(c => (
                  <ArchiveDaysItem key={c.id} c={c} t={t} onRestore={onRestore} onPermanentDelete={onPermanentDelete} />
              ))}
            </>
          )}
        </div>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: collapsed ? '0.75rem 0.5rem' : '1rem 1.5rem' }}>
          {user && !collapsed && (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.5rem 0.75rem', 
                background: 'var(--bg-surface)', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-primary)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.username}
                  </span>
                </div>
                <button 
                  onClick={logout} 
                  title={t('logout_btn')} 
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--danger)', 
                    cursor: 'pointer', 
                    padding: '0.25rem', 
                    display: 'flex', 
                    alignItems: 'center',
                    borderRadius: '6px'
                  }}
                  aria-label={t('logout_btn')}
                >
                  <LogOut size={16} />
                </button>
              </div>

            </>
          )}

          {collapsed && user && (
            <button 
              onClick={logout}
              title={t('logout_btn')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--danger)', 
                cursor: 'pointer', 
                padding: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                margin: '0 auto'
              }}
            >
              <LogOut size={18} />
            </button>
          )}

          {!collapsed && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button className="sidebar-footer-btn" onClick={onExport} title={t('exportData')} style={{ flex: 1, justifyContent: 'center' }} aria-label={t('exportData')}>
                  <Download size={16} />
                </button>
                <label className="sidebar-footer-btn" title={t('importData')} style={{ flex: 1, justifyContent: 'center', margin: 0, textAlign: 'center' }}>
                  <Upload size={16} />
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
                </label>
              </div>
              
              <button className="sidebar-footer-btn" onClick={onThemeClick}>
                <Palette size={18} /> {t('changeTheme')}
              </button>
              
              {user?.username?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() && (
                <button className="sidebar-footer-btn" onClick={onAdminClick} style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                  Admin Dashboard
                </button>
              )}
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="sidebar-footer-btn" onClick={onProfileClick} style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>
                  Profile
                </button>
                <button className="sidebar-footer-btn" onClick={onChangelogClick} style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>
                  What's New
                </button>
                <button className="sidebar-footer-btn" onClick={onPrivacyClick} style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>
                  Privacy
                </button>
              </div>
            </>
          )}

          {collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
              <button className="sidebar-footer-btn" onClick={onThemeClick} title={t('changeTheme')} style={{ justifyContent: 'center', padding: '0.5rem' }}>
                <Palette size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}