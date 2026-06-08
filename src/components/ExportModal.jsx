import { useState, useMemo } from 'react';
import { X, Download } from 'lucide-react';
import { useAuth, getTimerKeys } from '../hooks/useAuth.jsx';

function formatTime(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ExportModal({ client, onClose }) {
  const { user } = useAuth();
  const keys = getTimerKeys(user?.role || 'video_editor');
  const [format, setFormat] = useState('pdf');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTime, setIncludeTime] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);

  const videos = client.videos || [];

  const totalTime = useMemo(() =>
    videos.reduce((a, v) => a + (v[keys.totalSeconds] || 0), 0), [videos, keys]);
  const totalIdleTime = useMemo(() =>
    videos.reduce((a, v) => a + (v[keys.idleGaps] || []).reduce((s, g) => s + g, 0), 0), [videos, keys]);
  const totalRevenue = useMemo(() =>
    videos.filter(v => (v[keys.status] || 'not_started') === 'finished').reduce((a, v) => a + (v.price || 0), 0), [videos, keys]);
  const doneCount = videos.filter(v => (v[keys.status] || 'not_started') === 'finished').length;

  /* ── CSV export ───────────────────────────────────────────────── */
  const exportCSV = () => {
    const headers = ['#', 'Title', 'Video Length', 'Status', includeTime && 'Time Worked', includeTime && 'Idle Time', includePrice && 'Price ($)', includeNotes && 'Notes', includeLinks && 'Source Link', includeLinks && 'Final Link', 'Deadline', 'Completions'].filter(Boolean);
    const rows = videos.map((v, i) => {
      const vStatus = v[keys.status] || 'not_started';
      const vTotalSeconds = v[keys.totalSeconds] || 0;
      const vIdleGaps = v[keys.idleGaps] || [];
      const vIdleSeconds = vIdleGaps.reduce((a, g) => a + g, 0);
      const vFinishedCount = v[keys.finishedCount] || 0;
      const row = [
        i + 1,
        `"${(v.note || 'Untitled').replace(/"/g, '""')}"`,
        v.videoLength || '',
        vStatus.replace('_', ' '),
      ];
      if (includeTime)  row.push(formatTime(vTotalSeconds));
      if (includeTime)  row.push(formatTime(vIdleSeconds));
      if (includePrice) row.push(v.price || 0);
      if (includeNotes) row.push(`"${(v.noteDetails || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
      if (includeLinks) { row.push(v.sourceLink || ''); row.push(v.finalLink || ''); }
      row.push(v.deadline || '');
      row.push(vFinishedCount);
      return row.join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── PDF export via print ─────────────────────────────────────── */
  const exportPDF = () => {
    const statusColor = { not_started: '#71717a', started: '#3b82f6', paused: '#f59e0b', finished: '#10b981' };
    const statusLabel = { not_started: 'Not Started', started: 'In Progress', paused: 'Paused', finished: 'Completed' };

    const rows = videos.map((v, i) => {
      const vStatus = v[keys.status] || 'not_started';
      const vTotalSeconds = v[keys.totalSeconds] || 0;
      const vIdleGaps = v[keys.idleGaps] || [];
      const vIdleSeconds = vIdleGaps.reduce((a, g) => a + g, 0);
      const vFinishedCount = v[keys.finishedCount] || 0;
      return `
        <tr style="border-bottom:1px solid #e4e4e7; page-break-inside:avoid">
          <td style="padding:10px 8px;font-weight:700;color:#71717a">${i + 1}</td>
          <td style="padding:10px 8px;font-weight:700">${v.note || 'Untitled'}</td>
          <td style="padding:10px 8px;font-family:monospace;font-size:11px">${v.videoLength || '—'}</td>
          <td style="padding:10px 8px">
            <span style="background:${statusColor[vStatus] || '#71717a'}22;color:${statusColor[vStatus] || '#71717a'};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">
              ${statusLabel[vStatus] || 'Not Started'}
            </span>
          </td>
          ${includeTime  ? `<td style="padding:10px 8px;font-family:monospace">${formatTime(vTotalSeconds)}</td>` : ''}
          ${includeTime  ? `<td style="padding:10px 8px;font-family:monospace;color:#f59e0b">${formatTime(vIdleSeconds)}</td>` : ''}
          ${includePrice ? `<td style="padding:10px 8px;font-weight:700">$${v.price || 0}</td>` : ''}
          ${includeLinks ? `
            <td style="padding:10px 8px;font-size:11px;color:#3b82f6">
              ${v.sourceLink ? `<a href="${v.sourceLink}" style="color:#3b82f6">Source</a>` : '—'}
              ${v.finalLink  ? ` | <a href="${v.finalLink}"  style="color:#10b981">Final</a>` : ''}
            </td>` : ''}
          ${includeNotes && v.noteDetails ? `<td style="padding:10px 8px;font-size:11px;color:#71717a;white-space:pre-line">${v.noteDetails.substring(0, 200)}${v.noteDetails.length > 200 ? '…' : ''}</td>` : includeNotes ? '<td>—</td>' : ''}
          <td style="padding:10px 8px;font-size:11px;color:#71717a">${v.deadline || '—'}</td>
          <td style="padding:10px 8px;text-align:center">${vFinishedCount}×</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html><html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>${client.name} — Project Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 32px; color: #09090b; }
          @media print { @page { margin: 16mm; } }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 24px; }
          th { background: #f4f4f5; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #71717a; border-bottom: 2px solid #e4e4e7; }
          .stat { display: inline-block; background: #f4f4f5; border-radius: 12px; padding: 12px 20px; margin-right: 12px; margin-bottom: 12px; }
          .stat-val { font-size: 22px; font-weight: 800; }
          .stat-lbl { font-size: 11px; color: #71717a; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div style="border-left:4px solid #2563eb;padding-left:16px;margin-bottom:24px">
          <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.08em">Project Report</div>
          <h1 style="font-size:28px;font-weight:800;margin:4px 0">${client.name}</h1>
          <div style="color:#71717a;font-size:13px">Generated ${new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        </div>

        <div>
          <div class="stat"><div class="stat-val">${doneCount}/${videos.length}</div><div class="stat-lbl">Tasks Completed</div></div>
          ${includeTime  ? `<div class="stat"><div class="stat-val">${formatTime(totalTime)}</div><div class="stat-lbl">Total Time Worked</div></div>` : ''}
          ${includeTime  ? `<div class="stat"><div class="stat-val" style="color:#f59e0b">${formatTime(totalIdleTime)}</div><div class="stat-lbl">Total Idle Time</div></div>` : ''}
          ${includePrice ? `<div class="stat"><div class="stat-val" style="color:#10b981">$${totalRevenue.toFixed(2)}</div><div class="stat-lbl">Revenue Earned</div></div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th><th>Title</th><th>Length</th><th>Status</th>
              ${includeTime  ? '<th>Time Worked</th>'      : ''}
              ${includeTime  ? '<th>Idle Time</th>'        : ''}
              ${includePrice ? '<th>Price</th>'     : ''}
              ${includeLinks ? '<th>Links</th>'     : ''}
              ${includeNotes ? '<th>Notes</th>'     : ''}
              <th>Deadline</th>
              <th>Completions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:11px;color:#71717a;text-align:center">
          Exported from TIMEROI · ${new Date().toISOString().split('T')[0]}
        </div>
      </body></html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  const doExport = () => {
    if (format === 'csv') exportCSV();
    else exportPDF();
  };

  const pill = (label, active, onClick) => (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 1rem', borderRadius: '99px', border: 'none', cursor: 'pointer',
        fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.2s',
        background: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
        color: active ? 'white' : 'var(--text-secondary)',
        boxShadow: active ? '0 2px 8px var(--accent-primary)44' : 'none'
      }}
    >{label}</button>
  );

  const toggle = (label, val, set) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
      <div
        onClick={() => set(v => !v)}
        style={{
          width: '38px', height: '20px', borderRadius: '99px',
          background: val ? 'var(--accent-primary)' : 'var(--border-color)',
          position: 'relative', transition: 'background 0.25s', cursor: 'pointer', flexShrink: 0
        }}
      >
        <div style={{
          position: 'absolute', top: '3px', left: val ? '20px' : '3px',
          width: '14px', height: '14px', borderRadius: '50%', background: 'white',
          transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
        }} />
      </div>
    </label>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-panel)', borderRadius: '20px', width: '480px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', border: '1px solid var(--border-color)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Export Report</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{client.name} · {videos.length} tasks</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Completed', val: `${doneCount}/${videos.length}`, color: '#10b981' },
              { label: 'Total Time', val: formatTime(totalTime), color: 'var(--accent-primary)' },
              { label: 'Idle Time', val: formatTime(totalIdleTime), color: '#f59e0b' },
              { label: 'Revenue', val: `$${totalRevenue.toFixed(2)}`, color: '#10b981' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Format */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Format</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {pill('📄 PDF', format === 'pdf', () => setFormat('pdf'))}
              {pill('📊 CSV', format === 'csv', () => setFormat('csv'))}
            </div>
            {format === 'pdf' && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Opens a print-ready page — use browser "Save as PDF" option.
              </p>
            )}
          </div>

          {/* Include options */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Include in export</div>
            {toggle('Time Worked', includeTime, setIncludeTime)}
            {toggle('Price / Revenue', includePrice, setIncludePrice)}
            {toggle('Task Notes', includeNotes, setIncludeNotes)}
            {toggle('Source & Final Links', includeLinks, setIncludeLinks)}
          </div>

          {/* Export button */}
          <button
            onClick={doExport}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: '12px', border: 'none',
              background: 'var(--accent-primary)', color: 'white', cursor: 'pointer',
              fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 16px var(--accent-primary)55',
              transition: 'transform 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Download size={18} />
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
