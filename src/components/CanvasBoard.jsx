import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play, Pause, CheckCircle, RefreshCcw, GripVertical, Link, Maximize2, Trash2,
  MousePointer, PenTool, StickyNote, Type, Trash, Film, ZoomIn, ZoomOut, RotateCcw, X
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth, WORKSPACE_CONFIGS, getTimerKeys } from '../hooks/useAuth.jsx';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CanvasBoard({ client, updateVideo, updateClient, onOpenFull }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const keys = getTimerKeys(user?.role || 'video_editor');
  const config = WORKSPACE_CONFIGS[user?.role || 'video_editor'];

  const containerRef = useRef(null);

  // Board states
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Whiteboard Active Tool: 'pan' | 'pen' | 'sticky' | 'text'
  const [activeTool, setActiveTool] = useState('pan');
  const [penColor, setPenColor] = useState('#3b82f6'); // default blue

  // Dragging state
  const [activeDragId, setActiveDragId] = useState(null); // card ID (number) or note ID (string)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Linking / Connection state
  const [linkingFromId, setLinkingFromId] = useState(null); // card ID or note ID
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [connectionDragStart, setConnectionDragStart] = useState(null);
  const [connectionDragCurrent, setConnectionDragCurrent] = useState(null);

  // Freehand drawing drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);

  // Parse notes, drawings, connections
  const stickyNotes = client.stickyNotes || [];
  const drawingPaths = client.drawingPaths || [];
  const connections = client.connections || [];

  const videos = useMemo(() => {
    return (client.videos || [])
      .filter(v => v.showOnCanvas === true)
      .map((v, i) => ({
        ...v,
        canvasX: v.canvasX !== undefined ? v.canvasX : 50 + (i % 4) * 280,
        canvasY: v.canvasY !== undefined ? v.canvasY : 60 + Math.floor(i / 4) * 200
      }));
  }, [client.videos]);

  const [activeTimers, setActiveTimers] = useState({});

  // Poll active timers to redraw elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const copy = { ...prev };
        let updated = false;
        videos.forEach(v => {
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
  }, [videos, keys]);

  // Handle escape key to cancel active modes or linking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveTool('pan');
        setIsDraggingConnection(false);
        setLinkingFromId(null);
        setConnectionDragStart(null);
        setConnectionDragCurrent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unified list of all visual nodes on canvas for connection calculations
  const allNodes = useMemo(() => {
    const list = [];
    videos.forEach(v => {
      list.push({
        id: v.id,
        x: v.canvasX,
        y: v.canvasY,
        width: 240,
        height: 160
      });
    });
    stickyNotes.forEach(n => {
      list.push({
        id: n.id,
        x: n.x,
        y: n.y,
        width: 160,
        height: 160
      });
    });
    return list;
  }, [videos, stickyNotes]);

  // Handle Zoom from Controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.25));
  const handleResetPanZoom = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Zoom via wheel (Ctrl + Scroll, or standard scroll with fallback)
  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.08;
    const scaleFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
    const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.25), 4);

    // Zoom relative to mouse cursor
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
    }));
    setZoom(newZoom);
  };

  // Start dragging a connection line
  const handleStartConnectionDrag = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const node = allNodes.find(n => n.id === id);
    if (!node) return;

    const startX = node.x + node.width / 2;
    const startY = node.y + node.height / 2;

    setLinkingFromId(id);
    setConnectionDragStart({ x: startX, y: startY });
    setConnectionDragCurrent({ x: startX, y: startY });
    setIsDraggingConnection(true);
  };

  // Global mouse handlers for canvas
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - pan.x) / zoom;
    const cy = (e.clientY - rect.top - pan.y) / zoom;

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath({
        id: 'path_' + Date.now(),
        points: [[cx, cy]],
        color: penColor
      });
    } else if (activeTool === 'sticky' || activeTool === 'text') {
      const newNote = {
        id: 'note_' + Date.now(),
        type: activeTool,
        x: cx - 80,
        y: cy - 80,
        text: '',
        color: activeTool === 'sticky' ? '#fef08a' : 'transparent'
      };
      updateClient(client.id, {
        stickyNotes: [...stickyNotes, newNote]
      });
      setActiveTool('pan');
    } else {
      // Pan mode
      if (e.target.closest('.canvas-card') || e.target.closest('.whiteboard-note')) {
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - pan.x) / zoom;
    const cy = (e.clientY - rect.top - pan.y) / zoom;

    if (isDraggingConnection) {
      setConnectionDragCurrent({ x: cx, y: cy });
    } else if (isDrawing && currentPath) {
      setCurrentPath(prev => ({
        ...prev,
        points: [...prev.points, [cx, cy]]
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (activeDragId !== null) {
      // Dragging card or sticky note
      const newX = cx - dragOffset.x;
      const newY = cy - dragOffset.y;

      if (typeof activeDragId === 'number') {
        updateVideo(activeDragId, { canvasX: newX, canvasY: newY });
      } else {
        const updatedNotes = stickyNotes.map(n =>
          n.id === activeDragId ? { ...n, x: newX, y: newY } : n
        );
        updateClient(client.id, { stickyNotes: updatedNotes });
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - pan.x) / zoom;
    const cy = (e.clientY - rect.top - pan.y) / zoom;

    if (isDraggingConnection) {
      const targetNode = allNodes.find(node =>
        node.id !== linkingFromId &&
        cx >= node.x && cx <= node.x + node.width &&
        cy >= node.y && cy <= node.y + node.height
      );

      if (targetNode) {
        const exists = connections.some(
          c => (c.from === linkingFromId && c.to === targetNode.id) || (c.from === targetNode.id && c.to === linkingFromId)
        );
        if (!exists) {
          const newConnections = [...connections, { from: linkingFromId, to: targetNode.id }];
          updateClient(client.id, { connections: newConnections });
        }
      }
      setIsDraggingConnection(false);
      setLinkingFromId(null);
      setConnectionDragStart(null);
      setConnectionDragCurrent(null);
    } else if (isDrawing && currentPath) {
      updateClient(client.id, {
        drawingPaths: [...drawingPaths, currentPath]
      });
      setCurrentPath(null);
      setIsDrawing(false);
    } else {
      setIsDrawing(false);
      setIsPanning(false);
      setActiveDragId(null);
    }
  };

  // Double click background to drop a note
  const handleDoubleClick = (e) => {
    if (e.target.closest('.canvas-card') || e.target.closest('.whiteboard-note') || e.target.closest('button') || e.target.closest('select')) {
      return;
    }
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - pan.x) / zoom;
    const cy = (e.clientY - rect.top - pan.y) / zoom;

    const newNote = {
      id: 'note_' + Date.now(),
      type: 'sticky',
      x: cx - 80,
      y: cy - 80,
      text: '',
      color: '#fef08a'
    };
    updateClient(client.id, {
      stickyNotes: [...stickyNotes, newNote]
    });
  };

  // Drag handles
  const startDrag = (e, id, currentX, currentY) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) {
      return;
    }
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    setDragOffset({
      x: mouseX - currentX,
      y: mouseY - currentY
    });
    setActiveDragId(id);
  };

  // Node timer controls
  const handleStartTimer = (e, video) => {
    e.stopPropagation();
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

  const handlePauseTimer = (e, video) => {
    e.stopPropagation();
    const vLastStartTime = video[keys.lastStartTime];
    const vTotalSeconds = video[keys.totalSeconds] || 0;
    const diff = vLastStartTime ? Math.floor((Date.now() - vLastStartTime) / 1000) : 0;
    updateVideo(video.id, {
      [keys.status]: 'paused',
      [keys.totalSeconds]: vTotalSeconds + diff,
      [keys.lastStartTime]: null,
      [keys.lastStopTime]: Date.now()
    });
  };

  const handleFinishTimer = (e, video) => {
    e.stopPropagation();
    const vLastStartTime = video[keys.lastStartTime];
    const vTotalSeconds = video[keys.totalSeconds] || 0;
    const vFinishedCount = video[keys.finishedCount] || 0;
    let extra = 0;
    if ((video[keys.status] || 'not_started') === 'started' && vLastStartTime) {
      extra = Math.floor((Date.now() - vLastStartTime) / 1000);
    }
    updateVideo(video.id, {
      [keys.status]: 'finished',
      [keys.totalSeconds]: vTotalSeconds + extra,
      [keys.lastStartTime]: null,
      [keys.finishedCount]: vFinishedCount + 1
    });
  };

  const handleResetTimer = (e, video) => {
    e.stopPropagation();
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

  const handleRemoveConnection = (index) => {
    const newConnections = connections.filter((_, i) => i !== index);
    updateClient(client.id, { connections: newConnections });
  };

  // Sticky Note handlers
  const handleUpdateNoteText = (id, text) => {
    const updated = stickyNotes.map(n =>
      n.id === id ? { ...n, text } : n
    );
    updateClient(client.id, { stickyNotes: updated });
  };

  const handleDeleteNote = (id) => {
    const updated = stickyNotes.filter(n => n.id !== id);
    const updatedConnections = connections.filter(c => c.from !== id && c.to !== id);
    updateClient(client.id, {
      stickyNotes: updated,
      connections: updatedConnections
    });
    if (linkingFromId === id) setLinkingFromId(null);
  };

  const handleClearDrawings = () => {
    if (window.confirm('Clear all drawing paths on this canvas?')) {
      updateClient(client.id, { drawingPaths: [] });
    }
  };

  // Render SVG curved connecting lines (Bezier S-curves)
  const connectionLines = useMemo(() => {
    return connections.map((conn, idx) => {
      const fromNode = allNodes.find(n => n.id === conn.from);
      const toNode = allNodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return null;

      const x1 = fromNode.x + fromNode.width / 2;
      const y1 = fromNode.y + fromNode.height / 2;
      const x2 = toNode.x + toNode.width / 2;
      const y2 = toNode.y + toNode.height / 2;

      // Calculate control points for an organic curved S-line
      const dx = Math.abs(x2 - x1) * 0.5;
      const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      return (
        <g key={idx}>
          <path
            d={pathData}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            strokeDasharray="5 5"
            opacity="0.85"
            style={{ transition: 'all 0.2s' }}
          />
          <foreignObject
            x={midX - 12}
            y={midY - 12}
            width="24"
            height="24"
            style={{ overflow: 'visible' }}
          >
            <button
              onClick={() => handleRemoveConnection(idx)}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--bg-panel)',
                border: '1.5px solid var(--border-color)',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: 0
              }}
              title="Remove connection link"
            >
              <Trash2 size={11} />
            </button>
          </foreignObject>
        </g>
      );
    });
  }, [connections, allNodes]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: 'calc(100vh - 120px)'
    }}>
      {/* ─── WHITEBOARD CONTROLS TOOLBAR ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '0.65rem 1.25rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        backdropFilter: 'blur(10px)',
        zIndex: 5
      }}>
        {/* Whiteboard selection tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTool === 'pan' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px' }}
            onClick={() => setActiveTool('pan')}
            title="Pan & Select Tool"
          >
            <MousePointer size={15} /> Select & Pan
          </button>
          <button
            className={`btn ${activeTool === 'pen' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px' }}
            onClick={() => setActiveTool('pen')}
            title="Draw Freehand Paths"
          >
            <PenTool size={15} /> Free Draw
          </button>
          <button
            className={`btn ${activeTool === 'sticky' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px' }}
            onClick={() => setActiveTool('sticky')}
            title="Add Yellow Sticky Note"
          >
            <StickyNote size={15} /> Sticky Note
          </button>
          <button
            className={`btn ${activeTool === 'text' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px' }}
            onClick={() => setActiveTool('text')}
            title="Add Label Text"
          >
            <Type size={15} /> Text Box
          </button>
        </div>

        {/* Dropdown to add existing projects & create new card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'create_new_card') {
                const newId = client.videos.length > 0 ? Math.max(...client.videos.map(v => v.id)) + 1 : 1;
                const newVideoObj = {
                  id: newId,
                  status: 'not_started',
                  totalSeconds: 0,
                  lastStartTime: null,
                  price: 150,
                  note: 'New Task Card',
                  sourceLink: '',
                  finalLink: '',
                  deadline: '',
                  checklist: [],
                  showOnCanvas: true,
                  videoLength: '',
                  canvasX: (200 - pan.x) / zoom,
                  canvasY: (200 - pan.y) / zoom
                };
                updateClient(client.id, { videos: [...client.videos, newVideoObj] });
              } else if (val) {
                updateVideo(parseInt(val), {
                  showOnCanvas: true,
                  canvasX: (200 - pan.x) / zoom,
                  canvasY: (200 - pan.y) / zoom
                });
              }
            }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 0.8rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            <option value="">+ Add to Canvas...</option>
            <option value="create_new_card" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              [+] Create Brand New Card
            </option>
            {client.videos
              .filter(v => !v.showOnCanvas)
              .map(v => (
                <option key={v.id} value={v.id}>
                  Add #{v.id} - {v.note || `Untitled Task`}
                </option>
              ))
            }
          </select>

          {activeTool === 'pen' && (
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color:</span>
              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#71717a'].map(color => (
                <button
                  key={color}
                  onClick={() => setPenColor(color)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: color,
                    border: penColor === color ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>
          )}

          {drawingPaths.length > 0 && (
            <button
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)', borderRadius: '10px' }}
              onClick={handleClearDrawings}
            >
              <Trash2 size={14} /> Clear Drawing
            </button>
          )}
        </div>
      </div>

      {/* ─── CANVAS BOARD AREA ─── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: activeTool === 'pen' ? 'crosshair' : isPanning ? 'grabbing' : 'grab',
          background: 'var(--bg-surface)',
          // Grid background lines that scale with zoom
          backgroundImage: `radial-gradient(var(--border-color) 1.5px, transparent 1.5px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          userSelect: 'none',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.015)'
        }}
      >
        {/* Dynamic Help Banner */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          padding: '0.55rem 1.1rem',
          borderRadius: '10px',
          fontSize: '0.8rem',
          zIndex: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 650
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
          {linkingFromId
            ? `Select another card/note to connect...`
            : activeTool === 'pen'
            ? 'Free Draw Mode: Click & drag to sketch.'
            : activeTool === 'sticky'
            ? 'Sticky Mode: Click to drop a Sticky Note.'
            : activeTool === 'text'
            ? 'Text Mode: Click to write label text.'
            : "Whiteboard Canvas: Double-click empty area to create notes."}
        </div>

        {/* Floating Zoom & Pan Reset controls (Bottom Right) */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.4rem',
          display: 'flex',
          gap: '0.35rem',
          zIndex: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          alignItems: 'center'
        }}>
          <button className="sidebar-footer-btn" onClick={handleZoomOut} style={{ padding: '0.4rem', width: '32px', height: '32px', justifyContent: 'center' }} title="Zoom Out" aria-label="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, minWidth: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="sidebar-footer-btn" onClick={handleZoomIn} style={{ padding: '0.4rem', width: '32px', height: '32px', justifyContent: 'center' }} title="Zoom In" aria-label="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button className="sidebar-footer-btn" onClick={handleResetPanZoom} style={{ padding: '0.4rem', width: '32px', height: '32px', justifyContent: 'center' }} title="Reset Pan & Zoom" aria-label="Reset Pan & Zoom">
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Viewport translation & zoom wrapper */}
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}>
          {/* SVG Canvas overlay for connection lines and drawing paths */}
          <svg style={{
            position: 'absolute',
            top: -10000,
            left: -10000,
            width: '20000px',
            height: '20000px',
            pointerEvents: 'auto'
          }}>
            <g transform="translate(10000, 10000)">
              {/* Completed freehand drawing paths */}
              {drawingPaths.map((path) => (
                <path
                  key={path.id}
                  d={`M ${path.points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`}
                  fill="none"
                  stroke={path.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Active drawing path preview */}
              {isDrawing && currentPath && (
                <path
                  d={`M ${currentPath.points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`}
                  fill="none"
                  stroke={currentPath.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Connection links lines */}
              {connectionLines}

              {/* Dynamic Dragging Line preview */}
              {isDraggingConnection && connectionDragStart && connectionDragCurrent && (
                <line
                  x1={connectionDragStart.x}
                  y1={connectionDragStart.y}
                  x2={connectionDragCurrent.x}
                  y2={connectionDragCurrent.y}
                  stroke="var(--accent-primary)"
                  strokeWidth="3.5"
                  strokeDasharray="5 5"
                  opacity="0.85"
                />
              )}
            </g>
          </svg>

          {/* Node Cards (Project items) */}
          {videos.map(v => {
            const isLinkingSource = linkingFromId === v.id;
            const vStatus = v[keys.status] || 'not_started';
            const isTimerActive = vStatus === 'started';

            return (
              <div
                key={v.id}
                className={`canvas-card ${isLinkingSource ? 'linking' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${v.canvasX}px`,
                  top: `${v.canvasY}px`,
                  width: '240px',
                  background: 'var(--bg-panel)',
                  border: isLinkingSource ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  pointerEvents: 'auto',
                  boxShadow: isTimerActive ? '0 12px 35px var(--accent-glow)' : '0 10px 25px rgba(0,0,0,0.03)',
                  transition: activeDragId === v.id ? 'none' : 'border-color 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  borderTop: isTimerActive ? '4.5px solid var(--accent-primary)' : ''
                }}
              >
                {/* Header / drag handle */}
                <div
                  onMouseDown={(e) => startDrag(e, v.id, v.canvasX, v.canvasY)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'move',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.5rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    <GripVertical size={14} style={{ cursor: 'grab' }} />
                    #{v.id}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div className={`status-badge ${vStatus}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      {t(config.statusKeys[vStatus] || 'status_not_started')}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateVideo(v.id, { showOnCanvas: false }); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove from Canvas"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>

                {/* Info parameters */}
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Price: ${v.price}</div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    marginTop: '0.25rem'
                  }}>
                    {v.note || "No notes added"}
                  </div>
                  {v.videoLength && (
                    <div style={{
                      color: '#8b5cf6',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      fontFamily: 'ui-monospace, monospace',
                      marginTop: '0.15rem'
                    }}>
                      ⏱ {v.videoLength}
                    </div>
                  )}
                </div>

                {/* Clock Output */}
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: isTimerActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  background: 'var(--bg-surface)',
                  padding: '0.45rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  {formatTime(
                    isTimerActive
                      ? (activeTimers[v.id] !== undefined ? activeTimers[v.id] : (v[keys.totalSeconds] || 0))
                      : (v[keys.totalSeconds] || 0)
                  )}
                </div>

                {/* Card Action Controls */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {isTimerActive ? (
                    <>
                      <button
                        className="btn btn-warning"
                        style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={(e) => handlePauseTimer(e, v)}
                        title="Stop tracking"
                      >
                        <Pause size={12} />
                      </button>
                      <button
                        className="btn btn-success"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={(e) => handleFinishTimer(e, v)}
                        title="Finish tracking"
                      >
                        <CheckCircle size={12} /> {t('finish')}
                      </button>
                    </>
                  ) : vStatus === 'finished' ? (
                    <>
                      <button
                        className="btn btn-warning"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', borderRadius: '8px' }}
                        onClick={(e) => { e.stopPropagation(); updateVideo(v.id, { [keys.status]: 'paused', [keys.lastStartTime]: null }); }}
                        title="Reopen timer"
                      >
                        <RefreshCcw size={12} /> Reopen
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={(e) => handleResetTimer(e, v)}
                        title="Reset timer"
                      >
                        <RefreshCcw size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={(e) => handleStartTimer(e, v)}
                        title="Start tracking"
                      >
                        <Play size={12} /> {t('start')}
                      </button>
                      {vStatus === 'paused' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                          onClick={(e) => handleResetTimer(e, v)}
                          title="Reset timer"
                        >
                          <RefreshCcw size={12} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Node connection button - click & drag link */}
                  <button
                    className={`btn ${isLinkingSource ? 'btn-danger' : 'btn-outline'}`}
                    style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'crosshair', borderRadius: '8px' }}
                    onMouseDown={(e) => handleStartConnectionDrag(e, v.id)}
                    title="Drag line to another node to connect"
                  >
                    <Link size={12} />
                  </button>

                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                    onClick={(e) => { e.stopPropagation(); onOpenFull(v.id); }}
                    title="Expand details overlay"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Sticky Notes & Text Boxes visual elements */}
          {stickyNotes.map(note => {
            const isLinkingSource = linkingFromId === note.id;
            const isTextType = note.type === 'text';

            return (
              <div
                key={note.id}
                style={{
                  position: 'absolute',
                  left: `${note.x}px`,
                  top: `${note.y}px`,
                  width: '160px',
                  height: '160px',
                  background: isTextType ? 'transparent' : note.color || '#fef08a',
                  border: isLinkingSource
                    ? '2.5px solid var(--accent-primary)'
                    : isTextType
                    ? '1.5px dashed var(--border-color)'
                    : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: isTextType ? '6px' : '12px',
                  padding: '0.75rem',
                  pointerEvents: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  boxShadow: isTextType ? 'none' : '0 10px 25px rgba(0,0,0,0.035)',
                  transition: activeDragId === note.id ? 'none' : 'border-color 0.2s',
                  // Visual skew for realism
                  transform: isTextType ? 'none' : 'rotate(-1deg)'
                }}
              >
                {/* Note Header / Drag Anchor */}
                <div
                  onMouseDown={(e) => startDrag(e, note.id, note.x, note.y)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'move',
                    opacity: 0.5,
                    borderBottom: isTextType ? 'none' : '1px solid rgba(0,0,0,0.08)',
                    paddingBottom: '0.25rem',
                    fontSize: '0.7rem'
                  }}
                >
                  <GripVertical size={12} />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onMouseDown={(e) => handleStartConnectionDrag(e, note.id)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'crosshair', padding: 0 }}
                      title="Drag connection line"
                    >
                      <Link size={11} style={{ color: isLinkingSource ? 'var(--accent-primary)' : 'inherit' }} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      title="Delete Note"
                    >
                      <X size={12} style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>

                {/* Textarea editor */}
                <textarea
                  value={note.text}
                  onChange={(e) => handleUpdateNoteText(note.id, e.target.value)}
                  placeholder={isTextType ? "Type text here..." : "Type notes here..."}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    resize: 'none',
                    outline: 'none',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    fontFamily: isTextType ? 'system-ui, sans-serif' : '"Kalam", cursive, sans-serif',
                    color: '#1f2937'
                  }}
                />
              </div>
            );
          })}
        </div>
        {videos.length === 0 && stickyNotes.length === 0 && drawingPaths.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            <Film size={48} style={{ opacity: 0.25, marginBottom: '1rem', color: 'var(--accent-primary)', marginLeft: 'auto', marginRight: 'auto' }} />
            <h4 style={{ margin: '0 0 0.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>Your Canvas is Empty</h4>
            <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.8 }}>
              Use the **+ Add to Canvas** dropdown menu in the toolbar to place task cards here, <br />
              or double-click the empty canvas to drop a Sticky Note!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
