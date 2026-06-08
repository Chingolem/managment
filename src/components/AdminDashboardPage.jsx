import React, { useState, useEffect } from 'react';
import { Activity, Users, Clock, Video, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabaseClient.js';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, workspaces: 0, tasks: 0, hours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
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
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <ShieldAlert size={32} style={{ color: 'var(--danger)' }} /> System Administration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>
          Platform-wide metrics and system recovery controls.
        </p>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>Gathering secure intel...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <Users size={16} /> Registered Users
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>{stats.users}</div>
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <Activity size={16} /> Active Workspaces
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-primary)' }}>{stats.workspaces}</div>
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <Video size={16} /> Total Tasks Created
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--success)' }}>{stats.tasks}</div>
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <Clock size={16} /> Est. Platform Hours
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--warning)' }}>{stats.hours}</div>
          </div>
        </div>
      )}
    </div>
  );
}
