import { useState, useMemo, useEffect } from 'react';
import { X, Download, MessageSquare, Bot, LogOut, RefreshCw } from 'lucide-react';
import { useToastContext } from '../hooks/useToast.jsx';
import { useAuth, getTimerKeys } from '../hooks/useAuth.jsx';
import { escapeHTML, sanitizeURL } from '../hooks/sanitize.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { success, error } = useToastContext();
  const [destination, setDestination] = useState('local');
  const [isExporting, setIsExporting] = useState(false);
  
  // Discord Bot & Webhook States
  const [botToken, setBotToken] = useState(() => localStorage.getItem('discord_bot_token') || localStorage.getItem('discord_webhook_url') || '');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('discord_webhook_url') || '');
  const [botUser, setBotUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);

  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTime, setIncludeTime] = useState(true);
  const [includeIdleTime, setIncludeIdleTime] = useState(true);
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
  const activeTime = useMemo(() => totalTime - totalIdleTime, [totalTime, totalIdleTime]);

  // Discord Auto-Connect
  useEffect(() => {
    if (destination === 'discord' && botToken && !botUser && !isBotLoading) {
      handleConnectBot(botToken);
    }
  }, [destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectBot = async (tokenOrUrl) => {
    if (!tokenOrUrl.trim()) return;
    setIsBotLoading(true);

    // Check if it is a Webhook URL
    if (tokenOrUrl.includes('/api/webhooks/')) {
      const trimmedUrl = tokenOrUrl.trim();
      setWebhookUrl(trimmedUrl);
      localStorage.setItem('discord_webhook_url', trimmedUrl);
      localStorage.removeItem('discord_bot_token'); // Clear bot token if webhook is used

      try {
        const res = await fetch('/api/discord-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmedUrl,
            method: 'GET'
          })
        });
        if (res.ok) {
          const webhookData = await res.json();
          setBotUser({ username: webhookData.name || 'Webhook Bot', isWebhook: true });
        } else {
          if (res.status === 404) throw new Error('Webhook not found');
          setBotUser({ username: 'Discord Webhook', isWebhook: true });
        }
      } catch (err) {
        if (err.message === 'Webhook not found') {
          error("Webhook Error: Webhook not found");
          setBotUser(null);
          localStorage.removeItem('discord_webhook_url');
          setIsBotLoading(false);
          return;
        }
        // Fallback for CORS or network blocks
        setBotUser({ username: 'Discord Webhook (Active)', isWebhook: true });
      }
      success('Webhook connected successfully!');
      setIsBotLoading(false);
      return;
    }

    // Otherwise, connect as a Bot Token
    try {
      const headers = { Authorization: `Bot ${tokenOrUrl.trim()}` };
      const userRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://discord.com/api/v10/users/@me',
          method: 'GET',
          headers
        })
      });
      if (!userRes.ok) throw new Error('Invalid Bot Token');
      const userObj = await userRes.json();

      const guildsRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://discord.com/api/v10/users/@me/guilds',
          method: 'GET',
          headers
        })
      });
      if (!guildsRes.ok) throw new Error('Could not fetch servers');
      const guildsList = await guildsRes.json();

      setBotUser(userObj);
      setGuilds(guildsList);
      setWebhookUrl(''); // Clear webhook URL if bot token is used
      localStorage.setItem('discord_bot_token', tokenOrUrl.trim());
      localStorage.removeItem('discord_webhook_url');

      if (guildsList.length > 0) {
        setSelectedGuildId(guildsList[0].id);
      }
    } catch (err) {
      error("Discord Error: " + err.message);
      setBotUser(null);
      localStorage.removeItem('discord_bot_token');
    } finally {
      setIsBotLoading(false);
    }
  };

  const handleDisconnectBot = () => {
    setBotUser(null);
    setGuilds([]);
    setChannels([]);
    setBotToken('');
    setWebhookUrl('');
    localStorage.removeItem('discord_bot_token');
    localStorage.removeItem('discord_webhook_url');
  };

  useEffect(() => {
    if (selectedGuildId && botToken && botUser && !botUser.isWebhook) {
      const fetchChans = async () => {
        try {
          const res = await fetch('/api/discord-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: `https://discord.com/api/v10/guilds/${selectedGuildId}/channels`,
              method: 'GET',
              headers: { Authorization: `Bot ${botToken.trim()}` }
            })
          });
          if (res.ok) {
            const chans = await res.json();
            const textChans = chans.filter(c => c.type === 0);
            setChannels(textChans);
            if (textChans.length > 0) setSelectedChannelId(textChans[0].id);
            else setSelectedChannelId('');
          }
        } catch (err) {
          console.error('Channel fetch error', err);
        }
      };
      fetchChans();
    } else {
      setChannels([]);
      setSelectedChannelId('');
    }
  }, [selectedGuildId, botToken, botUser]);

  /* ── CSV export ───────────────────────────────────────────────── */
  const generateCSV = () => {
    const headers = ['#', 'Title', 'Video Length', 'Status', includeTime && 'Time Worked', includeIdleTime && 'Idle Time', includePrice && 'Price ($)', includeNotes && 'Notes', includeLinks && 'Source Link', includeLinks && 'Final Link', 'Deadline', 'Completions'].filter(Boolean);
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
      if (includeIdleTime)  row.push(formatTime(vIdleSeconds));
      if (includePrice) row.push(v.price || 0);
      if (includeNotes) row.push(`"${(v.noteDetails || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
      if (includeLinks) { row.push(v.sourceLink || ''); row.push(v.finalLink || ''); }
      row.push(v.deadline || '');
      row.push(vFinishedCount);
      return row.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  };

  const exportCSV = () => {
    const csv = generateCSV();
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
      
      const escapedNote = escapeHTML(v.note || 'Untitled');
      const escapedLength = escapeHTML(v.videoLength || '—');
      const escapedDeadline = escapeHTML(v.deadline || '—');
      
      let linksHtml = '—';
      if (includeLinks) {
        const sourceSanitized = v.sourceLink ? sanitizeURL(v.sourceLink) : '';
        const finalSanitized = v.finalLink ? sanitizeURL(v.finalLink) : '';
        const sourceA = sourceSanitized ? `<a href="${escapeHTML(sourceSanitized)}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6">Source</a>` : '—';
        const finalA = finalSanitized ? `<a href="${escapeHTML(finalSanitized)}" target="_blank" rel="noopener noreferrer" style="color:#10b981">Final</a>` : '';
        linksHtml = `${sourceA}${finalA ? ` | ${finalA}` : ''}`;
      }
      
      let notesHtml = '<td>—</td>';
      if (includeNotes) {
        if (v.noteDetails) {
          const truncated = v.noteDetails.substring(0, 200) + (v.noteDetails.length > 200 ? '…' : '');
          notesHtml = `<td style="padding:10px 8px;font-size:11px;color:#71717a;white-space:pre-line">${escapeHTML(truncated)}</td>`;
        } else {
          notesHtml = '<td>—</td>';
        }
      } else {
        notesHtml = '';
      }

      return `
        <tr style="border-bottom:1px solid #e4e4e7; page-break-inside:avoid">
          <td style="padding:10px 8px;font-weight:700;color:#71717a">${i + 1}</td>
          <td style="padding:10px 8px;font-weight:700">${escapedNote}</td>
          <td style="padding:10px 8px;font-family:monospace;font-size:11px">${escapedLength}</td>
          <td style="padding:10px 8px">
            <span style="background:${statusColor[vStatus] || '#71717a'}22;color:${statusColor[vStatus] || '#71717a'};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">
              ${statusLabel[vStatus] || 'Not Started'}
            </span>
          </td>
          ${includeTime  ? `<td style="padding:10px 8px;font-family:monospace">${formatTime(vTotalSeconds)}</td>` : ''}
          ${includeIdleTime  ? `<td style="padding:10px 8px;font-family:monospace;color:#f59e0b">${formatTime(vIdleSeconds)}</td>` : ''}
          ${includePrice ? `<td style="padding:10px 8px;font-weight:700">$${v.price || 0}</td>` : ''}
          ${includeLinks ? `<td style="padding:10px 8px;font-size:11px;color:#3b82f6">${linksHtml}</td>` : ''}
          ${notesHtml}
          <td style="padding:10px 8px;font-size:11px;color:#71717a">${escapedDeadline}</td>
          <td style="padding:10px 8px;text-align:center">${vFinishedCount}×</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html><html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>${escapeHTML(client.name)} — Project Report</title>
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
          <h1 style="font-size:28px;font-weight:800;margin:4px 0">${escapeHTML(client.name)}</h1>
          <div style="color:#71717a;font-size:13px">Generated ${new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        </div>

        <div>
          <div class="stat"><div class="stat-val">${doneCount}/${videos.length}</div><div class="stat-lbl">Tasks Completed</div></div>
          ${includeTime  ? `<div class="stat"><div class="stat-val">${formatTime(totalTime)}</div><div class="stat-lbl">Total Time Worked</div></div>` : ''}
          ${includeIdleTime  ? `<div class="stat"><div class="stat-val" style="color:#f59e0b">${formatTime(totalIdleTime)}</div><div class="stat-lbl">Total Idle Time</div></div>` : ''}
          ${includeIdleTime  ? `<div class="stat"><div class="stat-val" style="color:var(--accent-primary)">${formatTime(activeTime)}</div><div class="stat-lbl">Active Time</div></div>` : ''}
          ${includePrice ? `<div class="stat"><div class="stat-val" style="color:#10b981">$${totalRevenue.toFixed(2)}</div><div class="stat-lbl">Revenue Earned</div></div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th><th>Title</th><th>Length</th><th>Status</th>
              ${includeTime  ? '<th>Time Worked</th>'      : ''}
              ${includeIdleTime  ? '<th>Idle Time</th>'        : ''}
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

  const generatePDFBase64 = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Title & Brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue Accent
    doc.text(`${client.name || 'Project'} Report`, 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122); // Gray
    doc.text(`Generated on ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 26);

    // Summary stats text
    let statText = `Tasks: ${doneCount}/${videos.length}`;
    if (includeTime) statText += `   |   Time Worked: ${formatTime(totalTime)}`;
    if (includeIdleTime) statText += `   |   Idle Time: ${formatTime(totalIdleTime)}`;
    if (includePrice) statText += `   |   Revenue: $${totalRevenue.toFixed(2)}`;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59); // Dark blue-gray
    doc.text(statText, 14, 34);

    // Table Headers
    const headers = ['#', 'Title', 'Length', 'Status'];
    if (includeTime) headers.push('Time Worked');
    if (includeIdleTime) headers.push('Idle Time');
    if (includePrice) headers.push('Price');
    if (includeLinks) headers.push('Links');
    if (includeNotes) headers.push('Notes');
    headers.push('Deadline', 'Done');

    // Table Body Rows
    const rows = videos.map((v, i) => {
      const vStatus = v[keys.status] || 'not_started';
      const vTotalSeconds = v[keys.totalSeconds] || 0;
      const vIdleGaps = v[keys.idleGaps] || [];
      const vIdleSeconds = vIdleGaps.reduce((a, g) => a + g, 0);
      const vFinishedCount = v[keys.finishedCount] || 0;

      const statusLabels = { not_started: 'Not Started', started: 'In Progress', paused: 'Paused', finished: 'Completed' };
      
      const row = [
        i + 1,
        v.note || 'Untitled',
        v.videoLength || '—',
        statusLabels[vStatus] || 'Not Started'
      ];
      if (includeTime) row.push(formatTime(vTotalSeconds));
      if (includeIdleTime) row.push(formatTime(vIdleSeconds));
      if (includePrice) row.push(`$${v.price || 0}`);
      if (includeLinks) {
        const parts = [];
        if (v.sourceLink) parts.push('Source');
        if (v.finalLink) parts.push('Final');
        row.push(parts.join(' | ') || '—');
      }
      if (includeNotes) {
        row.push(v.noteDetails || '—');
      }
      row.push(v.deadline || '—');
      row.push(`${vFinishedCount}x`);
      return row;
    });

    // Draw table
    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      columnStyles: {
        1: { cellWidth: 50 }, // Title width
        ...(includeNotes ? { [headers.indexOf('Notes')]: { cellWidth: 50 } } : {})
      }
    });

    // Return as base64 string
    const outputString = doc.output('datauristring');
    const base64Index = outputString.indexOf(';base64,') + 8;
    return outputString.substring(base64Index);
  };

  const doExport = async () => {
    if (destination === 'discord') {
      if (!botUser) {
        error("Please connect bot or webhook first.");
        return;
      }
      const isWebhook = botUser.isWebhook;
      if (!isWebhook && !selectedChannelId) {
        error("Please select a channel.");
        return;
      }
      setIsExporting(true);

      const isPdf = format === 'pdf';
      let filePayload = {};

      if (isPdf) {
        try {
          const base64Pdf = generatePDFBase64();
          filePayload = {
            fileBase64: base64Pdf,
            fileName: `${client.name.replace(/\s+/g, '_')}_Report.pdf`
          };
        } catch (pdfErr) {
          console.error(pdfErr);
          error('Failed to generate PDF: ' + pdfErr.message);
          setIsExporting(false);
          return;
        }
      } else {
        const csv = generateCSV();
        filePayload = {
          fileContent: csv,
          fileName: `${client.name.replace(/\s+/g, '_')}_Report.csv`
        };
      }

      try {
        const url = isWebhook ? webhookUrl : `https://discord.com/api/v10/channels/${selectedChannelId}/messages`;
        const headers = isWebhook ? {} : { Authorization: `Bot ${botToken.trim()}` };

        const res = await fetch('/api/discord-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            method: 'POST',
            headers,
            isMultipart: true,
            ...filePayload,
            body: {
              content: `**${client.name}** report exported from TIMEROI`,
              embeds: [{
                title: `Project Report Summary`,
                color: 0x3b82f6,
                fields: [
                  { name: 'Completed Tasks', value: `${doneCount}/${videos.length}`, inline: true },
                  { name: 'Total Time', value: formatTime(totalTime), inline: true },
                  { name: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, inline: true }
                ]
              }]
            }
          })
        });
        if (res.ok) {
          success('Successfully sent to Discord!');
          onClose();
        } else {
          const data = await res.json();
          error('Failed to send to Discord: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        error('Error sending to Discord: ' + err.message);
      } finally {
        setIsExporting(false);
      }
    } else {
      if (format === 'csv') exportCSV();
      else exportPDF();
    }
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
            ].filter(s => !(s.label === 'Idle Time' && !includeIdleTime)).map(s => (
              <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Destination */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Destination</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {pill('💻 Local Device', destination === 'local', () => setDestination('local'))}
              {pill('💬 Discord Bot', destination === 'discord', () => setDestination('discord'))}
            </div>
            
            {destination === 'discord' && (
              <div style={{ marginTop: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {!botUser ? (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <Bot size={14} /> Connect Discord (Bot Token or Webhook URL)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type={botToken.startsWith('http') ? 'text' : 'password'} 
                        value={botToken}
                        onChange={e => setBotToken(e.target.value)}
                        placeholder="Paste Bot Token or Webhook URL here..."
                        style={{ flex: 1, padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                        onKeyDown={e => e.key === 'Enter' && handleConnectBot(botToken)}
                      />
                      <button 
                        onClick={() => handleConnectBot(botToken)}
                        disabled={isBotLoading || !botToken}
                        style={{ padding: '0 1rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: isBotLoading ? 'wait' : 'pointer' }}
                      >
                        {isBotLoading ? <RefreshCw size={16} className="spin" /> : 'Connect'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: botUser.isWebhook ? 0 : '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {botUser.avatar ? (
                          <img src={`https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`} alt="Bot Avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                        ) : <Bot size={24} />}
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{botUser.username}</span>
                        {botUser.isWebhook && <span style={{ fontSize: '0.65rem', background: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>WEBHOOK</span>}
                      </div>
                      <button onClick={handleDisconnectBot} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <LogOut size={12} /> Disconnect
                      </button>
                    </div>
                    
                    {!botUser.isWebhook && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Select Server</label>
                          <select 
                            value={selectedGuildId} 
                            onChange={e => setSelectedGuildId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.8rem' }}
                          >
                            {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            {guilds.length === 0 && <option value="">No servers found</option>}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Select Channel</label>
                          <select 
                            value={selectedChannelId} 
                            onChange={e => setSelectedChannelId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.8rem' }}
                            disabled={!selectedGuildId || channels.length === 0}
                          >
                            {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                            {channels.length === 0 && <option value="">No text channels found</option>}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Format (Only for Local) */}
          {/* Format */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Format</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {pill('📄 PDF', format === 'pdf', () => setFormat('pdf'))}
              {pill('📊 CSV', format === 'csv', () => setFormat('csv'))}
            </div>
            {format === 'pdf' && destination === 'local' && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Opens a print-ready page — use browser "Save as PDF" option.
              </p>
            )}
            {format === 'pdf' && destination === 'discord' && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Generates a PDF document and attaches it to the Discord message.
              </p>
            )}
          </div>

          {/* Include options */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Include in export</div>
            {toggle('Time Worked', includeTime, setIncludeTime)}
            {toggle('Idle Time', includeIdleTime, setIncludeIdleTime)}
            {toggle('Price / Revenue', includePrice, setIncludePrice)}
            {toggle('Task Notes', includeNotes, setIncludeNotes)}
            {toggle('Source & Final Links', includeLinks, setIncludeLinks)}
          </div>

          {/* Export button */}
          <button
            onClick={doExport}
            disabled={isExporting}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: '12px', border: 'none',
              background: 'var(--accent-primary)', color: 'white', cursor: isExporting ? 'not-allowed' : 'pointer',
              fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 16px var(--accent-primary)55',
              transition: 'transform 0.1s',
              opacity: isExporting ? 0.7 : 1
            }}
            onMouseDown={e => !isExporting && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => !isExporting && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {destination === 'discord' ? <MessageSquare size={18} /> : <Download size={18} />}
            {isExporting ? 'Exporting...' : `Export to ${destination === 'discord' ? 'Discord' : format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
