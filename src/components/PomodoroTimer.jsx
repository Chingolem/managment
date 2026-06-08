import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Brain, Bell, BellOff, Timer, Move, Minimize2, Volume2, VolumeX } from 'lucide-react';

const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: '#ef4444' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#10b981' },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: '#3b82f6' },
};

function playChime(ctx) {
  try {
    const now = ctx.currentTime;
    
    // Play a premium C-major arpeggio chime (C5 -> E5 -> G5 -> C6)
    const playNote = (freq, startOffset, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.25, now + startOffset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    playNote(523.25, 0, 0.4);   // C5
    playNote(659.25, 0.1, 0.4); // E5
    playNote(783.99, 0.2, 0.4); // G5
    playNote(1046.50, 0.3, 0.6); // C6
  } catch {
    // AudioContext may not be available; intentionally ignored.
  }
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function PomodoroTimer({ onClose }) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [notifOk, setNotifOk] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('timeroi_pomodoro_sound') !== 'false');
  const [customMins, setCustomMins] = useState({ focus: 25, shortBreak: 5, longBreak: 15 });
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 620 > 24 ? window.innerHeight - 620 : 24 });
  const [dragging, setDragging] = useState(false);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);
  const dragDataRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 });
  const sessionsRef = useRef(sessions);
  const customMinsRef = useRef(customMins);
  const modeRef = useRef(mode);
  const soundOnRef = useRef(soundOn);

  // Keep refs in sync so interval callback always reads fresh values
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { customMinsRef.current = customMins; }, [customMins]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  };

  const requestNotif = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifOk(result === 'granted');
  };

  const notify = useCallback((title, body) => {
    if (notifOk && typeof Notification !== 'undefined') {
      try {
        new Notification(title, { body, icon: '⏱' });
      } catch {
        // Browser may refuse notifications; intentionally ignored.
      }
    }

    if (soundOnRef.current) {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      playChime(ctx);
    }
  }, [notifOk]);

  const effectiveDuration = useCallback((m) => (customMinsRef.current[m] || MODES[m]?.duration / 60 || 25) * 60, []);

  const switchMode = useCallback((m) => {
    setMode(m);
    modeRef.current = m;
    setRunning(false);
    setTimeLeft((customMinsRef.current[m] || MODES[m]?.duration / 60 || 25) * 60);
    clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);

          const currentMode = modeRef.current;
          const currentSessions = sessionsRef.current;

          if (currentMode === 'focus') {
            const newSessions = currentSessions + 1;
            setSessions(newSessions);
            sessionsRef.current = newSessions;
            notify('🎉 Focus session complete!', 'Great work! Time for a break.');
            const next = newSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
            setTimeout(() => switchMode(next), 1000);
          } else {
            notify('⏰ Break over!', 'Back to focus mode!');
            setTimeout(() => switchMode('focus'), 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, notify, switchMode]);

  useEffect(() => {
    const handleMove = (e) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = expanded ? Math.min(920, viewportWidth - 32) : 360;
      const panelHeight = expanded ? Math.min(760, viewportHeight - 32) : 520;
      const maxX = Math.max(16, viewportWidth - panelWidth - 16);
      const maxY = Math.max(16, viewportHeight - panelHeight - 16);

      if (dragging) {
        const nextX = Math.min(maxX, Math.max(16, dragDataRef.current.originX + (e.clientX - dragDataRef.current.startX)));
        const nextY = Math.min(maxY, Math.max(16, dragDataRef.current.originY + (e.clientY - dragDataRef.current.startY)));
        setPosition({ x: nextX, y: nextY });
      }
    };

    const handleUp = () => setDragging(false);
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(16, Math.min(prev.x, window.innerWidth - (expanded ? Math.min(920, window.innerWidth - 32) : 360) - 16)),
        y: Math.max(16, Math.min(prev.y, window.innerHeight - (expanded ? Math.min(760, window.innerHeight - 32) : 520) - 16)),
      }));
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [dragging, expanded]);

  const startDrag = (e) => {
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    setDragging(true);
  };

  const toggle = () => {
    setRunning((r) => !r);
    // Only auto-expand when starting, not when pausing
    if (!running) {
      setExpanded(true);
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(effectiveDuration(mode));
    clearInterval(intervalRef.current);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const duration = effectiveDuration(mode);
  const progress = duration > 0 ? 1 - timeLeft / duration : 0;
  const color = MODES[mode].color;
  const circumference = 2 * Math.PI * 120;
  const panelWidth = expanded ? 'min(920px, calc(100vw - 32px))' : '360px';
  const panelHeight = expanded ? 'min(760px, calc(100vh - 32px))' : '520px';

  // Unique gradient ID to avoid SVG collisions if multiple instances exist
  const gradientId = 'pomodoroGradient_' + Math.random().toString(36).slice(2, 8);

  return (
    <>
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 9, 11, 0.66)',
            backdropFilter: 'blur(10px)',
            zIndex: 9997,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9998,
          width: panelWidth,
          height: panelHeight,
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-panel) 92%, white 8%), var(--bg-panel))',
          border: `1px solid ${color}55`,
          borderRadius: expanded ? '28px' : '22px',
          boxShadow: expanded
            ? `0 32px 120px rgba(0,0,0,0.45), 0 0 0 1px ${color}22, 0 0 80px ${color}33`
            : `0 12px 48px rgba(0,0,0,0.28), 0 0 0 1px ${color}22`,
          overflow: 'hidden',
          transition: dragging ? 'none' : 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          userSelect: dragging ? 'none' : 'auto',
        }}
      >
        <div
          onMouseDown={startDrag}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: expanded ? '1rem 1.2rem' : '0.75rem 1rem',
            background: `linear-gradient(90deg, ${color}20, transparent)`,
            borderBottom: `1px solid ${color}33`,
            cursor: dragging ? 'grabbing' : 'grab',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: expanded ? '42px' : '34px',
              height: expanded ? '42px' : '34px',
              borderRadius: '14px',
              display: 'grid',
              placeItems: 'center',
              background: `${color}22`,
              color,
            }}>
              <Timer size={expanded ? 22 : 16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: expanded ? '1rem' : '0.86rem' }}>Pomodoro Focus</strong>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.18rem 0.55rem',
                  borderRadius: '999px',
                  background: `${color}20`,
                  color,
                  fontWeight: 800,
                }}>
                  {sessions} sessions
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Drag to move • {running ? 'Running' : 'Ready'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button onClick={() => setSoundOn(p => {
              const next = !p;
              localStorage.setItem('timeroi_pomodoro_sound', String(next));
              return next;
            })} title={soundOn ? 'Sound alerts on' : 'Mute sound alerts'} style={headerBtnStyle(color)}>
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button onClick={requestNotif} title={notifOk ? 'Notifications on' : 'Enable notifications'} style={headerBtnStyle(color)}>
              {notifOk ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button onClick={() => setExpanded((v) => !v)} title={expanded ? 'Minimize timer' : 'Expand timer'} style={headerBtnStyle(color)}>
              {expanded ? <Minimize2 size={15} /> : <Move size={15} />}
            </button>
            <button onClick={onClose} title="Close timer" style={headerBtnStyle(color)}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: expanded ? '1.25fr 0.85fr' : '1fr',
          gap: expanded ? '1.1rem' : '0.75rem',
          padding: expanded ? '1.1rem' : '0.85rem',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-surface) 85%, white 15%), var(--bg-surface))',
            borderRadius: expanded ? '24px' : '18px',
            border: '1px solid var(--border-color)',
            padding: expanded ? '2rem 1rem' : '1rem',
            minHeight: expanded ? '100%' : '280px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: 'auto auto 0 0',
              width: '100%',
              height: '45%',
              background: `radial-gradient(circle at center, ${color}22, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: expanded ? '1.4rem' : '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.entries(MODES).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  style={{
                    padding: expanded ? '0.75rem 1rem' : '0.45rem 0.65rem',
                    borderRadius: '999px',
                    border: mode === key ? 'none' : '1px solid var(--border-color)',
                    background: mode === key ? cfg.color : 'var(--bg-panel)',
                    color: mode === key ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: expanded ? '0.86rem' : '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: expanded ? '320px' : '220px', height: expanded ? '320px' : '220px' }}>
              <svg width="100%" height="100%" viewBox="0 0 280 280">
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.65" />
                  </linearGradient>
                </defs>
                <circle cx="140" cy="140" r="120" fill="none" stroke="var(--border-color)" strokeWidth="16" opacity="0.35" />
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={expanded ? '18' : '16'}
                  strokeDasharray={`${progress * circumference} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(-90 140 140)"
                  style={{ transition: 'stroke-dasharray 1s linear', filter: `drop-shadow(0 0 12px ${color}66)` }}
                />
              </svg>

              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}>
                <span style={{ color, fontWeight: 900, fontSize: expanded ? '1rem' : '0.74rem', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                  {MODES[mode].label}
                </span>
                <span style={{
                  fontSize: expanded ? '4.25rem' : '2.4rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  color: 'var(--text-primary)',
                  textShadow: running ? `0 0 22px ${color}22` : 'none',
                  margin: expanded ? '0.5rem 0' : '0.35rem 0',
                }}>
                  {pad(mins)}:{pad(secs)}
                </span>
                <span style={{ fontSize: expanded ? '0.95rem' : '0.75rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                  {running ? 'Deep focus active — stay on one important task.' : 'Press start for a distraction-free focus session.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: expanded ? '1rem' : '0.75rem', marginTop: expanded ? '1.6rem' : '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={reset} style={smallCircleBtn()} title="Reset timer">
                <RotateCcw size={expanded ? 18 : 15} />
              </button>
              <button
                onClick={toggle}
                style={{
                  background: color,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: expanded ? '1rem 1.8rem' : '0.8rem 1.2rem',
                  fontSize: expanded ? '1rem' : '0.85rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  cursor: 'pointer',
                  boxShadow: `0 12px 28px ${color}55`,
                  transition: 'transform 0.1s, box-shadow 0.2s',
                }}
              >
                {running ? <Pause size={expanded ? 20 : 16} /> : <Play size={expanded ? 20 : 16} />}
                {running ? 'Pause' : 'Start focus'}
              </button>
              <button onClick={() => switchMode(mode === 'focus' ? 'shortBreak' : 'focus')} style={smallCircleBtn()} title="Toggle focus or break">
                {mode === 'focus' ? <Coffee size={expanded ? 18 : 15} /> : <Brain size={expanded ? 18 : 15} />}
              </button>
            </div>
          </div>

          {expanded && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              minHeight: 0,
            }}>
              <div style={sideCardStyle()}>
                <h3 style={sideTitleStyle()}>Focus controls</h3>
                <p style={sideTextStyle()}>
                  Adjust session durations. Changes apply on next start.
                </p>
                <div style={{ display: 'grid', gap: '0.7rem', marginTop: '1rem' }}>
                  {Object.entries(MODES).map(([key]) => (
                    <label key={key} style={{ display: 'grid', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {MODES[key].label} minutes
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={customMins[key]}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setCustomMins((prev) => {
                            const updated = { ...prev, [key]: val };
                            customMinsRef.current = updated;
                            return updated;
                          });
                          if (key === mode && !running) setTimeLeft(val * 60);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '12px',
                          border: `1px solid ${mode === key ? color : 'var(--border-color)'}`,
                          background: 'var(--bg-panel)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          fontFamily: 'inherit',
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={sideCardStyle()}>
                <h3 style={sideTitleStyle()}>Session rhythm</h3>
                <div style={{ display: 'flex', gap: '0.45rem', margin: '0.85rem 0 0.5rem', flexWrap: 'wrap' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '999px',
                        background: i < (sessions % 4) ? color : 'var(--bg-surface)',
                        border: `2px solid ${i < (sessions % 4) ? color : 'var(--border-color)'}`,
                        boxShadow: i < (sessions % 4) ? `0 0 14px ${color}33` : 'none',
                      }}
                    />
                  ))}
                </div>
                <p style={sideTextStyle()}>
                  Every 4 focus blocks earns a longer recovery break. Reset or stop anytime mid-session.
                </p>
              </div>

              <div style={sideCardStyle()}>
                <h3 style={sideTitleStyle()}>Smart reminders</h3>
                <p style={sideTextStyle()}>
                  Browser notifications and audio alerts keep you on track without keeping the timer visible.
                </p>
                <button onClick={requestNotif} style={{
                  marginTop: '0.9rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-panel)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  padding: '0.75rem 0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}>
                  {notifOk ? 'Notifications enabled' : 'Enable notifications'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function headerBtnStyle(color) {
  return {
    background: 'transparent',
    border: `1px solid ${color}33`,
    color: 'var(--text-secondary)',
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
  };
}

function smallCircleBtn() {
  return {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    borderRadius: '999px',
    width: '48px',
    height: '48px',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--text-secondary)',
    transition: 'border-color 0.2s, color 0.2s',
  };
}

function sideCardStyle() {
  return {
    background: 'linear-gradient(180deg, var(--bg-panel), color-mix(in srgb, var(--bg-surface) 92%, white 8%))',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '1.1rem',
  };
}

function sideTitleStyle() {
  return {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontWeight: 800,
  };
}

function sideTextStyle() {
  return {
    margin: '0.55rem 0 0',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.85rem',
  };
}
