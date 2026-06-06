import { useState } from 'react';
import { Palette, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';

const THEMES = [
  { 
    id: 'dark', 
    nameKey: 'theme_dark', 
    desc: 'AMOLED Black',
    colors: { 
      '--bg-dark': '#09090b', 
      '--bg-panel': '#18181b', 
      '--bg-panel-hover': '#27272a', 
      '--bg-surface': '#111114', 
      '--accent-primary': '#3b82f6', 
      '--accent-hover': '#60a5fa', 
      '--accent-glow': 'rgba(59, 130, 246, 0.15)', 
      '--border-color': '#27272a', 
      '--text-primary': '#fafafa', 
      '--text-secondary': '#a1a1aa' 
    } 
  },
  { 
    id: 'light', 
    nameKey: 'theme_light', 
    desc: 'Clean White',
    colors: { 
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
    } 
  },
  { 
    id: 'slate', 
    nameKey: 'theme_slate', 
    desc: 'Slate Blue',
    colors: { 
      '--bg-dark': '#0f172a', 
      '--bg-panel': '#1e293b', 
      '--bg-panel-hover': '#334155', 
      '--bg-surface': '#162035', 
      '--accent-primary': '#38bdf8', 
      '--accent-hover': '#7dd3fc', 
      '--accent-glow': 'rgba(56, 189, 248, 0.12)', 
      '--border-color': '#334155', 
      '--text-primary': '#f1f5f9', 
      '--text-secondary': '#94a3b8' 
    } 
  }
];

export default function ThemeSettingsModal({ currentTheme, onSave, onClose }) {
  const [theme, setTheme] = useState(currentTheme);
  const { t } = useLanguage();

  const applyPreset = (presetColors) => {
    setTheme(presetColors);
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '450px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}><X size={24} /></button>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={24} color="var(--accent-primary)"/> {t('changeTheme')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          {THEMES.map(tPreset => (
            <div 
              key={tPreset.id} 
              onClick={() => applyPreset(tPreset.colors)} 
              className="theme-preset-card" 
              style={{ 
                background: tPreset.colors['--bg-panel'], 
                border: `2px solid ${theme['--bg-dark'] === tPreset.colors['--bg-dark'] ? tPreset.colors['--accent-primary'] : tPreset.colors['--border-color']}` 
              }}
            >
              <div className="theme-color-dot" style={{ background: `linear-gradient(135deg, ${tPreset.colors['--accent-primary']}, ${tPreset.colors['--bg-dark']})` }} />
              <div>
                <div className="theme-preset-name" style={{ color: tPreset.colors['--text-primary'] }}>{t(tPreset.nameKey)}</div>
                <div className="theme-preset-desc" style={{ color: tPreset.colors['--text-secondary'] }}>{tPreset.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => { onSave(theme); onClose(); }}>
          <CheckCircle size={16} /> {t('theme_save_use')}
        </button>
      </div>
    </div>
  );
}