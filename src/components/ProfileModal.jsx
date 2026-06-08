import React, { useState } from 'react';
import { X, Save, Lock, Mail, User } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import { useToastContext } from '../hooks/useToast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ProfileModal({ onClose }) {
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const [email, setEmail] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const updates = {};
    if (email !== user?.username) updates.email = email;
    if (password.trim() !== '') updates.password = password;

    if (Object.keys(updates).length === 0) {
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser(updates);

    if (updateError) {
      error(updateError.message);
    } else {
      success('Profile updated successfully! If you changed your email, check your inbox.');
      setPassword('');
      if (updates.password && !updates.email) {
        onClose();
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2><User size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-primary)' }} /> Profile Settings</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="auth-modal-field">
            <label className="auth-modal-label"><Mail size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Email Address</label>
            <input
              type="email"
              className="auth-modal-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-modal-field">
            <label className="auth-modal-label"><Lock size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> New Password</label>
            <input
              type="password"
              className="auth-modal-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {isSubmitting ? 'Saving...' : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
