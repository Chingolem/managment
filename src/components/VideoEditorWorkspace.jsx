import React, { useState, useEffect, Fragment } from 'react';
import { sanitizeURL } from '../hooks/sanitize.js';
import {
  Play, Pause, RotateCcw, RefreshCcw, ExternalLink, Calendar,
  CheckCircle, Plus, Trash2, Clock, DollarSign, Film,
  ChevronDown, ChevronUp, Search, X
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { fireConfetti } from './Confetti.jsx';
import { useAuth, getTimerKeys } from '../hooks/useAuth.jsx';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function VideoEditorWorkspace({ client, updateVideo, updateClient, onTriggerClientReview }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTimers, setActiveTimers] = useState({});
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const keys = getTimerKeys('video_editor');

  // Poll active timers to redraw elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const copy = { ...prev };
        let updated = false;
        client.videos.forEach(v => {
          const vStatus = v[keys.status] || 'not_started';
          const vLastStartTime = v[keys.lastStartTime];
          const vTotalSeconds = v[keys.totalSeconds] || 0;
          if (vStatus === 'started' && vLastStartTime) {
            copy[v.id] = vTotalSeconds + Math.floor((Date.now() - vLastStartTime) / 1000);
            updated = true;
          } else if (copy[v.id] !== undefined) {
            delete copy[v.id];
            updated = true;
          }
        });
        return updated ? copy : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [client.videos, keys]);

  const handleStartTimer = (video) => {
    const vLastStopTime = video[keys.lastStopTime];
    const vIdleGaps = video[keys.idleGaps] || [];
    const updates = { [keys.status]: 'started', [keys.lastStartTime]: Date.now() };
    if (vLastStopTime) {
      const gap = Math.floor((Date.now() - vLastStopTime) / 1000);
      const gaps = [...vIdleGaps, gap];
      updates[keys.idleGaps] = gaps;
    }
    updateVideo(video.id, updates);
  };

  const handlePauseTimer = (video) => {
    const vLastStartTime = video[keys.lastStartTime];
    const vTotalSeconds = video[keys.totalSeconds] || 0;
    const elapsed = vLastStartTime ? Math.floor((Date.now() - vLastStartTime) / 1000) : 0;
    updateVideo(video.id, { 
      [keys.status]: 'paused', 
      [keys.totalSeconds]: vTotalSeconds + elapsed, 
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: Date.now()
    });
  };

  const handleFinishTimer = (video, e) => {
    const vStatus = video[keys.status] || 'not_started';
    const vLastStartTime = video[keys.lastStartTime];
    const vTotalSeconds = video[keys.totalSeconds] || 0;
    const vFinishedCount = video[keys.finishedCount] || 0;
    const elapsed = (vStatus === 'started' && vLastStartTime)
      ? Math.floor((Date.now() - vLastStartTime) / 1000)
      : 0;
    updateVideo(video.id, {
      [keys.status]: 'finished',
      [keys.totalSeconds]: vTotalSeconds + elapsed,
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: Date.now(),
      [keys.finishedCount]: vFinishedCount + 1,
      finishLog: [...(video.finishLog || []), { ts: Date.now(), mode: 'finish' }]
    });
    if (e) fireConfetti(e.clientX, e.clientY);
    if (onTriggerClientReview) {
      onTriggerClientReview(video.id);
    }
  };

  const handleMoveToCompleted = (video, e) => {
    const vFinishedCount = video[keys.finishedCount] || 0;
    updateVideo(video.id, {
      [keys.status]: 'finished',
      [keys.finishedCount]: vFinishedCount + 1,
      finishLog: [...(video.finishLog || []), { ts: Date.now(), mode: 'moveToCompleted' }]
    });
    if (e) fireConfetti(e.clientX, e.clientY);
    if (onTriggerClientReview) {
      onTriggerClientReview(video.id);
    }
  };

  const handleReopenTimer = (video) => {
    updateVideo(video.id, {
      [keys.status]: 'paused',
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: Date.now()
    });
  };

  const handleResetTimer = (video) => {
    setActiveTimers(prev => {
      const copy = { ...prev };
      delete copy[video.id];
      return copy;
    });
    updateVideo(video.id, {
      [keys.status]: 'not_started',
      [keys.totalSeconds]: 0,
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: null
    });
  };

  const handleNotesKeyDown = (e, videoId) => {
    if (e.key === 'Enter') {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const text = textarea.value;

      const beforeCursor = text.substring(0, start);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      const bulletMatch = currentLine.match(/^(\s*[-*•])\s(.*)/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)/);

      if (bulletMatch) {
        if (!bulletMatch[2].trim()) {
          e.preventDefault();
          const lineStart = beforeCursor.lastIndexOf('\n') + 1;
          const newValue = text.substring(0, lineStart) + '\n' + text.substring(start);
          updateVideo(videoId, { noteDetails: newValue });
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
          }, 0);
          return;
        }

        e.preventDefault();
        const bulletSymbol = bulletMatch[1];
        const insertion = `\n${bulletSymbol} `;
        const newValue = beforeCursor + insertion + text.substring(start);
        updateVideo(videoId, { noteDetails: newValue });
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
        }, 0);
      } else if (numberMatch) {
        if (!numberMatch[3].trim()) {
          e.preventDefault();
          const lineStart = beforeCursor.lastIndexOf('\n') + 1;
          const newValue = text.substring(0, lineStart) + '\n' + text.substring(start);
          updateVideo(videoId, { noteDetails: newValue });
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
          }, 0);
          return;
        }

        e.preventDefault();
        const indent = numberMatch[1];
        const nextNum = parseInt(numberMatch[2], 10) + 1;
        const insertion = `\n${indent}${nextNum}. `;
        const newValue = beforeCursor + insertion + text.substring(start);
        updateVideo(videoId, { noteDetails: newValue });
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
        }, 0);
      }
    }
  };


  const handleAddVideo = () => {
    const newId = client.videos.length > 0 ? Math.max(...client.videos.map(v => v.id)) + 1 : 1;
    const newVideos = [...client.videos, {
      id: newId,
      status: 'not_started',
      totalSeconds: 0,
      lastStartTime: null,
      price: 150,
      note: 'Untitled Video',
      sourceLink: '',
      finalLink: '',
      deadline: '',
      checklist: [],
      showOnCanvas: false,
      noteDetails: '',
      videoLength: ''
    }];
    updateClient(client.id, { videos: newVideos });
    setExpandedVideoId(newId); // auto-expand new items
  };

  const handleDeleteVideo = (id) => {
    const newVideos = client.videos.filter(v => v.id !== id);
    updateClient(client.id, { videos: newVideos });
    if (expandedVideoId === id) {
      setExpandedVideoId(newVideos.length > 0 ? newVideos[0].id : null);
    }
  };


  // Filter video projects by search query
  const filteredVideos = client.videos.filter(v => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return v.id.toString() === query || (v.note && v.note.toLowerCase().includes(query));
  });

  // Calculate high-level stats
  const totalRevenue = client.videos.reduce((sum, v) => sum + (v.price || 0), 0);
  const totalTimeWorked = client.videos.reduce((sum, v) => {
    const vStatus = v[keys.status] || 'not_started';
    const vLastStartTime = v[keys.lastStartTime];
    const vTotalSeconds = v[keys.totalSeconds] || 0;
    const elapsed = (vStatus === 'started' && vLastStartTime)
      ? Math.floor((Date.now() - vLastStartTime) / 1000)
      : 0;
    return sum + vTotalSeconds + elapsed;
  }, 0);
  const completedCount = client.videos.filter(v => (v[keys.status] || 'not_started') === 'finished').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      minHeight: 'calc(100vh - 180px)',
      background: 'var(--bg-dark)',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Timer animations */}
      <style>{`
        @keyframes timerPulse {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
      `}</style>
      {/* Mini Stats Bar — dimensional cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '1rem',
      }}>
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1.1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(37,99,235,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Film size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Total Projects</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '850', display: 'block', marginTop: '1px' }}>{client.videos.length} videos</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1.1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(37,99,235,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Time Worked</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '850', color: 'var(--accent-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', display: 'block', marginTop: '1px', letterSpacing: '0.5px' }}>
              {formatTime(totalTimeWorked)}
            </span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1.1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <DollarSign size={16} style={{ color: '#10b981' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Total Value</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '850', color: '#10b981', display: 'block', marginTop: '1px' }}>${totalRevenue}</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1.1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(168,85,247,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle size={16} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Delivery Rate</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '850', display: 'block', marginTop: '1px' }}>
              {Math.round((completedCount / client.videos.length) * 100)}% Finished
            </span>
          </div>
        </div>
      </div>

      {/* Main Track List Panel */}
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
      }}>
        
        {/* Toolbar & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  fontSize: '0.8rem',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleAddVideo}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Plus size={14} /> Add Video
            </button>
          </div>
        </div>


        {/* Timeline Table Spreadsheet */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          background: 'var(--bg-surface)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-panel)',
                color: 'var(--text-secondary)',
                fontWeight: '800'
              }}>
                <th style={{ padding: '0.75rem 1rem', width: '50px' }}></th>
                <th style={{ padding: '0.75rem 1.25rem', width: '60px' }}>ID</th>
                <th style={{ padding: '0.75rem 1rem', minWidth: '200px' }}>Project Name</th>
                <th style={{ padding: '0.75rem 1rem', width: '100px' }}>Video Length</th>
                <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', width: '135px' }}>Deadline</th>
                <th style={{ padding: '0.75rem 1rem', width: '100px' }}>Price</th>
                <th style={{ padding: '0.75rem 1rem', width: '220px' }}>Stopwatch Session</th>
                <th style={{ padding: '0.75rem 1rem', width: '60px' }} />
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map((v) => {
                const vStatus = v[keys.status] || 'not_started';
                const vTotalSeconds = v[keys.totalSeconds] || 0;
                const isTimerActive = vStatus === 'started';
                const elapsedSeconds = isTimerActive 
                  ? (activeTimers[v.id] !== undefined ? activeTimers[v.id] : vTotalSeconds)
                  : vTotalSeconds;
                const isExpanded = expandedVideoId === v.id;

                return (
                  <Fragment key={v.id}>
                    <tr 
                      onClick={() => setExpandedVideoId(isExpanded ? null : v.id)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isTimerActive ? 'rgba(37, 99, 235, 0.03)' : (isExpanded ? 'var(--bg-panel)' : 'transparent'),
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Chevron Arrow Toggle */}
                      <td style={{ padding: '0.5rem 0 0.5rem 1rem', textAlign: 'center', width: '30px' }}>
                        {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--accent-primary)' }} /> : <ChevronDown size={14} />}
                      </td>

                      {/* ID badge */}
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-panel)',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}>
                          #{v.id}
                        </span>
                      </td>

                      {/* Project Name */}
                      <td style={{ padding: '0.5rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={v.note}
                          onChange={(e) => updateVideo(v.id, { note: e.target.value })}
                          placeholder="Project title..."
                          aria-label="Project title"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px dashed transparent',
                            color: 'var(--text-primary)',
                            fontWeight: '700',
                            width: '100%',
                            outline: 'none',
                            fontSize: '0.85rem'
                          }}
                          onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent-primary)'}
                          onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                        />
                      </td>

                      {/* Video Length */}
                      <td style={{ padding: '0.5rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={v.videoLength || ''}
                          onChange={(e) => updateVideo(v.id, { videoLength: e.target.value })}
                          placeholder="0:00"
                          aria-label="Video length"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px dashed transparent',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            width: '70px',
                            outline: 'none',
                            fontSize: '0.85rem',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            textAlign: 'center'
                          }}
                          onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent-primary)'}
                          onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                          title="Video length (e.g. 12:30)"
                        />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.5rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <select
                          value={vStatus}
                          onChange={(e) => updateVideo(v.id, { [keys.status]: e.target.value })}
                          aria-label="Project status"
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: '700'
                          }}
                        >
                          <option value="not_started">💡 Idea</option>
                          <option value="started">🎬 Editing</option>
                          <option value="paused">👀 Review</option>
                          <option value="finished">✅ Completed</option>
                        </select>
                      </td>

                      {/* Deadline */}
                      <td style={{ padding: '0.5rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          value={v.deadline || ''}
                          onChange={(e) => updateVideo(v.id, { deadline: e.target.value })}
                          aria-label="Deadline date"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: v.deadline ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        />
                      </td>

                      {/* Price */}
                      <td style={{ padding: '0.5rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)', fontWeight: '700' }}>
                          <span>$</span>
                          <input
                            type="number"
                            value={v.price || 0}
                            onChange={(e) => updateVideo(v.id, { price: Number(e.target.value) })}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed transparent',
                              color: 'var(--success)',
                              fontWeight: '700',
                              width: '60px',
                              outline: 'none',
                              fontSize: '0.85rem'
                            }}
                            onFocus={(e) => e.target.style.borderBottomColor = 'var(--success)'}
                            onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                          />
                        </div>
                      </td>

                       {/* Stopwatch timer — redesigned premium module */}
                       <td style={{ padding: '0.5rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.75rem',
                           background: isTimerActive
                             ? 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.03) 100%)'
                             : vStatus === 'finished'
                               ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)'
                               : 'var(--bg-panel)',
                           border: isTimerActive
                             ? '1.5px solid rgba(37,99,235,0.2)'
                             : vStatus === 'finished'
                               ? '1.5px solid rgba(16,185,129,0.15)'
                               : '1px solid var(--border-color)',
                           borderRadius: '10px',
                           padding: '0.5rem 0.75rem',
                           position: 'relative',
                           overflow: 'hidden',
                           transition: 'all 0.3s ease'
                         }}>
                           {/* Active timer pulse ring */}
                           {isTimerActive && (
                             <div style={{
                               position: 'absolute',
                               top: '50%',
                               left: '0.6rem',
                               transform: 'translateY(-50%)',
                               width: '8px',
                               height: '8px',
                               borderRadius: '50%',
                               background: 'var(--accent-primary)',
                               boxShadow: '0 0 0 0 rgba(37,99,235,0.4)',
                               animation: 'timerPulse 2s infinite'
                             }} />
                           )}

                           {/* Finished check mark indicator */}
                           {vStatus === 'finished' && (
                             <div style={{
                               width: '22px',
                               height: '22px',
                               borderRadius: '50%',
                               background: 'rgba(16,185,129,0.12)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               flexShrink: 0
                             }}>
                               <CheckCircle size={13} style={{ color: '#10b981' }} />
                             </div>
                           )}

                           <span style={{
                             fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                             fontWeight: '800',
                             fontSize: isTimerActive ? '1.05rem' : '0.95rem',
                             color: isTimerActive ? 'var(--accent-primary)' : vStatus === 'finished' ? '#10b981' : 'var(--text-primary)',
                             minWidth: '72px',
                             letterSpacing: '0.5px',
                             transition: 'color 0.3s, font-size 0.2s',
                             paddingLeft: isTimerActive ? '0.5rem' : (vStatus === 'finished' ? '0' : '0')
                           }}>
                             {formatTime(elapsedSeconds)}
                           </span>

                           <div style={{
                             display: 'flex',
                             gap: '0.35rem',
                             marginLeft: 'auto',
                             position: 'relative',
                             zIndex: 1
                           }}>
                             {vStatus === 'finished' ? (
                               <>
                                 <button
                                   type="button"
                                   onClick={(e) => { e.stopPropagation(); handleReopenTimer(v); }}
                                   style={{
                                     background: 'var(--bg-panel)',
                                     border: '1.5px solid #f59e0b',
                                     borderRadius: '8px',
                                     padding: '0.35rem 0.65rem',
                                     cursor: 'pointer',
                                     color: '#f59e0b',
                                     fontSize: '0.72rem',
                                     fontWeight: '700',
                                     display: 'inline-flex',
                                     alignItems: 'center',
                                     gap: '0.3rem',
                                     transition: 'all 0.15s'
                                   }}
                                   title="Undo finish and reopen timer"
                                 >
                                   <RotateCcw size={11} /> Reopen
                                 </button>
                                 <button
                                   type="button"
                                   onClick={(e) => { e.stopPropagation(); handleResetTimer(v); }}
                                   style={{
                                     background: 'var(--bg-panel)',
                                     border: '1.5px solid var(--danger)',
                                     borderRadius: '8px',
                                     padding: '0.35rem 0.65rem',
                                     cursor: 'pointer',
                                     color: 'var(--danger)',
                                     fontSize: '0.72rem',
                                     fontWeight: '700',
                                     display: 'inline-flex',
                                     alignItems: 'center',
                                     gap: '0.3rem',
                                     transition: 'all 0.15s'
                                   }}
                                   title="Reset timer to 0"
                                 >
                                   <RefreshCcw size={11} /> Reset
                                 </button>
                               </>
                             ) : (
                               <>
                                 {vStatus === 'started' ? (
                                   <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); handlePauseTimer(v); }}
                                     style={{
                                       background: 'var(--bg-panel)',
                                       border: '1.5px solid var(--warning)',
                                       borderRadius: '8px',
                                       padding: '0.35rem 0.65rem',
                                       cursor: 'pointer',
                                       color: 'var(--warning)',
                                       fontSize: '0.72rem',
                                       fontWeight: '700',
                                       display: 'inline-flex',
                                       alignItems: 'center',
                                       gap: '0.3rem',
                                       transition: 'all 0.15s'
                                     }}
                                     title="Stop tracking"
                                   >
                                     <Pause size={11} /> Stop
                                   </button>
                                 ) : vStatus === 'paused' ? (
                                   <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); handleStartTimer(v); }}
                                     style={{
                                       background: 'var(--accent-primary)',
                                       border: '1.5px solid var(--accent-primary)',
                                       borderRadius: '8px',
                                       padding: '0.35rem 0.65rem',
                                       cursor: 'pointer',
                                       color: '#ffffff',
                                       fontSize: '0.72rem',
                                       fontWeight: '700',
                                       display: 'inline-flex',
                                       alignItems: 'center',
                                       gap: '0.3rem',
                                       boxShadow: '0 2px 12px rgba(37,99,235,0.2)',
                                       transition: 'all 0.15s'
                                     }}
                                     title="Resume tracking"
                                   >
                                     <Play size={11} /> Resume
                                   </button>
                                 ) : (
                                   <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); handleStartTimer(v); }}
                                     style={{
                                       background: 'var(--bg-panel)',
                                       border: '1.5px solid var(--accent-primary)',
                                       borderRadius: '8px',
                                       padding: '0.35rem 0.65rem',
                                       cursor: 'pointer',
                                       color: 'var(--accent-primary)',
                                       fontSize: '0.72rem',
                                       fontWeight: '700',
                                       display: 'inline-flex',
                                       alignItems: 'center',
                                       gap: '0.3rem',
                                       transition: 'all 0.15s'
                                     }}
                                     title="Start tracking"
                                   >
                                     <Play size={11} /> Start
                                   </button>
                                 )}
                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (vStatus === 'paused') {
                                       handleMoveToCompleted(v, e);
                                     } else {
                                       handleFinishTimer(v, e);
                                     }
                                   }}
                                   style={{
                                     background: 'var(--bg-panel)',
                                     border: '1.5px solid rgba(16,185,129,0.3)',
                                     borderRadius: '8px',
                                     padding: '0.35rem 0.65rem',
                                     cursor: 'pointer',
                                     color: '#10b981',
                                     fontSize: '0.72rem',
                                     fontWeight: '700',
                                     display: 'inline-flex',
                                     alignItems: 'center',
                                     gap: '0.3rem',
                                     transition: 'all 0.15s'
                                   }}
                                   title={vStatus === 'paused' ? "Move to completed" : "Complete project"}
                                 >
                                   <CheckCircle size={11} /> {vStatus === 'paused' ? "Move to Completed" : "Finish"}
                                 </button>
                               </>
                             )}
                           </div>
                         </div>
                       </td>

                      {/* Spacer or simple indicators */}
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                          {isExpanded ? 'Hide' : 'Edit'}
                        </span>
                      </td>
                    </tr>

                    {/* EXPANDED DETAILED DRAWER PANEL */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} style={{ padding: '0', borderBottom: '2px solid var(--accent-primary)' }}>
                          <div style={{
                            background: 'var(--bg-surface)',
                            padding: '1.5rem 2rem',
                            borderTop: '1px solid var(--border-color)',
                            boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.04)'
                          }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem' }}>
                            
                            {/* Left Side: Note details with smart editor */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                Task Notes & Directives
                              </label>
                              <textarea
                                value={v.noteDetails || ''}
                                onChange={(e) => updateVideo(v.id, { noteDetails: e.target.value })}
                                onKeyDown={(e) => handleNotesKeyDown(e, v.id)}
                                placeholder="Write detailed instructions, assets required, scripts flow, correction requirements, or edit notes for this video project..."
                                style={{
                                  width: '100%',
                                  height: '110px',
                                  padding: '0.6rem 0.8rem',
                                  background: 'var(--bg-panel)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  resize: 'vertical',
                                  outline: 'none',
                                  lineHeight: '1.4'
                                }}
                              />
                              
                              {(() => {
                                const feedbackKey = `share_comments_${client.id}_video_${v.id}`;
                                let comments = [];
                                try {
                                  comments = JSON.parse(localStorage.getItem(feedbackKey) || '[]');
                                } catch(e){}
                                if (comments.length === 0) return null;
                                return (
                                  <div style={{ marginTop: '0.75rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      💬 Client Revision Feedback ({comments.length})
                                    </label>
                                    <div style={{
                                      maxHeight: '120px',
                                      overflowY: 'auto',
                                      background: 'rgba(16,185,129,0.02)',
                                      border: '1px solid rgba(16,185,129,0.1)',
                                      borderRadius: '8px',
                                      padding: '0.5rem',
                                      marginTop: '0.25rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.5rem'
                                    }}>
                                      {comments.map(c => (
                                        <div key={c.id} style={{ fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#93c5fd', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                                            <span>{c.author}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{c.ts}</span>
                                          </div>
                                          <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{c.text}</p>
                                          {c.attachment && (
                                            <div style={{ marginTop: '0.25rem' }}>
                                              <a href={sanitizeURL(c.attachment)} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                📎 Attachment
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Middle Side: Links & Financials */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              
                              {/* Links row */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Source Link (Drive)</label>
                                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <input
                                      type="text"
                                      value={v.sourceLink || ''}
                                      onChange={(e) => updateVideo(v.id, { sourceLink: e.target.value })}
                                      placeholder="https://drive.google.com/..."
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0.5rem',
                                        background: 'var(--bg-panel)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem'
                                      }}
                                    />
                                    {v.sourceLink?.startsWith('http') && (
                                      <a
                                        href={sanitizeURL(v.sourceLink)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-outline" 
                                        style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center' }}
                                        title="Open Link"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Final Link (Review)</label>
                                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <input
                                      type="text"
                                      value={v.finalLink || ''}
                                      onChange={(e) => updateVideo(v.id, { finalLink: e.target.value })}
                                      placeholder="https://frame.io/..."
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0.5rem',
                                        background: 'var(--bg-panel)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem'
                                      }}
                                    />
                                    {v.finalLink?.startsWith('http') && (
                                      <a
                                        href={sanitizeURL(v.finalLink)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-outline" 
                                        style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center' }}
                                        title="Open Link"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Video Length & Price Rate row */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                                <div>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Video Length</label>
                                  <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                                    <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⏱</span>
                                    <input
                                      type="text"
                                      value={v.videoLength || ''}
                                      onChange={(e) => updateVideo(v.id, { videoLength: e.target.value })}
                                      placeholder="12:30"
                                      style={{
                                        width: '100%',
                                        padding: '0.35rem 0.5rem 0.35rem 1.5rem',
                                        background: 'var(--bg-panel)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Project Rate ($)</label>
                                  <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                                    <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>$</span>
                                    <input
                                      type="number"
                                      value={v.price}
                                      onChange={(e) => updateVideo(v.id, { price: parseFloat(e.target.value) || 0 })}
                                      style={{
                                        width: '100%',
                                        padding: '0.35rem 0.5rem 0.35rem 1.25rem',
                                        background: 'var(--bg-panel)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem'
                                      }}
                                    />
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                  <button
                                    onClick={() => handleDeleteVideo(v.id)}
                                    className="btn btn-danger-outline"
                                    title="Delete this project"
                                    style={{
                                      width: '100%',
                                      padding: '0.45rem',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.25rem',
                                      borderColor: 'var(--danger)',
                                      color: 'var(--danger)',
                                      borderRadius: '6px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={13} /> Delete Project
                                  </button>
                                </div>
                              </div>

                            </div>

                            {/* Right Side: Tracking Audit Logs */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.6rem',
                              background: 'linear-gradient(135deg, var(--bg-panel) 0%, color-mix(in srgb, var(--bg-panel) 95%, var(--accent-primary)) 100%)',
                              padding: '1rem 1.25rem',
                              borderRadius: '12px',
                              border: '1px solid var(--border-color)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  background: 'rgba(37,99,235,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Tracking Audit
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                                {v.videoLength && (
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.4rem 0.6rem',
                                    background: 'rgba(139,92,246,0.04)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(139,92,246,0.12)'
                                  }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Video Length</span>
                                    <strong style={{ color: '#8b5cf6', fontFamily: 'ui-monospace, monospace' }}>{v.videoLength}</strong>
                                  </div>
                                )}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '0.4rem 0.6rem',
                                  background: 'var(--bg-surface)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>Times Completed</span>
                                  <strong style={{ color: 'var(--text-primary)' }}>{v.finishedCount || 0}×</strong>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '0.4rem 0.6rem',
                                  background: 'var(--bg-surface)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                                  <span style={{
                                    fontWeight: 'bold',
                                    color: v.status === 'started' ? 'var(--accent-primary)' : (v.status === 'finished' ? '#10b981' : 'var(--text-primary)'),
                                    textTransform: 'capitalize',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}>
                                    {v.status === 'started' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />}
                                    {v.status === 'finished' && <CheckCircle size={12} style={{ color: '#10b981' }} />}
                                    {v.status.replace('_', ' ')}
                                  </span>
                                </div>

                                {(() => {
                                  const clientReviewSecs = parseInt(localStorage.getItem(`client_review_seconds_${v.id}`) || '0', 10);
                                  if (clientReviewSecs === 0) return null;
                                  return (
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      padding: '0.4rem 0.6rem',
                                      background: 'rgba(16, 185, 129, 0.04)',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(16, 185, 129, 0.15)',
                                      alignItems: 'center'
                                    }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Client Review Time</span>
                                      <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>
                                        {formatTime(clientReviewSecs)}
                                      </strong>
                                    </div>
                                  );
                                })()}

                                {v.idleGaps && v.idleGaps.length > 0 && (
                                  <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', padding: '0 0.6rem' }}>Idle Intervals</span>
                                    <div style={{ maxHeight: '60px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                      {v.idleGaps.map((gap, idx) => (
                                        <div key={idx} style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          fontSize: '0.7rem',
                                          color: 'var(--text-secondary)',
                                          padding: '0.3rem 0.6rem',
                                          background: 'var(--bg-surface)',
                                          borderRadius: '6px',
                                          border: '1px solid var(--border-color)'
                                        }}>
                                          <span>Pause #{idx + 1}</span>
                                          <span style={{ fontFamily: 'ui-monospace, monospace' }}>{formatTime(gap)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredVideos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              {client.videos.length === 0 ? 'No video tracks added yet. Click "+" above to start.' : `No video tracks found matching "${searchQuery}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
