import React from 'react';
import { X, Sparkles } from 'lucide-react';

const UPDATES = [
  {
    version: "v1.2.0",
    date: "June 2026",
    changes: [
      "Added real-time Cloud Sync powered by Supabase to securely save data across devices and domains.",
      "Renamed platform branding to Timeroi.",
      "Added Privacy Policy & Terms of Service modal.",
      "Added Changelog tracker to keep users informed of new features."
    ]
  },
  {
    version: "v1.1.0",
    date: "June 2026",
    changes: [
      "Added Pomodoro Timer for deep work tracking.",
      "Added comprehensive Export functionality (JSON, CSV).",
      "Redesigned the Sidebar to be collapsible and cleaner.",
      "Added deadline notifications and visual alerts."
    ]
  },
  {
    version: "v1.0.0",
    date: "May 2026",
    changes: [
      "Initial launch of EditFlow PRO (now Timeroi).",
      "Features: Canvas Boards, Video Editor CRM, Client Tracking.",
      "Customizable theme engine (Dark/Light mode).",
      "Local storage data persistence."
    ]
  }
];

export default function ChangelogModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2><Sparkles size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-primary)' }} /> What's New</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem' }}>
          {UPDATES.map((update, idx) => (
            <div key={idx} style={{ marginBottom: '2rem', borderBottom: idx !== UPDATES.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{update.version}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{update.date}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {update.changes.map((change, cIdx) => (
                  <li key={cIdx} style={{ marginBottom: '0.3rem' }}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
