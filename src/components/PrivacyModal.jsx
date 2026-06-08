import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2><ShieldAlert size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--danger, #ef4444)' }} /> Privacy Policy & Terms</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <p><strong>1. Data Storage & Privacy</strong></p>
          <p>This application ("Timeroi") stores your workspace data (including projects, checklists, notes, and analytics) securely in the cloud to provide real-time synchronization across devices.</p>
          
          <p><strong>2. No Guarantees (Disclaimer of Liability)</strong></p>
          <p>Timeroi is provided "as is" without any guarantees or warranties of any kind. <strong>We do not guarantee that your data will be permanently saved, secure, or free from corruption or loss.</strong></p>
          
          <p>By using this service, you agree that the developers and owners of Timeroi are not liable for any data loss, financial loss, missed deadlines, or damages resulting from the use of this software. We highly recommend using the built-in "Export" feature regularly to keep local backups of your critical projects.</p>
          
          <p><strong>3. Usage Agreement</strong></p>
          <p>Your continued use of Timeroi constitutes your acceptance of these terms. If you do not agree to these terms, please discontinue use immediately.</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onClose}>I Understand & Agree</button>
        </div>
      </div>
    </div>
  );
}
