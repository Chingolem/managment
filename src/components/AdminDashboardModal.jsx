import React, { useState, useEffect } from 'react';
import { X, Activity, Users, Clock, Video } from 'lucide-react';
import { supabase } from '../supabaseClient.js';

export default function AdminDashboardModal({ onClose }) {
  const [stats, setStats] = useState({ users: 0, workspaces: 0, tasks: 0, hours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // We call a secure Postgres RPC function to get the platform wide stats
        const { data, error } = await supabase.rpc('get_admin_analytics');
        if (data && !error) {
          setStats(data);
        }
      } catch (err) {
        console.error("Admin fetch error", err);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: '#09090b', color: '#fafafa', border: '1px solid #27272a' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#f43f5e" /> System Analytics (Hidden)
          </h2>
          <button className="icon-btn" onClick={onClose} style={{ color: '#fafafa' }}><X size={20} /></button>
        </div>
        
        <div className="modal-body" style={{ padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#a1a1aa' }}>Gathering intel...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} /> Total Registered Users
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>{stats.users}</div>
              </div>

              <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} /> Active Workspaces
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#3b82f6' }}>{stats.workspaces}</div>
              </div>

              <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={16} /> Total Tasks Created
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981' }}>{stats.tasks}</div>
              </div>

              <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} /> Est. Hours on Web
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f59e0b' }}>{stats.hours}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
