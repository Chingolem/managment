import { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, RefreshCcw, X, Plus, ListTodo, FileEdit, Settings, LinkIcon, Video as VideoIcon, Calendar, DollarSign as Dollar, Trash2, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth, WORKSPACE_CONFIGS, getTimerKeys } from '../hooks/useAuth.jsx';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function VideoOverlay({ video, updateVideo, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState(video.price);
  const [note, setNote] = useState(video.note || '');
  const [sourceLink, setSourceLink] = useState(video.sourceLink || '');
  const [finalLink, setFinalLink] = useState(video.finalLink || '');
  const [deadline, setDeadline] = useState(video.deadline || '');
  const [videoLength, setVideoLength] = useState(video.videoLength || '');
  const [checklist, setChecklist] = useState(video.checklist || []);
  const [newTask, setNewTask] = useState('');
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const config = WORKSPACE_CONFIGS[user?.role || 'video_editor'];
  const keys = getTimerKeys(user?.role || 'video_editor');

  const vStatus = video[keys.status] || 'not_started';
  const vLastStartTime = video[keys.lastStartTime];
  const vTotalSeconds = video[keys.totalSeconds] || 0;

  const [activeSeconds, setActiveSeconds] = useState(vTotalSeconds);

  const getStatusText = (status) => {
    const key = config.statusKeys[status] || 'status_not_started';
    return t(key);
  };

  const singularLabel = t(config.singularKey);

  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    requestAnimationFrame(() => setIsOpen(true));
  }, []);

  useEffect(() => {
    let interval;
    if (vStatus === 'started' && vLastStartTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - vLastStartTime) / 1000);
        setActiveSeconds(vTotalSeconds + diff);
      }, 1000);
    } else {
      setActiveSeconds(vTotalSeconds);
    }
    return () => clearInterval(interval);
  }, [vStatus, vLastStartTime, vTotalSeconds]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') triggerClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Keyboard shortcut: Space to toggle timer
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ') {
        e.preventDefault();
        if (vStatus === 'not_started' || vStatus === 'paused') {
          updateVideo(video.id, { [keys.status]: 'started', [keys.lastStartTime]: Date.now() });
        } else if (vStatus === 'started') {
          const diff = vLastStartTime ? Math.floor((Date.now() - vLastStartTime) / 1000) : 0;
          updateVideo(video.id, { [keys.status]: 'paused', [keys.totalSeconds]: vTotalSeconds + diff, [keys.lastStartTime]: null });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [vStatus, vLastStartTime, vTotalSeconds, video.id, updateVideo, keys]);

  const triggerClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const handleStart = () => {
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

  const handlePause = () => {
    const diff = vLastStartTime ? Math.floor((Date.now() - vLastStartTime) / 1000) : 0;
    updateVideo(video.id, { 
      [keys.status]: 'paused', 
      [keys.totalSeconds]: vTotalSeconds + diff, 
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: Date.now()
    });
  };

  const handleFinish = () => {
    let extra = 0;
    const vFinishedCount = video[keys.finishedCount] || 0;
    if (vStatus === 'started' && vLastStartTime) extra = Math.floor((Date.now() - vLastStartTime) / 1000);
    updateVideo(video.id, { 
      [keys.status]: 'finished', 
      [keys.totalSeconds]: vTotalSeconds + extra, 
      [keys.lastStartTime]: null,
      [keys.finishedCount]: vFinishedCount + 1
    });
  };

  const handleReopen = () => {
    updateVideo(video.id, {
      [keys.status]: 'paused',
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: Date.now()
    });
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    setResetConfirm(false);
    updateVideo(video.id, {
      [keys.status]: 'not_started',
      [keys.totalSeconds]: 0,
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: null
    });
  };

  const handleNotesKeyDown = (e) => {
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
          setNote(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
          }, 0);
          return;
        }

        e.preventDefault();
        const bulletSymbol = bulletMatch[1];
        const insertion = `\n${bulletSymbol} `;
        const newValue = beforeCursor + insertion + text.substring(start);
        setNote(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
        }, 0);
      } else if (numberMatch) {
        if (!numberMatch[3].trim()) {
          e.preventDefault();
          const lineStart = beforeCursor.lastIndexOf('\n') + 1;
          const newValue = text.substring(0, lineStart) + '\n' + text.substring(start);
          setNote(newValue);
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
        setNote(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
        }, 0);
      }
    }
  };

  const handleSaveDetails = () => {
    updateVideo(video.id, { price: parseFloat(price) || 0, note, sourceLink, finalLink, deadline, videoLength, checklist });
    setSaveIndicator(true);
    setTimeout(triggerClose, 500);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={triggerClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={triggerClose}><X size={28} /></button>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>{singularLabel} #{video.id}</h1>
          <div className={`status-badge ${vStatus}`} style={{ display: 'inline-block', fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
            {getStatusText(vStatus)}
          </div>
        </div>

        <div className={`expanded-timer ${vStatus === 'started' ? 'active' : ''}`}>
          {formatTime(activeSeconds)}
        </div>

        <div className="expanded-actions" style={{ padding: '0 0 3rem 0', border: 'none', borderBottom: '1px solid var(--border-color)', marginBottom: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {vStatus === 'not_started' && <button className="btn btn-primary" onClick={handleStart} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Play size={20} /> Start</button>}
          {vStatus === 'started' && (
            <>
              <button className={`btn ${resetConfirm ? 'btn-danger' : 'btn-outline'}`} onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCcw size={20} /> {resetConfirm ? t('areYouSure') : 'Reset'}
              </button>
              <button className="btn btn-success" onClick={handleFinish} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={20} /> Finish</button>
            </>
          )}
          {vStatus === 'paused' && (
            <>
              <button className="btn btn-primary" onClick={handleStart} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Play size={20} /> Start</button>
              <button className="btn btn-success" onClick={handleFinish} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={20} /> Finish</button>
              <button className={`btn ${resetConfirm ? 'btn-danger' : 'btn-outline'}`} onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCcw size={20} /> {resetConfirm ? t('areYouSure') : t('reset')}
              </button>
            </>
          )}
          {vStatus === 'finished' && (
            <>
              <button className="btn btn-warning" onClick={handleReopen} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCcw size={20} /> Reopen
              </button>
              <button className={`btn ${resetConfirm ? 'btn-danger' : 'btn-outline'}`} onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCcw size={20} /> {resetConfirm ? t('areYouSure') : t('reset')}
              </button>
            </>
          )}
        </div>

        <div className="expanded-grid">
          <div className="expanded-left">
            <h3 className="expanded-section-title"><ListTodo size={20} color="var(--accent-primary)"/> {t('subTasks')}</h3>
            <div style={{ marginBottom: '2rem' }}>
              {checklist.map((item, index) => (
                <div key={index} className="checklist-item">
                  <input type="checkbox" className="checklist-checkbox" checked={item.done} onChange={() => {
                    const newChecklist = [...checklist];
                    newChecklist[index].done = !newChecklist[index].done;
                    setChecklist(newChecklist);
                  }} />
                  <span className={`checklist-text ${item.done ? 'done' : ''}`}>{item.text}</span>
                  <button className="btn-ghost" onClick={() => setChecklist(checklist.filter((_, i) => i !== index))} style={{ padding: '0.2rem', color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="checklist-add">
                <input type="text" className="input-field" placeholder={t('newTaskPlaceholder')} value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => {
                  if (e.key === 'Enter' && newTask.trim()) {
                    setChecklist([...checklist, { text: newTask.trim(), done: false }]);
                    setNewTask('');
                  }
                }} />
                <button className="btn btn-primary" onClick={() => {
                  if (newTask.trim()) {
                    setChecklist([...checklist, { text: newTask.trim(), done: false }]);
                    setNewTask('');
                  }
                }}><Plus size={16} /></button>
              </div>
            </div>
            <h3 className="expanded-section-title"><FileEdit size={20} color="var(--accent-primary)"/> {t('ideasNotes')}</h3>
            <div className="form-group">
              <textarea 
                className="input-field" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                onKeyDown={handleNotesKeyDown}
                placeholder={t('ideasPlaceholder')} 
              />
            </div>
          </div>

          <div className="expanded-right">
            <h3 className="expanded-section-title"><Settings size={20} color="var(--accent-primary)"/> {t('metadata')}</h3>
            <div className="form-group">
              <label>⏱ Video Length</label>
              <input type="text" className="input-field" value={videoLength} onChange={e => setVideoLength(e.target.value)} placeholder="e.g. 12:30" style={{fontFamily:'monospace', fontWeight:'700'}} />
            </div>
            <div className="form-group">
              <label><LinkIcon size={14} style={{display:'inline', marginRight:'4px'}}/> {t(config.meta1Key)}</label>
              <input type="text" className="input-field" value={sourceLink} onChange={e => setSourceLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label><VideoIcon size={14} style={{display:'inline', marginRight:'4px'}}/> {t(config.meta2Key)}</label>
              <input type="text" className="input-field" value={finalLink} onChange={e => setFinalLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label><Calendar size={14} style={{display:'inline', marginRight:'4px'}}/> {t(config.meta3Key)}</label>
              <input type="date" className="input-field" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div className="form-group">
              <label><Dollar size={14} style={{display:'inline', marginRight:'4px'}}/> {t(config.meta4Key)}</label>
              <input type="number" className="input-field" value={price} onChange={e => setPrice(e.target.value)} style={{fontSize:'1.5rem', fontWeight:'700'}} />
            </div>
            <button className="btn btn-outline" style={{width:'100%', marginTop:'1rem', padding:'1rem', fontSize:'1.1rem', borderColor: saveIndicator ? 'var(--success)' : '', color: saveIndicator ? 'var(--success)' : ''}} onClick={handleSaveDetails}>
              {saveIndicator ? <><Check size={20}/> {t('saved')}</> : t('saveDetails')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}