import { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, Info, Settings, ArrowRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function CookieConsent() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('timeroi_cookie_consent');
    if (!consent) {
      // Delay showing the banner slightly for a premium feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('timeroi_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('timeroi_cookie_consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Decorative subtle background gradient */}
        <div style={styles.glow} />

        <div style={styles.header}>
          <div style={styles.titleWrapper}>
            <div style={styles.iconContainer}>
              <Cookie size={20} style={styles.icon} />
            </div>
            <h3 style={styles.title}>{t('cookie_title') || 'Cookie Preference'}</h3>
          </div>
          <button style={styles.closeBtn} onClick={handleAcceptEssential} title="Dismiss">
            <X size={16} />
          </button>
        </div>

        <p style={styles.description}>
          {t('cookie_description') || 
            'We use cookies and local storage to keep you logged in, save your custom UI themes, preserve active timer progress, and secure your session data.'}
        </p>

        {/* Learn More / Accordion trigger */}
        <button style={styles.detailsTrigger} onClick={() => setShowDetails(!showDetails)}>
          <Info size={14} style={{ marginRight: '4px' }} />
          {showDetails ? (t('cookie_hide_details') || 'Hide cookie details') : (t('cookie_show_details') || 'Learn which cookies we use')}
        </button>

        {showDetails && (
          <div style={styles.detailsPanel}>
            <div style={styles.detailItem}>
              <div style={styles.detailHeader}>
                <span style={styles.detailName}>{t('cookie_ess_title') || 'Essential Workspace State'}</span>
                <span style={styles.badge}>{t('cookie_always_active') || 'Always Active'}</span>
              </div>
              <p style={styles.detailDesc}>
                {t('cookie_ess_desc') || 'Stores active client IDs, timer states, and user sessions. Required for core task management to function.'}
              </p>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailHeader}>
                <span style={styles.detailName}>{t('cookie_pref_title') || 'User Preferences'}</span>
                <span style={styles.badge}>{t('cookie_always_active') || 'Always Active'}</span>
              </div>
              <p style={styles.detailDesc}>
                {t('cookie_pref_desc') || 'Remembers selected language, sidebar view state, and custom dark/light color themes.'}
              </p>
            </div>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button style={styles.btnSecondary} onClick={handleAcceptEssential}>
            {t('cookie_essential_only') || 'Essential Only'}
          </button>
          <button style={styles.btnPrimary} onClick={handleAcceptAll}>
            {t('cookie_accept_all') || 'Accept All'}
            <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    left: '24px',
    maxWidth: '420px',
    zIndex: 9999,
    fontFamily: "'Inter', sans-serif",
    animation: 'cookieSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    // Responsive fallback for desktop
    marginInlineStart: 'auto',
  },
  container: {
    position: 'relative',
    background: 'rgba(24, 24, 27, 0.75)', // Glassmorphic zinc-900 transparent
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '-40px',
    right: '-40px',
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    position: 'relative',
    zIndex: 1,
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
  },
  icon: {
    flexShrink: 0,
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#fafafa',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fafafa',
    }
  },
  description: {
    fontSize: '0.82rem',
    lineHeight: '1.45',
    color: '#d4d4d8',
    marginBottom: '12px',
    position: 'relative',
    zIndex: 1,
  },
  detailsTrigger: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
    display: 'inline-flex',
    alignItems: 'center',
    marginBottom: '14px',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.85,
    }
  },
  detailsPanel: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '14px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailName: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#e4e4e7',
  },
  badge: {
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  detailDesc: {
    fontSize: '0.7rem',
    color: '#a1a1aa',
    lineHeight: '1.4',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    position: 'relative',
    zIndex: 1,
  },
  btnPrimary: {
    flex: 1,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
    transition: 'transform 0.15s, filter 0.15s',
    outline: 'none',
  },
  btnSecondary: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#fafafa',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  }
};
