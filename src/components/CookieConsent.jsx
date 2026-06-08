import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function CookieConsent() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user has not chosen yet
    const consent = localStorage.getItem('timeroi_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
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
        <h3 style={styles.title}>{t('cookie_title') || 'Cookie Settings'}</h3>
        <p style={styles.description}>
          {t('cookie_description') || 
            'We use essential cookies and local storage to secure sessions, remember themes, and preserve active project timers. We also collect basic usage statistics to improve your experience.'}
        </p>

        <div style={styles.buttonContainer}>
          <button style={styles.btnSecondary} onClick={handleAcceptEssential}>
            {t('cookie_essential_only') || 'Essential Only'}
          </button>
          <button style={styles.btnPrimary} onClick={handleAcceptAll}>
            {t('cookie_accept_all') || 'Accept All'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(9, 9, 11, 0.65)', // Dark translucent backdrop
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.03)',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
    animation: 'cookieCenterPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: '0 0 12px 0',
  },
  description: {
    fontSize: '0.85rem',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    margin: '0 0 24px 0',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  btnPrimary: {
    flex: 1,
    background: 'var(--text-primary)',
    color: 'var(--bg-panel)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    outline: 'none',
  },
  btnSecondary: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s',
    outline: 'none',
  }
};
