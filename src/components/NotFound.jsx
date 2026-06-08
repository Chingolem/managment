import { Compass, ArrowLeft, Home, Plus } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function NotFound({ onGoHome, onCreateProject, showCreateBtn = false }) {
  const { t } = useLanguage();

  return (
    <div style={styles.container}>
      {/* Glow Effects */}
      <div style={styles.glowPurple} />
      <div style={styles.glowBlue} />

      <div style={styles.content}>
        {/* Animated Compass Icon */}
        <div style={styles.iconWrapper}>
          <Compass size={64} style={styles.icon} />
          <div style={styles.iconPulse} />
        </div>

        {/* 404 Badge */}
        <div style={styles.badge}>
          <span>404</span>
        </div>

        {/* Text Details */}
        <h1 style={styles.title}>{t('not_found_title') || 'Lost in Time'}</h1>
        <p style={styles.subtitle}>
          {t('not_found_desc') || 
            "The workspace, project, or page you are looking for has drifted off the timeline or doesn't exist."}
        </p>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button style={styles.btnPrimary} onClick={onGoHome}>
            <Home size={16} style={{ marginRight: '6px' }} />
            {t('not_found_home') || 'Go Back Home'}
          </button>
          
          {showCreateBtn && (
            <button style={styles.btnSecondary} onClick={onCreateProject}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              {t('newProject') || 'New Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '70vh',
    width: '100%',
    padding: '2rem',
    background: 'var(--bg-dark)',
    color: 'var(--text-primary)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
    textAlign: 'center',
  },
  glowPurple: {
    position: 'absolute',
    top: '20%',
    left: '30%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glowBlue: {
    position: 'absolute',
    bottom: '20%',
    right: '30%',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '460px',
  },
  iconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '110px',
    height: '110px',
    borderRadius: '30px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  icon: {
    color: 'var(--accent-primary)',
    animation: 'compassFloat 4s ease-in-out infinite',
  },
  iconPulse: {
    position: 'absolute',
    inset: '-8px',
    borderRadius: '38px',
    border: '1px solid var(--accent-primary)',
    opacity: 0.15,
    animation: 'compassPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
    pointerEvents: 'none',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 14px',
    borderRadius: '99px',
    background: 'var(--accent-glow)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: 'var(--accent-hover)',
    fontSize: '0.8rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
    marginBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '0.92rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px var(--accent-primary)44',
    transition: 'transform 0.15s, box-shadow 0.15s',
    outline: 'none',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s',
    outline: 'none',
  }
};
