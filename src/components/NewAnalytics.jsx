import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Clock, DollarSign, CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import { useAuth, getTimerKeys } from '../hooks/useAuth.jsx';

function formatTime(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const STATUS_COLORS = {
  not_started: '#71717a',
  started:     '#3b82f6',
  paused:      '#f59e0b',
  finished:    '#10b981',
};

const GRADIENT_COLORS = {
  blue: ['#3b82f6', '#1d4ed8'],
  green: ['#10b981', '#059669'],
  amber: ['#f59e0b', '#d97706'],
  purple: ['#8b5cf6', '#6d28d9'],
  red: ['#ef4444', '#dc2626'],
};

const TooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fafafa',
  fontSize: '0.8rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '0.65rem 0.85rem'
};

function scopeBtnStyle(active) {
  return {
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
    color: active ? '#ffffff' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 4px 12px var(--accent-primary)33' : 'none',
    outline: 'none',
  };
}

function filterBtnStyle(active) {
  return {
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: active ? 'var(--text-primary)' : 'var(--bg-surface)',
    color: active ? 'var(--bg-panel)' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  };
}

function GlowStatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${gradient[0]}12 0%, ${gradient[0]}06 100%)`,
      border: `1px solid ${gradient[0]}25`,
      borderRadius: '16px',
      padding: '1.25rem 1.4rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      animation: `fadeSlideIn 0.5s ease ${delay}s both`
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${gradient[0]}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px',
        background: `linear-gradient(135deg, ${gradient[0]}30, ${gradient[1]}15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 12px ${gradient[0]}20`
      }}>
        <Icon size={20} color={gradient[0]} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: gradient[0], marginTop: '0.15rem', fontWeight: '600' }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartPanel({ title, emoji, children, height = '240px' }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: '18px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'border-color 0.2s'
    }}>
      <h3 style={{
        fontSize: '0.82rem',
        fontWeight: '800',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>{emoji}</span> {title}
      </h3>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}

export default function Analytics({ client, activeClients = [], archivedClients = [] }) {
  const { user } = useAuth();
  const keys = getTimerKeys(user?.role || 'video_editor');

  const [scope, setScope] = useState('current'); // 'current', 'all_active', 'archived'
  const [timeframe, setTimeframe] = useState('all'); // 'all', 'month', 'week', 'day'

  // Filter videos based on scope and settings timeframe
  const selectedVideos = useMemo(() => {
    let rawVideos = [];
    if (scope === 'current') {
      rawVideos = client?.videos || [];
    } else if (scope === 'all_active') {
      activeClients.forEach(c => {
        if (c.videos) rawVideos.push(...c.videos);
      });
    } else if (scope === 'archived') {
      archivedClients.forEach(c => {
        if (c.videos) rawVideos.push(...c.videos);
      });
    }

    const now = Date.now();
    return rawVideos.filter(v => {
      // If timeframe is Daily (within 24 hours of creation/timer update)
      if (timeframe === 'day') {
        const timeLimit = 24 * 60 * 60 * 1000;
        return (now - v.id) <= timeLimit || (v[keys.lastStopTime] && (now - v[keys.lastStopTime]) <= timeLimit);
      }
      // Weekly (7 days)
      if (timeframe === 'week') {
        const timeLimit = 7 * 24 * 60 * 60 * 1000;
        return (now - v.id) <= timeLimit || (v[keys.lastStopTime] && (now - v[keys.lastStopTime]) <= timeLimit);
      }
      // Monthly (30 days)
      if (timeframe === 'month') {
        const timeLimit = 30 * 24 * 60 * 60 * 1000;
        return (now - v.id) <= timeLimit || (v[keys.lastStopTime] && (now - v[keys.lastStopTime]) <= timeLimit);
      }
      return true;
    });
  }, [scope, timeframe, client, activeClients, archivedClients, keys]);

  const stats = useMemo(() => {
    const done = selectedVideos.filter(v => (v[keys.status] || 'not_started') === 'finished');
    const totalSec = selectedVideos.reduce((a, v) => a + (v[keys.totalSeconds] || 0), 0);
    const totalIdleSec = selectedVideos.reduce((a, v) => a + (v[keys.idleGaps] || []).reduce((s, g) => s + g, 0), 0);
    const activeWorkSec = Math.max(0, totalSec - totalIdleSec);
    const revenue = done.reduce((a, v) => a + (v.price || 0), 0);
    const totalPotential = selectedVideos.reduce((a, v) => a + (v.price || 0), 0);
    const avgTime = done.length ? Math.round(totalSec / done.length) : 0;
    const overdue = selectedVideos.filter(v => v.deadline && new Date(v.deadline) < new Date() && (v[keys.status] || 'not_started') !== 'finished').length;
    return { done: done.length, total: selectedVideos.length, totalSec, totalIdleSec, activeWorkSec, revenue, totalPotential, avgTime, overdue };
  }, [selectedVideos, keys]);

  const timeData = useMemo(() =>
    selectedVideos.map((v, i) => ({
      name: v.note?.slice(0, 14) || `#${i + 1}`,
      minutes: Math.round((v[keys.totalSeconds] || 0) / 60),
      idleMinutes: Math.round((v[keys.idleGaps] || []).reduce((s, g) => s + g, 0) / 60),
      status: v[keys.status] || 'not_started'
    })),
  [selectedVideos, keys]);

  const statusData = useMemo(() => {
    const counts = {};
    selectedVideos.forEach(v => {
      const s = v[keys.status] || 'not_started';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: status === 'not_started' ? 'Pending' : status === 'started' ? 'Active' : status === 'paused' ? 'Review' : 'Done',
      value,
      color: STATUS_COLORS[status] || STATUS_COLORS.not_started
    }));
  }, [selectedVideos, keys]);

  const revenueData = useMemo(() =>
    selectedVideos.map((v, i) => {
      const s = v[keys.status] || 'not_started';
      return {
        name: v.note?.slice(0, 14) || `#${i + 1}`,
        earned: s === 'finished' ? (v.price || 0) : 0,
        pending: s !== 'finished' ? (v.price || 0) : 0,
      };
    }),
  [selectedVideos, keys]);

  const efficiency = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const progressData = useMemo(() => {
    let cumDone = 0;
    return selectedVideos.map((v, i) => {
      if ((v[keys.status] || 'not_started') === 'finished') cumDone++;
      return {
        name: v.note?.slice(0, 10) || `#${i + 1}`,
        completed: cumDone,
        total: i + 1
      };
    });
  }, [selectedVideos, keys]);

  return (
    <div style={{
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Settings Panel: Scope Selector & Timeframe Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '18px',
        animation: 'fadeSlideIn 0.4s ease both'
      }}>
        {/* Scope Selector */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>View Scope:</span>
          <button
            onClick={() => setScope('current')}
            style={scopeBtnStyle(scope === 'current')}
          >
            Current Project
          </button>
          <button
            onClick={() => setScope('all_active')}
            style={scopeBtnStyle(scope === 'all_active')}
          >
            All Active
          </button>
          <button
            onClick={() => setScope('archived')}
            style={scopeBtnStyle(scope === 'archived')}
          >
            Archived / Deleted
          </button>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Timeframe:</span>
          <button
            onClick={() => setTimeframe('all')}
            style={filterBtnStyle(timeframe === 'all')}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeframe('month')}
            style={filterBtnStyle(timeframe === 'month')}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe('week')}
            style={filterBtnStyle(timeframe === 'week')}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('day')}
            style={filterBtnStyle(timeframe === 'day')}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Archived / Deleted Banner */}
      {scope === 'archived' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '14px',
          color: '#ef4444',
          fontSize: '0.82rem',
          fontWeight: '600',
          animation: 'fadeSlideIn 0.3s ease both'
        }}>
          <AlertCircle size={16} />
          <span>You are viewing archived and deleted project workspace metrics. These figures do not affect current active progress.</span>
        </div>
      )}

      {selectedVideos.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          animation: 'fadeSlideIn 0.4s ease both'
        }}>
          <Clock size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No Metrics Available</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', maxWidth: '350px' }}>
            No task records match the selected scope and timeframe criteria. Try switching timeframe settings or adding timer logs.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
            <GlowStatCard icon={CheckCircle2} label="Completed" value={`${stats.done}/${stats.total}`}
              sub={`${efficiency}% delivery rate`} gradient={GRADIENT_COLORS.green} delay={0} />
            <GlowStatCard icon={Clock} label="Active Work" value={formatTime(stats.activeWorkSec)}
              sub={`~${formatTime(stats.avgTime)} avg per task`} gradient={GRADIENT_COLORS.blue} delay={0.05} />
            <GlowStatCard icon={AlertCircle} label="Idle Time" value={formatTime(stats.totalIdleSec)}
              sub={`${stats.totalSec > 0 ? Math.round((stats.totalIdleSec / stats.totalSec) * 100) : 0}% of total`} gradient={GRADIENT_COLORS.amber} delay={0.1} />
            <GlowStatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toFixed(0)}`}
              sub={`$${stats.totalPotential.toFixed(0)} potential`} gradient={GRADIENT_COLORS.green} delay={0.12} />
            <GlowStatCard icon={Zap} label="Efficiency" value={`${efficiency}%`}
              sub={`${stats.total - stats.done} remaining`} gradient={GRADIENT_COLORS.purple} delay={0.15} />
            {stats.overdue > 0 && (
              <GlowStatCard icon={AlertCircle} label="Overdue" value={stats.overdue}
                sub="past deadline" gradient={GRADIENT_COLORS.red} delay={0.2} />
            )}
          </div>

          {/* Time per Task */}
          <ChartPanel title="Time Worked per Task" emoji="⏱">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData} barSize={28} barGap={4}>
                <defs>
                  {Object.entries(STATUS_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} unit="m" />
                <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [`${v} min`, 'Time']} />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                  {timeData.map((entry, i) => (
                    <Cell key={i} fill={`url(#grad-${entry.status})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Idle Time per Task */}
          {stats.totalIdleSec > 0 && (
            <ChartPanel title="Idle Time per Task" emoji="⏸">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} barSize={28} barGap={4}>
                  <defs>
                    <linearGradient id="idle-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} unit="m" />
                  <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [`${v} min`, 'Idle']} />
                  <Bar dataKey="idleMinutes" fill="url(#idle-grad)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* Status + Revenue side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', flexWrap: 'wrap' }}>
            <ChartPanel title="Status Breakdown" emoji="📊" height="220px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {statusData.map((entry, i) => (
                      <linearGradient key={i} id={`pie-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={statusData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={4} dataKey="value"
                    strokeWidth={0}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={`url(#pie-grad-${i})`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {statusData.map(s => (
                  <span key={s.name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.72rem', color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </ChartPanel>

            <ChartPanel title="Revenue: Earned vs Pending" emoji="💰" height="220px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barSize={16} barGap={2}>
                  <defs>
                    <linearGradient id="earned-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="pending-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [`$${v}`, '']} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                  <Bar dataKey="earned" name="Earned" fill="url(#earned-grad)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="url(#pending-grad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          {/* Cumulative Progress Area Chart */}
          {progressData.length > 1 && (
            <ChartPanel title="Completion Progress" emoji="📈" height="200px">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TooltipStyle} />
                  <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2.5} fill="url(#area-grad)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="total" stroke="#71717a" strokeWidth={1} strokeDasharray="4 4" fill="none" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* Completion frequency table */}
          {selectedVideos.some(v => (v[keys.finishedCount] || 0) > 0) && (
            <ChartPanel title="Task Completion Frequency" emoji="🔁" height="auto">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedVideos.filter(v => (v[keys.finishedCount] || 0) > 0).map((v, i) => {
                  const finishedCount = v[keys.finishedCount] || 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)', minWidth: '130px', fontWeight: '600' }}>{v.note || `Task #${v.id}`}</span>
                      <div style={{ flex: 1, height: '10px', background: 'var(--bg-surface)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((finishedCount / 5) * 100, 100)}%`,
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                          borderRadius: '99px',
                          transition: 'width 1s ease',
                          boxShadow: '0 0 8px rgba(16,185,129,0.3)'
                        }} />
                      </div>
                      <span style={{ fontWeight: '800', color: '#10b981', minWidth: '55px', textAlign: 'right', fontSize: '0.85rem' }}>
                        {finishedCount}× done
                      </span>
                    </div>
                  );
                })}
              </div>
            </ChartPanel>
          )}
        </>
      )}
    </div>
  );
}