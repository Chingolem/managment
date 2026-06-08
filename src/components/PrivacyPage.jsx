import React from 'react';
import { ShieldAlert, Lock, Cloud, FileText } from 'lucide-react';

export default function PrivacyPage({ onClose }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
      <button 
        onClick={() => {
          if (onClose) {
            onClose();
          } else if (document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
          } else {
            window.location.href = '/';
          }
        }} 
        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.85rem' }}
      >
        &larr; Go Back
      </button>

      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <ShieldAlert size={32} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '1rem' }}>
          Privacy Policy & Terms
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Transparency and security are our top priorities. Here is exactly how we handle your workspace data.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <section style={{ background: 'var(--bg-panel)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cloud size={20} style={{ color: 'var(--accent-primary)' }} /> 1. Data Storage & Privacy
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            This application ("Timeroi") stores your workspace data (including projects, checklists, notes, and analytics) securely in the cloud via Supabase to provide real-time synchronization across devices. Your password is cryptographically hashed, and Row Level Security (RLS) ensures that only you can access your private data.
          </p>
        </section>

        <section style={{ background: 'var(--bg-panel)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Lock size={20} style={{ color: 'var(--warning)' }} /> 2. No Guarantees (Disclaimer of Liability)
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
            Timeroi is provided "as is" without any guarantees or warranties of any kind. <strong style={{ color: 'var(--text-primary)' }}>We do not guarantee that your data will be permanently saved, secure, or free from corruption or loss.</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            By using this service, you agree that the developers and owners of Timeroi are not liable for any data loss, financial loss, missed deadlines, or damages resulting from the use of this software. We highly recommend using the built-in "Export" feature regularly to keep local backups of your critical projects.
          </p>
        </section>

        <section style={{ background: 'var(--bg-panel)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} style={{ color: 'var(--success)' }} /> 3. Usage Agreement
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            Your continued use of Timeroi constitutes your explicit acceptance of these terms. If you do not agree to these terms, please delete your account and discontinue use immediately.
          </p>
        </section>

      </div>
    </div>
  );
}
