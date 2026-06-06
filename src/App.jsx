/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { ClipboardList, BarChart3, Trash2, Plus, Network, Archive } from 'lucide-react';

import { sanitize } from './hooks/sanitize.js';
import { useToastContext } from './hooks/useToast.jsx';
import { useLanguage } from './hooks/useLanguage.jsx';
import { useAuth, WORKSPACE_CONFIGS, getTimerKeys } from './hooks/useAuth.jsx';
import Sidebar from './components/Sidebar.jsx';
import SetupForm from './components/SetupForm.jsx';
import ArchiveSection from './components/ArchiveSection.jsx';
import ToastContainer from './components/Toast.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import VideoEditorWorkspace from './components/VideoEditorWorkspace.jsx';

const Analytics = lazy(() => import('./components/NewAnalytics.jsx'));
const VideoOverlay = lazy(() => import('./components/VideoOverlay.jsx'));
const CanvasBoard = lazy(() => import('./components/CanvasBoard.jsx'));
const ThemeSettingsModal = lazy(() => import('./components/ThemeSettingsModal.jsx'));
const PomodoroTimer = lazy(() => import('./components/PomodoroTimer.jsx'));
const ExportModal = lazy(() => import('./components/ExportModal.jsx'));

const DEFAULT_THEME = {
  '--bg-dark': '#f4f4f5',
  '--bg-panel': '#ffffff',
  '--bg-panel-hover': '#f4f4f5',
  '--bg-surface': '#fafafa',
  '--accent-primary': '#2563eb',
  '--accent-hover': '#3b82f6',
  '--accent-glow': 'rgba(37, 99, 235, 0.1)',
  '--border-color': '#e4e4e7',
  '--text-primary': '#09090b',
  '--text-secondary': '#71717a'
};

function AppContent() {
  const { user, logout } = useAuth();
  const { success, error } = useToastContext();
  const { t, language } = useLanguage();

  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [archivedClients, setArchivedClients] = useState([]);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [fullScreenVideoId, setFullScreenVideoId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [previousUser, setPreviousUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() => !!user);
  const [showPomodoro, setShowPomodoro]   = useState(false);
  const [showExport,   setShowExport]     = useState(false);

  const workspaceClients = useMemo(() => {
    return clients.filter(c => (c.role || 'video_editor') === (user?.role || 'video_editor'));
  }, [clients, user?.role]);

  const workspaceArchivedClients = useMemo(() => {
    return archivedClients.filter(c => (c.role || 'video_editor') === (user?.role || 'video_editor'));
  }, [archivedClients, user?.role]);

  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    if (user && !previousUser) {
      const timer = setTimeout(() => {
        setIsAuthLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setPreviousUser(user);
  }, [user, previousUser]);

  // Deadline notifications (runs once per login session)
  useEffect(() => {
    if (!user || !clients.length) return;
    const today = new Date().toISOString().split('T')[0];
    const keys = getTimerKeys(user.role);
    clients.forEach(c => {
      c.videos?.forEach(v => {
        const vStatus = v[keys.status] || 'not_started';
        if (v.deadline && v.deadline <= today && vStatus !== 'finished') {
          const key = `notif_${c.id}_${v.id}_${v.deadline}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            if (Notification.permission === 'granted') {
              new Notification(`⚠️ Overdue: ${v.note || 'A task'}`, {
                body: `${c.name} · Due ${v.deadline}`,
              });
            }
          }
        }
      });
    });
  }, [user, clients]);

  // Load user-specific configurations on login
  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    if (!user) return;

    const uPrefix = `editflow_crm_${user.username.toLowerCase()}_`;

    // Load theme
    const savedTheme = localStorage.getItem(uPrefix + 'theme');
    if (savedTheme) {
      try { setTheme(JSON.parse(savedTheme)); } catch (e) { setTheme(DEFAULT_THEME); }
    } else {
      setTheme(DEFAULT_THEME);
    }

    // Load clients
    const savedClients = localStorage.getItem(uPrefix + 'clients');
    if (savedClients) {
      try { setClients(JSON.parse(savedClients)); } catch (e) { setClients([]); }
    } else {
      setClients([]);
    }

    // Load active client
    const savedActive = localStorage.getItem(uPrefix + 'active_client');
    setActiveClientId(savedActive || null);

    // Load archive
    const savedArchive = localStorage.getItem(uPrefix + 'archive');
    if (savedArchive) {
      try { setArchivedClients(JSON.parse(savedArchive)); } catch (e) { setArchivedClients([]); }
    } else {
      setArchivedClients([]);
    }
  }, [user]);

  // Sync state changes to user-specific localStorage keys
  useEffect(() => {
    if (!user) return;
    const uPrefix = `editflow_crm_${user.username.toLowerCase()}_`;
    localStorage.setItem(uPrefix + 'theme', JSON.stringify(theme));
  }, [theme, user]);

  useEffect(() => {
    if (!user) return;
    const uPrefix = `editflow_crm_${user.username.toLowerCase()}_`;
    localStorage.setItem(uPrefix + 'clients', JSON.stringify(clients));
  }, [clients, user]);

  useEffect(() => {
    if (!user) return;
    const uPrefix = `editflow_crm_${user.username.toLowerCase()}_`;
    if (activeClientId) {
      localStorage.setItem(uPrefix + 'active_client', activeClientId);
    } else {
      localStorage.removeItem(uPrefix + 'active_client');
    }
  }, [activeClientId, user]);

  useEffect(() => {
    if (!user) return;
    const uPrefix = `editflow_crm_${user.username.toLowerCase()}_`;
    localStorage.setItem(uPrefix + 'archive', JSON.stringify(archivedClients));
  }, [archivedClients, user]);

  // Apply theme variables globally
  useEffect(() => {
    Object.keys(theme).forEach(key => {
      document.documentElement.style.setProperty(key, theme[key]);
    });
  }, [theme]);

  // Cleanup archive items older than 7 days
  useEffect(() => {
    if (!user) return;
    const cleanup = () => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      setArchivedClients(prev => prev.filter(c => Date.now() - c.archivedAt < oneWeek));
    };
    cleanup();
    const interval = setInterval(cleanup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, setArchivedClients]);

  // Handle active client redirection if current active client is deleted or role switches
  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    if (workspaceClients.length > 0 && (!activeClientId || !workspaceClients.find(c => c.id === activeClientId))) {
      setActiveClientId(workspaceClients[0].id);
    } else if (workspaceClients.length === 0) {
      setActiveClientId(null);
    }
  }, [workspaceClients, activeClientId, setActiveClientId]);

  // Handle Escape key closure of modal
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape' && fullScreenVideoId) {
        setFullScreenVideoId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullScreenVideoId]);

  const handleCreateClient = useCallback(({ name, total, defaultPrice }) => {
    const newClient = {
      id: 'client_' + Date.now(),
      name: sanitize(name, 64),
      role: user?.role || 'video_editor',
      createdAt: Date.now(),
      videos: Array.from({ length: total }, (_, i) => ({
        id: i + 1,
        status: 'not_started',
        totalSeconds: 0,
        lastStartTime: null,
        price: defaultPrice,
        note: '',
        sourceLink: '',
        finalLink: '',
        deadline: '',
        checklist: [],
        showOnCanvas: false,
        videoLength: ''
      }))
    };
    setClients(prev => [...prev, newClient]);
    setActiveClientId(newClient.id);
    setIsAddingClient(false);
    success(t('projectCreated'));
  }, [user?.role, setClients, setActiveClientId, success, t]);

  const archiveClient = useCallback((clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setArchivedClients(prev => [...prev, { ...client, archivedAt: Date.now() }]);
    setClients(prev => prev.filter(c => c.id !== clientId));
    setDeleteConfirmId(null);
    success(t('projectArchived'));
  }, [clients, setClients, setArchivedClients, success, t]);

  const restoreClient = useCallback((clientId) => {
    const client = archivedClients.find(c => c.id === clientId);
    if (!client) return;
    const { archivedAt, ...restored } = client;
    setClients(prev => [...prev, restored]);
    setArchivedClients(prev => prev.filter(c => c.id !== clientId));
    setActiveClientId(restored.id);
    success(t('projectRestored'));
  }, [archivedClients, setClients, setArchivedClients, setActiveClientId, success, t]);

  const permanentDeleteClient = useCallback((clientId) => {
    if (!window.confirm(t('confirmDelete'))) return;
    setArchivedClients(prev => prev.filter(c => c.id !== clientId));
    success(t('projectDeleted'));
  }, [setArchivedClients, success, t]);

  const handleExport = useCallback(() => {
    const data = { clients, archivedClients, theme };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EditFlow_Backup_${user?.username || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success(t('dataExported'));
  }, [clients, archivedClients, theme, user, success, t]);

  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.clients) setClients(data.clients);
        if (data.archivedClients) setArchivedClients(data.archivedClients);
        if (data.theme) setTheme(data.theme);
        success(t('importSuccess'));
      } catch (err) {
        error(t('importFailed'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setClients, setArchivedClients, setTheme, success, error, t]);

  const activeClient = useMemo(() => workspaceClients.find(c => c.id === activeClientId), [workspaceClients, activeClientId]);

  const updateVideoForActiveClient = useCallback((videoId, updates) => {
    setClients(prev => prev.map(c => {
      if (c.id === activeClientId) {
        return { ...c, videos: c.videos.map(v => v.id === videoId ? { ...v, ...updates } : v) };
      }
      return c;
    }));
  }, [activeClientId, setClients]);

  const updateClientInfo = useCallback((clientId, updates) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
  }, [setClients]);

  const fullVideoObj = useMemo(() => {
    if (!fullScreenVideoId || !activeClient) return null;
    return activeClient.videos.find(v => v.id === fullScreenVideoId) || null;
  }, [fullScreenVideoId, activeClient]);

  const localeStr = language === 'ka' ? 'ka-GE' : 'en-US';

  // If not authenticated, show AuthScreen
  if (!user) {
    return (
      <>
        <ToastContainer />
        <AuthScreen theme={theme} setTheme={setTheme} />
      </>
    );
  }

  // Facebook-style shimmering loading placeholder
  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-panel)',
        color: 'var(--text-primary)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <style>{`
          @keyframes facebookShimmer {
            0% { background-position: -468px 0; }
            100% { background-position: 468px 0; }
          }
          .skeleton-shimmer {
            animation: facebookShimmer 1.5s linear infinite forwards;
            background: linear-gradient(to right, #f4f4f5 8%, #e4e4e7 18%, #f4f4f5 33%);
            background-size: 800px 104px;
            position: relative;
          }
          .dark-theme-shimmer .skeleton-shimmer {
            background: linear-gradient(to right, #18181b 8%, #27272a 18%, #18181b 33%);
            background-size: 800px 104px;
          }
        `}</style>

        <div className={theme['--bg-dark'] === '#09090b' ? 'dark-theme-shimmer' : ''} style={{ display: 'flex', width: '100%', height: '100%' }}>
          {/* Mock Sidebar */}
          <div style={{
            width: '260px',
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-panel)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            <div className="skeleton-shimmer" style={{ width: '130px', height: '24px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
              <div className="skeleton-shimmer" style={{ width: '80%', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '60%', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '70%', height: '18px', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Mock Content */}
          <div style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton-shimmer" style={{ width: '180px', height: '28px', borderRadius: '6px' }} />
                <div className="skeleton-shimmer" style={{ width: '120px', height: '16px', borderRadius: '4px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div className="skeleton-shimmer" style={{ height: '90px', borderRadius: '12px' }} />
              <div className="skeleton-shimmer" style={{ height: '90px', borderRadius: '12px' }} />
              <div className="skeleton-shimmer" style={{ height: '90px', borderRadius: '12px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: '12px' }} />
              <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: '12px' }} />
              <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: '12px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const config = WORKSPACE_CONFIGS[user.role || 'video_editor'];

  // Setup client workspace screen if new or no clients exist
  if (!activeClient || workspaceClients.length === 0 || isAddingClient) {
    return (
      <div className="setup-screen">
        {isThemeModalOpen && <Suspense fallback={null}><ThemeSettingsModal currentTheme={theme} onSave={setTheme} onClose={() => setIsThemeModalOpen(false)} /></Suspense>}
        <ToastContainer />

        {/* Toggle Theme / Settings Button */}
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button className="sidebar-footer-btn" onClick={logout} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-panel)', padding: '0.5rem 1rem' }}>
            {t('logout_btn')}
          </button>
          <button className="icon-btn" onClick={() => setIsThemeModalOpen(true)} title={t('changeTheme')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>

        <div className="setup-header">
          <h1>EditFlow PRO</h1>
          <p>{t('subtitle')}</p>
        </div>
        {workspaceClients.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setIsAddingClient(false)}>{t('goBack')}</button>
          </div>
        )}
        <SetupForm onCreate={handleCreateClient} />
        <ArchiveSection archivedClients={workspaceArchivedClients} onRestore={restoreClient} onPermanentDelete={permanentDeleteClient} />
      </div>
    );
  }

  return (
    <>
      {isThemeModalOpen && <Suspense fallback={null}><ThemeSettingsModal currentTheme={theme} onSave={setTheme} onClose={() => setIsThemeModalOpen(false)} /></Suspense>}
      <ToastContainer />

      {fullVideoObj && (
        <Suspense fallback={null}><VideoOverlay video={fullVideoObj} updateVideo={updateVideoForActiveClient} onClose={() => setFullScreenVideoId(null)} /></Suspense>
      )}

      <div className="dashboard-layout">
        <Sidebar
          clients={workspaceClients}
          activeClientId={activeClientId}
          onSelectClient={setActiveClientId}
          onAddClick={() => setIsAddingClient(true)}
          archivedClients={workspaceArchivedClients}
          onRestore={restoreClient}
          onPermanentDelete={permanentDeleteClient}
          onExport={handleExport}
          onImport={handleImport}
          onThemeClick={() => setIsThemeModalOpen(true)}
          isMobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
        />

        <main className="main-content">
          {!activeClient ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem',
              color: 'var(--text-secondary)',
              padding: '4rem 2rem',
              textAlign: 'center'
            }}>
              <ClipboardList size={64} style={{ color: 'var(--accent-primary)', opacity: 0.6 }} />
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>No Active Projects</h2>
              <p style={{ maxWidth: '400px', margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                Create a new project workspace to start tracking tasks, time, assets, checklists, and visual boards.
              </p>
              <button className="btn btn-primary" onClick={() => setIsAddingClient(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> {t('newProject')}
              </button>
            </div>
          ) : (
            <>
              <div className="top-bar">
                <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)} title="Menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                  </button>
                  <div>
                    <h1>{activeClient.name}</h1>
                    <p>
                      {activeClient.videos.length} {t(config.pluralKey)} • {t('createdOn')} {new Date(activeClient.createdAt).toLocaleDateString(localeStr)}
                    </p>
                  </div>
                </div>
                <div className="top-bar-actions">
                  <button className={`btn ${viewMode === 'dashboard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('dashboard')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <ClipboardList size={16} /> {t('manage')}
                  </button>
                  <button className={`btn ${viewMode === 'canvas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('canvas')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <Network size={16} /> Canvas
                  </button>
                  <button className={`btn ${viewMode === 'analytics' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('analytics')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <BarChart3 size={16} /> Analytics
                  </button>

                  <button
                    onClick={() => setShowPomodoro(p => !p)}
                    className={`btn ${showPomodoro ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    title="Pomodoro Timer"
                  >
                    🍅 Pomodoro
                  </button>
                  <button
                    onClick={() => setShowExport(true)}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    title="Export Report"
                  >
                    📤 Export
                  </button>

                  {deleteConfirmId === activeClientId ? (
                    <>
                      <button className="btn btn-danger-outline" style={{ fontSize: '0.8rem' }} onClick={() => archiveClient(activeClientId)}>
                        <Archive size={14} /> {t('moveToArchive')}
                      </button>
                      <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setDeleteConfirmId(null)}>
                        {t('cancel')}
                      </button>
                    </>
                  ) : (
                    <button className="icon-btn" onClick={() => setDeleteConfirmId(activeClientId)} title={t('archiveTooltip')} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button className="icon-btn" onClick={() => setIsAddingClient(true)} title={t('newProject')}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Pomodoro floating widget */}
              {showPomodoro && <Suspense fallback={null}><PomodoroTimer onClose={() => setShowPomodoro(false)} /></Suspense>}

              {/* Export modal */}
              {showExport && <Suspense fallback={null}><ExportModal client={activeClient} onClose={() => setShowExport(false)} /></Suspense>}

              {viewMode === 'analytics' ? (
                <Suspense fallback={<div className="content-area"><p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('loading')}</p></div>}>
                  <Analytics client={activeClient} />
                </Suspense>
              ) : viewMode === 'canvas' ? (
                <div className="content-area">
                  <Suspense fallback={<div className="content-area"><p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('loading')}</p></div>}>
                  <CanvasBoard 
                    client={activeClient} 
                    updateVideo={updateVideoForActiveClient} 
                    updateClient={updateClientInfo}
                    onOpenFull={(id) => setFullScreenVideoId(id)}
                  />
                  </Suspense>
                </div>
              ) : (
                <div className="content-area">
                  <VideoEditorWorkspace
                    client={activeClient}
                    updateVideo={updateVideoForActiveClient}
                    updateClient={updateClientInfo}
                    onTriggerClientReview={(vid) => {
                      void vid;
                    }}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

export default App;

function App() {
  return <AppContent />;
}
