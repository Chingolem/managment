import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useToastContext } from '../hooks/useToast.jsx';
import { LogIn, Sun, Moon, Eye, EyeOff, X, ArrowRight, MousePointer, Video, Paintbrush, FileText, Briefcase, UserPlus } from 'lucide-react';

const WORDS_EN = [
  "video editors.",
  "thumbnail artists.",
  "script writers.",
  "managers."
];

function AnimatedSubheading() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    if (subIndex === WORDS_EN[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % WORDS_EN.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
      setText(WORDS_EN[index].substring(0, subIndex));
    }, reverse ? 20 : 50);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <span style={{
      position: 'relative',
      display: 'inline-block',
      zIndex: 1,
      padding: '0 4px'
    }}>
      {text}
      {/* Yellow marker highlighter style element behind typing text */}
      <span style={{
        position: 'absolute',
        bottom: '6px',
        left: 0,
        width: '100%',
        height: '16px',
        background: '#fef08a',
        zIndex: -1,
        borderRadius: '2px',
        opacity: 0.8,
        transform: 'rotate(-0.5deg)'
      }} />
      <span className="blinking-cursor" style={{
        color: '#2563eb',
        marginLeft: '4px',
        animation: 'blink 1s infinite'
      }}>|</span>
    </span>
  );
}

// A highly interactive, animated playground canvas with floating collaborative cursors
function InteractiveHeroCanvas() {
  // Spaced coordinates to avoid collisions on initialization
  const [cards, setCards] = useState([
    { id: 1, title: "🎬 Intro Edit & Cut", x: 60, y: 70, color: '#fffaa0', rotate: '-1.5deg', emoji: '🔥 3' }, // yellow sticky - left
    { id: 2, title: "🎨 CTR Thumbnail Draft", x: 530, y: 70, color: '#e0f2fe', rotate: '2.5deg', emoji: '👍 5' }, // blue sticky - right
    { id: 3, title: "✍️ Write Title Options", x: 290, y: 170, color: '#dcfce7', rotate: '-1deg', emoji: '❤️ 4' } // green sticky - center-bottom
  ]);

  const [activeId, setActiveId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e, id, currentX, currentY) => {
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setOffset({ x: mouseX - currentX, y: mouseY - currentY });
    setActiveId(id);
  };

  const handleMouseMove = (e) => {
    if (activeId === null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Clamp to canvas boundaries (adjusted for spacing)
    const newX = Math.max(10, Math.min(590, mouseX - offset.x));
    const newY = Math.max(10, Math.min(240, mouseY - offset.y));

    setCards(prev => prev.map(c => c.id === activeId ? { ...c, x: newX, y: newY } : c));
  };

  const handleMouseUp = () => {
    setActiveId(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: '100%',
        maxWidth: '800px',
        height: '340px',
        background: 'var(--bg-surface)',
        backgroundImage: 'radial-gradient(var(--border-color) 1.5px, transparent 1.5px)',
        backgroundSize: '20px 20px',
        borderRadius: '16px',
        border: '1.5px solid var(--border-color)',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: activeId ? 'grabbing' : 'default',
        marginTop: '2rem'
      }}
    >
      {/* Dynamic CSS Keyframes for Collaborative Cursors */}
      <style>{`
        @keyframes floatSarah {
          0% { transform: translate(0, 0); }
          30% { transform: translate(90px, 20px); }
          70% { transform: translate(30px, 70px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes floatDave {
          0% { transform: translate(0, 0); }
          40% { transform: translate(-70px, -40px); }
          80% { transform: translate(20px, -15px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes floatAlex {
          0% { transform: translate(0, 0); }
          50% { transform: translate(60px, -20px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      {/* Dotted Canvas Banner Label */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        padding: '0.4rem 0.8rem',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        zIndex: 10
      }}>
        <MousePointer size={12} /> Playgrounds: Drag stickies & watch live cursor collaboration
      </div>

      {/* SVG Connecting Lines with Arrowheads */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>
        <line x1={cards[0].x + 90} y1={cards[0].y + 40} x2={cards[2].x + 90} y2={cards[2].y + 40} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 5" markerEnd="url(#arrow)" opacity="0.6" />
        <line x1={cards[2].x + 90} y1={cards[2].y + 40} x2={cards[1].x + 90} y2={cards[1].y + 40} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 5" markerEnd="url(#arrow)" opacity="0.6" />
      </svg>

      {/* Sticky Notes */}
      {cards.map(c => (
        <div
          key={c.id}
          onMouseDown={(e) => handleMouseDown(e, c.id, c.x, c.y)}
          style={{
            position: 'absolute',
            left: `${c.x}px`,
            top: `${c.y}px`,
            width: '180px',
            background: c.color,
            borderRadius: '4px',
            padding: '0.9rem',
            boxShadow: activeId === c.id ? '2px 16px 25px rgba(0,0,0,0.15)' : '2px 8px 15px rgba(0,0,0,0.06)',
            cursor: activeId === c.id ? 'grabbing' : 'grab',
            border: '1px solid rgba(0,0,0,0.06)',
            transform: activeId === c.id ? 'scale(1.05) rotate(0deg)' : `rotate(${c.rotate})`,
            transition: activeId === c.id ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
            color: '#1e293b'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.4, letterSpacing: '0.5px', marginBottom: '0.25rem' }}>TASK #{c.id}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', lineHeight: '1.3' }}>{c.title}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.7)', padding: '0.1rem 0.35rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold' }}>
              {c.emoji}
            </span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
          </div>
        </div>
      ))}

      {/* Floating Collaborative Cursors */}
      <div style={{
        position: 'absolute',
        left: '120px',
        top: '190px',
        animation: 'floatSarah 9s infinite alternate ease-in-out',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 30
      }}>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path d="M0 0V16.5L4.5 12L8.5 17.5L10.5 16L6.5 10.5L11.5 10L0 0Z" fill="#ec4899" />
        </svg>
        <div style={{
          background: '#ec4899',
          color: '#ffffff',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          padding: '0.15rem 0.4rem',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Sarah (Editor)
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: '490px',
        top: '210px',
        animation: 'floatDave 11s infinite alternate ease-in-out',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 30
      }}>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path d="M0 0V16.5L4.5 12L8.5 17.5L10.5 16L6.5 10.5L11.5 10L0 0Z" fill="#3b82f6" />
        </svg>
        <div style={{
          background: '#3b82f6',
          color: '#ffffff',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          padding: '0.15rem 0.4rem',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Dave (Writer)
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: '300px',
        top: '50px',
        animation: 'floatAlex 8s infinite alternate ease-in-out',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 30
      }}>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path d="M0 0V16.5L4.5 12L8.5 17.5L10.5 16L6.5 10.5L11.5 10L0 0Z" fill="#10b981" />
        </svg>
        <div style={{
          background: '#10b981',
          color: '#ffffff',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          padding: '0.15rem 0.4rem',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Alex (Artist)
        </div>
      </div>

    </div>
  );
}

// ─── SCROLL-ANIMATED WRAPPER ───
function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
}

// Interactive Playgrounds Capability Showcase component
const ARCHETYPE_META = {
  editors:  { label: 'Video Editors',     icon: Video,      accent: '#3b82f6' },
  artists:  { label: 'Thumbnail Artists', icon: Paintbrush, accent: '#ec4899' },
  writers:  { label: 'Script Writers',    icon: FileText,   accent: '#eab308' },
  managers: { label: 'Managers',          icon: Briefcase,  accent: '#10b981' },
};

function PlaygroundsCapabilitiesShowcase() {
  const [activeTab, setActiveTab] = useState('editors');
  const [hoverTab, setHoverTab] = useState(null);
  const [sectionRef, sectionVisible] = useScrollReveal({ threshold: 0.1 });
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.1 });

  const capabilities = {
    editors: {
      title: "🎬 Workflows for Video Editors",
      desc: "Connect your edit pipeline stages. Log render times, attach output links, and track cutting speed.",
      bullets: [
        <span>⏱️ Log <strong>edit durations</strong> directly on clip cards.</span>,
        <span>🔗 Connect <strong>A-Roll and B-Roll tasks</strong> into pipeline paths.</span>,
        <span>📁 Link <strong>export destinations</strong> (Drive, Frame.io) directly in cards.</span>
      ],
      cards: [
        { id: 1, title: "🎞️ 1. Edit A-Roll cut", x: 40, y: 70, color: '#fffaa0', emoji: '🎬 Done' },
        { id: 2, title: "✂️ 2. Apply sound effects", x: 260, y: 50, color: '#e0f2fe', emoji: '⚡ Active' },
        { id: 3, title: "🎨 3. Export render files", x: 485, y: 150, color: '#dcfce7', emoji: '📦 Output' }
      ]
    },
    artists: {
      title: "🎨 Layout Boards for Thumbnail Artists",
      desc: "Structure layout compositions, color variations, and check click-through rate variations.",
      bullets: [
        <span>🖼️ Link <strong>typography notes</strong> to layout mockups.</span>,
        <span>💵 Track <strong>rates and invoice statuses</strong> inside thumbnails.</span>,
        <span>📂 Save <strong>Figma or Photoshop links</strong> within asset fields.</span>
      ],
      cards: [
        { id: 1, title: "📐 1. Composition grid", x: 40, y: 70, color: '#fbcfe8', emoji: '📐 Approved' },
        { id: 2, title: "🖌️ 2. Apply color correction", x: 260, y: 50, color: '#ddd6fe', emoji: '🎨 Draft' },
        { id: 3, title: "💡 3. Export 1920x1080 PSD", x: 485, y: 150, color: '#fed7aa', emoji: '📁 Final' }
      ]
    },
    writers: {
      title: "✍️ Outline Maps for Script Writers",
      desc: "Map hook narratives, log sources, and keep script revisions on visual pathways.",
      bullets: [
        <span>💡 Group <strong>hook variations</strong> into visual options.</span>,
        <span>⏳ Set <strong>deadlines</strong> to coordinate script handoffs.</span>,
        <span>📁 Store <strong>research outlines</strong> in link inputs.</span>
      ],
      cards: [
        { id: 1, title: "💡 1. Outline Hook options", x: 40, y: 70, color: '#fef08a', emoji: '💡 Ideas' },
        { id: 2, title: "📝 2. Competitor research", x: 260, y: 50, color: '#fef08a', emoji: '📝 Review' },
        { id: 3, title: "✍️ 3. Write final dialog", x: 485, y: 150, color: '#fef08a', emoji: '🔥 Ready' }
      ]
    },
    managers: {
      title: "💼 Coordinator Boards for Managers",
      desc: "Delegate client channels, track active clocks, and coordinate multi-creator deliverables.",
      bullets: [
        <span>👥 Assign <strong>specific creators</strong> to project tasks.</span>,
        <span>📊 Track <strong>cumulative seconds</strong> spent on editing projects.</span>,
        <span>📂 Archive <strong>finished projects</strong> to keep pipelines clean.</span>
      ],
      cards: [
        { id: 1, title: "📂 1. Audit client folders", x: 40, y: 70, color: '#f4f4f5', emoji: '📂 Checked' },
        { id: 2, title: "👥 2. Delegate team roles", x: 260, y: 50, color: '#f4f4f5', emoji: '👥 Active' },
        { id: 3, title: "💼 3. Client Invoicing", x: 485, y: 150, color: '#f4f4f5', emoji: '💵 Sent' }
      ]
    }
  };

  const current = capabilities[activeTab];

  const getCanvasBackground = () => {
    switch(activeTab) {
      case 'artists':
        return 'linear-gradient(to right, var(--border-color) 1px, transparent 1px), linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)';
      case 'writers':
        return 'linear-gradient(var(--border-color) 1px, transparent 1px)';
      case 'managers':
        return 'none';
      case 'editors':
      default:
        return 'radial-gradient(var(--border-color) 1.5px, transparent 1.5px)';
    }
  };

  const getBackgroundSize = () => {
    if (activeTab === 'writers') return '100% 24px';
    return '20px 20px';
  };

  return (
    <div ref={sectionRef} style={{ display: 'flex', flexDirection: 'column', gap: '3rem', width: '100%' }}>
      {/* Dynamic keyframe animation styles */}
      <style>{`
        @keyframes showcaseCardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes showcasePanelEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes bulletSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes lineDrawIn {
          from { stroke-dashoffset: 200; }
          to   { stroke-dashoffset: 0; }
        }
        .archetype-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 99px;
          padding: 0.6rem 1.2rem;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border: 1.5px solid var(--border-color);
          background: var(--bg-surface);
          color: var(--text-primary);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.25s ease,
                      color 0.25s ease,
                      border-color 0.25s ease,
                      box-shadow 0.25s ease;
          will-change: transform;
        }
        .archetype-tab:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        }
        .archetype-tab.active {
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0,0,0,0.12);
        }
        .archetype-tab svg { flex-shrink: 0; }
      `}</style>

      {/* Capability Tabs — stagger in from scroll */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0.6rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.25rem',
        opacity: sectionVisible ? 1 : 0,
        transform: sectionVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {Object.keys(capabilities).map((key, idx) => {
          const meta = ARCHETYPE_META[key];
          const Icon = meta.icon;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              onMouseEnter={() => setHoverTab(key)}
              onMouseLeave={() => setHoverTab(null)}
              className={`archetype-tab${isActive ? ' active' : ''}`}
              style={{
                background: isActive ? meta.accent : 'var(--bg-surface)',
                borderColor: isActive ? meta.accent : (hoverTab === key ? meta.accent : 'var(--border-color)'),
                transitionDelay: sectionVisible ? `${idx * 0.08}s` : '0s',
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? (isActive ? 'translateY(-1px)' : 'translateY(0)') : 'translateY(16px)',
                transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease'
              }}
            >
              <Icon size={16} strokeWidth={2.4} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Showcase Workspace split grid — keyed so both columns re-animate on tab switch */}
      <div
        ref={gridRef}
        key={activeTab}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '4rem',
          alignItems: 'center',
          textAlign: 'left',
          animation: gridVisible ? 'showcasePanelEnter 0.45s ease-out both' : 'none',
          opacity: gridVisible ? 1 : 0
        }}>
        {/* Left: text column with staggered bullet reveals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: '900',
            color: 'var(--text-primary)',
            margin: 0,
            animation: 'revealFadeUp 0.5s ease-out both',
            animationDelay: '0.05s'
          }}>
            {current.title}
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: '1.6',
            margin: 0,
            animation: 'revealFadeUp 0.5s ease-out both',
            animationDelay: '0.12s'
          }}>
            {current.desc}
          </p>
          <ul style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            paddingLeft: '1.25rem',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}>
            {current.bullets.map((b, idx) => (
              <li
                key={idx}
                style={{
                  lineHeight: '1.5',
                  animation: 'bulletSlideIn 0.4s ease-out both',
                  animationDelay: `${0.2 + idx * 0.1}s`
                }}
              >
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: canvas with scale-in reveal */}
        <div
          style={{
            height: '290px',
            background: 'var(--bg-panel)',
            backgroundImage: getCanvasBackground(),
            backgroundSize: getBackgroundSize(),
            borderRadius: '16px',
            border: activeTab === 'artists'
              ? `2px dashed ${ARCHETYPE_META[activeTab].accent}`
              : '1.5px solid var(--border-color)',
            boxShadow: `0 20px 40px ${ARCHETYPE_META[activeTab].accent}14`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            animation: 'revealScale 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0.15s'
          }}
        >
          {/* Lined notebook top pink line for script writers */}
          {activeTab === 'writers' && (
            <div style={{
              position: 'absolute',
              left: '30px',
              top: 0,
              width: '2px',
              height: '100%',
              background: '#f43f5e',
              opacity: 0.6
            }} />
          )}

          {/* Kanban columns dividers for Managers */}
          {activeTab === 'managers' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              pointerEvents: 'none'
            }}>
              <div style={{ borderRight: '1.5px dashed var(--border-color)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', left: '15px', fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                  IN PROGRESS
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', left: '15px', fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                  COMPLETED & BILLABLE
                </span>
              </div>
            </div>
          )}

          {/* Connecting Line paths with draw-in animation */}
          {activeTab !== 'managers' && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <marker id="showcase-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                </marker>
              </defs>
              <line
                x1={current.cards[0].x + 85}
                y1={current.cards[0].y + 35}
                x2={current.cards[2].x + 85}
                y2={current.cards[2].y + 35}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#showcase-arrow)"
                opacity="0.6"
                style={{ animation: 'showcaseCardEnter 0.35s ease-out both, lineDrawIn 0.6s ease-out both', animationDelay: '0.1s' }}
              />
              <line
                x1={current.cards[2].x + 85}
                y1={current.cards[2].y + 35}
                x2={current.cards[1].x + 85}
                y2={current.cards[1].y + 35}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#showcase-arrow)"
                opacity="0.6"
                style={{ animation: 'showcaseCardEnter 0.35s ease-out both, lineDrawIn 0.6s ease-out both', animationDelay: '0.2s' }}
              />
            </svg>
          )}

          {current.cards.map((c, idx) => (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: `${c.x}px`,
                top: `${c.y}px`,
                width: '170px',
                background: c.color,
                borderRadius: activeTab === 'artists' ? '12px' : '4px',
                padding: '0.8rem',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                border: activeTab === 'writers' ? '1.5px solid #eab308' : activeTab === 'managers' ? '1.5px solid var(--border-color)' : '1px solid rgba(0,0,0,0.06)',
                color: '#1e293b',
                textAlign: 'left',
                fontFamily: activeTab === 'writers' ? 'Courier, monospace' : 'inherit',
                animation: `showcaseCardEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both`,
                animationDelay: `${0.25 + idx * 0.1}s`
              }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.4, marginBottom: '0.15rem' }}>STAGE #{c.id}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', lineHeight: '1.2' }}>{c.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ background: 'rgba(255,255,255,0.8)', padding: '0.1rem 0.3rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                  {c.emoji}
                </span>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCROLL-ANIMATED INFO SECTION ───
function InfoSection() {
  const [headerRef, headerVisible] = useScrollReveal({ threshold: 0.2 });

  return (
    <section style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-color)',
      borderBottom: '1px solid var(--border-color)',
      padding: '6rem 6rem',
      transition: 'background 0.2s, border-color 0.2s'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '3rem'
      }}>
        <div ref={headerRef}>
          <span style={{
            color: 'var(--accent-primary)',
            fontWeight: '800',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'block',
            marginBottom: '0.5rem',
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            Capabilities Showcase
          </span>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            letterSpacing: '-1.5px',
            color: 'var(--text-primary)',
            margin: 0,
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease 0.08s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s'
          }}>
            One platform, any playground workspace.
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0.75rem auto 0 auto',
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease 0.16s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.16s'
          }}>
            Select an archetype below to preview custom planning layouts and visual pipeline workflows.
          </p>
        </div>

        {/* Interactive Showcase component */}
        <PlaygroundsCapabilitiesShowcase />
      </div>
    </section>
  );
}

export default function AuthScreen({ theme, setTheme }) {
  const { login, signup } = useAuth();
  const { t } = useLanguage();
  const { error } = useToastContext();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalTab, setModalTab] = useState('signin'); // 'signin' | 'register'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDarkMode = theme['--bg-dark'] === '#09090b';

  const toggleTheme = () => {
    if (isDarkMode) {
      setTheme({
        '--bg-dark': '#f4f4f5',
        '--bg-panel': '#ffffff',
        '--bg-panel-hover': '#f4f4f5',
        '--bg-surface': '#fafafa',
        '--accent-primary': '#2563eb',
        '--accent-hover': '#3b82f6',
        '--accent-glow': 'rgba(37, 99, 235, 0.1)',
        '--border-color': '#e4e4e7',
        '--text-primary': '#09090b',
        '--text-secondary': '#71717a'
      });
    } else {
      setTheme({
        '--bg-dark': '#09090b',
        '--bg-panel': '#18181b',
        '--bg-panel-hover': '#27272a',
        '--bg-surface': '#111114',
        '--accent-primary': '#3b82f6',
        '--accent-hover': '#60a5fa',
        '--accent-glow': 'rgba(59, 130, 246, 0.15)',
        '--border-color': '#27272a',
        '--text-primary': '#fafafa',
        '--text-secondary': '#a1a1aa'
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);

    if (modalTab === 'signin') {
      const isSuccess = await login(email.trim(), password);
      if (!isSuccess) {
        setIsSubmitting(false);
      }
      // On success, the auth state change will unmount this component
    } else {
      if (password !== confirmPassword) {
        error(t('auth_passwords_mismatch') || 'Passwords do not match!');
        setIsSubmitting(false);
        return;
      }
      const isSuccess = await signup(email.trim(), password);
      if (isSuccess) {
        // Automatically login the user after successful registration
        await login(email.trim(), password);
        setShowLoginModal(false);
        setPassword('');
        setConfirmPassword('');
        setDiscordId('');
      }
      setIsSubmitting(false);
    }
  };

  const switchModalTab = (tab) => {
    setModalTab(tab);
    setPassword('');
    setConfirmPassword('');
    setDiscordId('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-panel)',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background 0.2s, color 0.2s'
    }}>
      {/* ─── LANDING HEADER ─── */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 6rem',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(16px)',
        zIndex: 50,
        transition: 'background 0.2s, border-color 0.2s'
      }}>
        {/* Clickable logo to go to main landing page (closes modal) */}
        <div
          onClick={() => setShowLoginModal(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'var(--accent-primary)',
            color: 'white',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            E
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            EditFlow <span style={{ color: 'var(--accent-primary)' }}>PRO</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => { setModalTab('signin'); setShowLoginModal(true); }}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px var(--accent-glow)',
              transition: 'all 0.2s'
            }}
          >
            Sign In <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        padding: '7rem 6rem 9rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2.5rem'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '950',
          lineHeight: '1.15',
          letterSpacing: '-2px',
          maxWidth: '850px',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          For <AnimatedSubheading />
        </h1>

        <button
          onClick={() => { setModalTab('signin'); setShowLoginModal(true); }}
          style={{
            background: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '1.1rem 2.8rem',
            fontSize: '1.1rem',
            fontWeight: '750',
            cursor: 'pointer',
            boxShadow: '0 10px 25px var(--accent-glow)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Access Workspace <ArrowRight size={18} />
        </button>

        {/* Playgrounds Canvas Component */}
        <InteractiveHeroCanvas />
      </section>

      {/* ─── INFO SECTION (SCROLLABLE CAPABILITIES SHOWCASE) ─── */}
      <InfoSection />

      <footer style={{
        padding: '4rem 6rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
      }}>
        &copy; {new Date().getFullYear()} EditFlow PRO. Designed for visual project mapping.
      </footer>

      {/* ─── SPLIT-SCREEN LOGIN / REGISTER MODAL ─── */}
      {showLoginModal && (
        <div
          className="auth-modal-overlay"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="auth-modal-split"
            onClick={e => e.stopPropagation()}
          >
            {/* ─── LEFT: Brand Panel ─── */}
            <div className="auth-modal-left">
              <div className="auth-modal-left-content">
                <h2 className="auth-modal-title">
                  {modalTab === 'register' ? 'Join the' : 'Welcome back to the'}
                  <br />
                  <span style={{ color: '#60a5fa' }}>EditFlow</span> workflow.
                </h2>
                <p className="auth-modal-desc">
                  {modalTab === 'register'
                    ? 'Create your account and start mapping your projects with visual canvases and role-tailored dashboards.'
                    : 'Sign in to access your canvases, track your pipeline, and collaborate with your team.'
                  }
                </p>

                {/* Steps for register */}
                {modalTab === 'register' && (
                  <div className="auth-modal-steps">
                    <div className="auth-modal-step">
                      <div className="auth-modal-step-num">1</div>
                      <div>
                        <div className="auth-modal-step-label">Create Account</div>
                        <div className="auth-modal-step-desc">Choose your email & password</div>
                      </div>
                    </div>
                    <div className="auth-modal-step">
                      <div className="auth-modal-step-num">2</div>
                      <div>
                        <div className="auth-modal-step-label">Pick Your Role</div>
                        <div className="auth-modal-step-desc">Editor, Artist, Writer, or Manager</div>
                      </div>
                    </div>
                    <div className="auth-modal-step">
                      <div className="auth-modal-step-num">3</div>
                      <div>
                        <div className="auth-modal-step-label">Start Mapping</div>
                        <div className="auth-modal-step-desc">Drag-and-drop your first project</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick stats for login */}
                {modalTab === 'signin' && (
                  <div className="auth-modal-stats">
                    <div className="auth-modal-stat">
                      <span className="auth-modal-stat-val">4</span>
                      <span className="auth-modal-stat-label">Workspaces</span>
                    </div>
                    <div className="auth-modal-stat">
                      <span className="auth-modal-stat-val">∞</span>
                      <span className="auth-modal-stat-label">Canvases</span>
                    </div>
                    <div className="auth-modal-stat">
                      <span className="auth-modal-stat-val">0</span>
                      <span className="auth-modal-stat-label">Cloud Deps</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── RIGHT: Form Panel ─── */}
            <div className="auth-modal-right">
              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="auth-modal-close"
              >
                <X size={18} />
              </button>

              {/* Modal Brand Logo */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    E
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: '850', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                    EditFlow <span style={{ color: 'var(--accent-primary)' }}>PRO</span>
                  </span>
                </div>
              </div>

              {/* Sliding Tab Switcher */}
              <div className="auth-modal-tabs">
                <button
                  className={`auth-modal-tab ${modalTab === 'signin' ? 'active' : ''}`}
                  onClick={() => switchModalTab('signin')}
                >
                  <LogIn size={14} /> Sign In
                </button>
                <button
                  className={`auth-modal-tab ${modalTab === 'register' ? 'active' : ''}`}
                  onClick={() => switchModalTab('register')}
                >
                  <UserPlus size={14} /> Register
                </button>
                <div
                  className="auth-modal-tab-indicator"
                  style={{ transform: modalTab === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
                />
              </div>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="auth-modal-field">
                  <label className="auth-modal-label">Email</label>
                  <input
                    type="email"
                    className="auth-modal-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="auth-modal-field">
                  <label className="auth-modal-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-modal-input auth-modal-input-with-icon"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={modalTab === 'register' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      className="auth-modal-icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {modalTab === 'register' && (
                  <div className="auth-modal-field">
                    <label className="auth-modal-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="auth-modal-input auth-modal-input-with-icon"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="auth-modal-icon-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {modalTab === 'signin' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{
                        accentColor: 'var(--accent-primary)',
                        width: '15px',
                        height: '15px',
                        cursor: 'pointer'
                      }}
                    />
                    Keep me signed in
                  </label>
                )}

                <button
                  type="submit"
                  className="auth-modal-submit"
                  disabled={isSubmitting}
                  style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? (
                    <span className="auth-modal-spinner" />
                  ) : modalTab === 'signin' ? (
                    <>
                      <LogIn size={16} /> Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Switch link */}
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.75rem 0 0' }}>
                {modalTab === 'register' ? (
                  <>Already have an account? <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }} onClick={() => switchModalTab('signin')}>Sign in</button></>
                ) : (
                  <>New to EditFlow? <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }} onClick={() => switchModalTab('register')}>Create an account</button></>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
