import React from 'react';
import { Sparkles, Star, GitCommit } from 'lucide-react';

export default function ChangelogPage() {
  const updates = [
    {
      version: "v2.5.0",
      date: "Today",
      changes: [
        "Complete overhaul of settings and privacy menus into dedicated pages.",
        "Custom URL routing for analytics, projects, and settings.",
        "Added inline project renaming feature.",
        "Rebranded core app engine to TIMEROI."
      ]
    },
    {
      version: "v2.4.0",
      date: "Recent Update",
      changes: [
        "Implemented Supabase cloud synchronization for multi-device support.",
        "Added real-time automatic backup system for deleted projects.",
        "Introduced the hidden Admin Dashboard for comprehensive analytics.",
        "Upgraded authentication system to secure email verification."
      ]
    },
    {
      version: "v1.0.0",
      date: "Initial Release",
      changes: [
        "Initial launch of Timeroi (formerly EditFlow PRO).",
        "Visual video status pipelines and canvas mapping.",
        "Financial forecasting and automated project analytics."
      ]
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles style={{ color: 'var(--accent-primary)' }} size={32} />
          What's New
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
          Follow our latest updates, feature releases, and improvements to the Timeroi platform.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
        {/* Vertical Timeline Line */}
        <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color)', zIndex: 0 }} />

        {updates.map((update, idx) => (
          <div key={idx} style={{ position: 'relative', zIndex: 1, paddingLeft: '3rem' }}>
            {/* Timeline Dot */}
            <div style={{
              position: 'absolute', left: '8px', top: '6px', width: '16px', height: '16px',
              background: idx === 0 ? 'var(--accent-primary)' : 'var(--bg-dark)',
              border: `2px solid ${idx === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'}`,
              borderRadius: '50%',
              boxShadow: idx === 0 ? '0 0 0 4px var(--accent-glow)' : 'none'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: idx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {update.version}
              </h2>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-panel)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                {update.date}
              </span>
              {idx === 0 && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', background: 'var(--accent-glow)', padding: '0.2rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>Latest</span>}
            </div>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {update.changes.map((change, cIdx) => (
                  <li key={cIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    <GitCommit size={16} style={{ color: 'var(--text-secondary)', marginTop: '2px', flexShrink: 0 }} />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
