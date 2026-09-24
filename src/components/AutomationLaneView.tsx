import React, { useRef, useState, useMemo, useCallback } from 'react';
import { 
  Volume2, 
  Filter, 
  Pencil, 
  Sparkles, 
  Trash2, 
  Power, 
  ChevronDown, 
  Check, 
  Activity,
  TrendingUp
} from 'lucide-react';
import { Track, AutomationParameter, AutomationPoint } from '../types/daw';
import { 
  AUTOMATION_CONFIGS, 
  normalizeValue, 
  denormalizeValue, 
  interpolateAutomationValue, 
  sortAndCleanPoints,
  generateAutomationPresetPoints 
} from '../utils/automation';

export interface AutomationHeaderProps {
  track: Track;
  currentBar: number;
  drawMode: 'pencil' | 'nodes';
  onSetDrawMode: (mode: 'pencil' | 'nodes') => void;
  onUpdateAutomationPoints: (trackId: string, param: AutomationParameter, points: AutomationPoint[]) => void;
  onToggleAutomationEnabled: (trackId: string, param: AutomationParameter, enabled: boolean) => void;
  onSelectParam: (trackId: string, param: AutomationParameter) => void;
}

export const AutomationLaneHeader: React.FC<AutomationHeaderProps> = ({
  track,
  currentBar,
  drawMode,
  onSetDrawMode,
  onUpdateAutomationPoints,
  onToggleAutomationEnabled,
  onSelectParam,
}) => {
  const activeParam: AutomationParameter = track.selectedAutomationParam || 'volume';
  const paramConfig = AUTOMATION_CONFIGS[activeParam];

  const activeLane = useMemo(() => {
    return track.automationLanes?.find((l) => l.param === activeParam) || {
      param: activeParam,
      enabled: true,
      points: [],
    };
  }, [track.automationLanes, activeParam]);

  const isEnabled = activeLane.enabled;
  const points = activeLane.points;

  const [showParamMenu, setShowParamMenu] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  // Live evaluated value at playhead
  const currentLiveValue = useMemo(() => {
    const fallback = activeParam === 'volume' ? track.volume : activeParam === 'pan' ? track.pan : 20000;
    return interpolateAutomationValue(activeParam, points, currentBar, fallback);
  }, [activeParam, points, currentBar, track.volume, track.pan]);

  const handleApplyPreset = (presetId: 'fade-in' | 'fade-out' | 'filter-sweep-up' | 'filter-sweep-down' | 'auto-pan' | 'sidechain-pump' | 'flat-reset') => {
    const totalBars = 32; // Default fallback; will cover full track
    const presetPoints = generateAutomationPresetPoints(activeParam, presetId, totalBars, 1, totalBars);
    onUpdateAutomationPoints(track.id, activeParam, presetPoints);
    setShowPresetsMenu(false);
  };

  const handleClearLane = () => {
    onUpdateAutomationPoints(track.id, activeParam, []);
    setShowPresetsMenu(false);
  };

  const getParamIcon = (param: AutomationParameter) => {
    switch (param) {
      case 'volume':
        return <Volume2 className="w-3.5 h-3.5 text-sky-400" />;
      case 'pan':
        return <Activity className="w-3.5 h-3.5 text-purple-400" />;
      case 'filterCutoff':
        return <Filter className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div 
      style={{ borderLeftColor: paramConfig.color }}
      className="h-[90px] w-[280px] shrink-0 border-l-4 bg-neutral-900 px-3 py-2 flex flex-col justify-between border-b border-neutral-800 z-10 shadow-sm"
    >
      {/* Top Row: Param Selector Dropdown & Enable/Bypass Power */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="relative flex-1">
          <button
            onClick={() => {
              setShowParamMenu(!showParamMenu);
              setShowPresetsMenu(false);
            }}
            style={{ borderColor: `${paramConfig.color}60` }}
            className="w-full flex items-center justify-between px-2 py-1 bg-neutral-800 hover:bg-neutral-750 border rounded text-[11px] font-semibold text-neutral-100 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              {getParamIcon(activeParam)}
              <span className="truncate">{paramConfig.name}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0 ml-1" />
          </button>

          {/* Parameter Picker Dropdown */}
          {showParamMenu && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              {(['volume', 'pan', 'filterCutoff'] as AutomationParameter[]).map((p) => {
                const cfg = AUTOMATION_CONFIGS[p];
                const isCur = p === activeParam;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      onSelectParam(track.id, p);
                      setShowParamMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-800 transition-colors ${
                      isCur ? 'text-white font-bold bg-neutral-800/60' : 'text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getParamIcon(p)}
                      <span>{cfg.name}</span>
                    </div>
                    {isCur && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Enable / Bypass Toggle */}
        <button
          onClick={() => onToggleAutomationEnabled(track.id, activeParam, !isEnabled)}
          title={isEnabled ? 'Automação Ativa (Clique para colocar em Bypass)' : 'Automação em Bypass (Clique para ativar)'}
          style={{
            backgroundColor: isEnabled ? `${paramConfig.color}25` : '#262626',
            color: isEnabled ? paramConfig.color : '#737373',
            borderColor: isEnabled ? `${paramConfig.color}60` : '#404040',
          }}
          className="w-6 h-6 flex items-center justify-center rounded border transition-all shadow-xs shrink-0"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Row: Pencil / Nodes Tool Selector & Preset Curves */}
      <div className="flex items-center justify-between pt-1 gap-1">
        <div className="flex items-center bg-neutral-950 p-0.5 rounded border border-neutral-800">
          <button
            onClick={() => onSetDrawMode('pencil')}
            title="Lápis: Desenhe curvas livres arrastando o mouse na pista de automação"
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
              drawMode === 'pencil'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Pencil className="w-3 h-3 text-amber-400" />
            <span>Lápis</span>
          </button>
          <button
            onClick={() => onSetDrawMode('nodes')}
            title="Nós: Clique para inserir pontos discretos e arraste para ajustar"
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
              drawMode === 'nodes'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>Nós</span>
          </button>
        </div>

        {/* Presets Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPresetsMenu(!showPresetsMenu);
              setShowParamMenu(false);
            }}
            title="Predefinições de Curva (Fade In, Sweep, Auto-Pan, Sidechain)"
            className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Curvas</span>
          </button>

          {/* Presets Dropdown Menu */}
          {showPresetsMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-neutral-900 border border-neutral-750 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                Predefinições
              </div>
              <button
                onClick={() => handleApplyPreset('fade-in')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
              >
                Fade In (Rampa de Entrada)
              </button>
              <button
                onClick={() => handleApplyPreset('fade-out')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
              >
                Fade Out (Rampa de Saída)
              </button>
              {activeParam === 'filterCutoff' && (
                <>
                  <button
                    onClick={() => handleApplyPreset('filter-sweep-up')}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
                  >
                    Sweep Up (20Hz → 20kHz)
                  </button>
                  <button
                    onClick={() => handleApplyPreset('filter-sweep-down')}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
                  >
                    Sweep Down (20kHz → 200Hz)
                  </button>
                </>
              )}
              {activeParam === 'pan' && (
                <button
                  onClick={() => handleApplyPreset('auto-pan')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
                >
                  Auto-Pan Stereo (Ping-Pong)
                </button>
              )}
              {activeParam === 'volume' && (
                <button
                  onClick={() => handleApplyPreset('sidechain-pump')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
                >
                  Sidechain Pump (4/4 Duck)
                </button>
              )}
              <button
                onClick={() => handleApplyPreset('flat-reset')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-300 transition-colors border-t border-neutral-800"
              >
                Linha Reta / Padrão
              </button>
              <button
                onClick={handleClearLane}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar Automação</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Live Automated Value Badge */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/80">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[10px] text-neutral-500 font-bold uppercase">{paramConfig.shortName}:</span>
          <span 
            style={{ color: paramConfig.color }}
            className="font-semibold bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-[10px]"
          >
            {paramConfig.formatValue(currentLiveValue)}
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">
          {points.length} {points.length === 1 ? 'nó' : 'nós'}
        </span>
      </div>
    </div>
  );
};

export interface AutomationCanvasProps {
  track: Track;
  totalBars: number;
  barWidthPx: number;
  currentBar: number;
  drawMode: 'pencil' | 'nodes';
  onUpdateAutomationPoints: (trackId: string, param: AutomationParameter, points: AutomationPoint[]) => void;
}

export const AutomationLaneCanvas: React.FC<AutomationCanvasProps> = ({
  track,
  totalBars,
  barWidthPx,
  currentBar,
  drawMode,
  onUpdateAutomationPoints,
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const activeParam: AutomationParameter = track.selectedAutomationParam || 'volume';
  const paramConfig = AUTOMATION_CONFIGS[activeParam];

  const activeLane = useMemo(() => {
    return track.automationLanes?.find((l) => l.param === activeParam) || {
      param: activeParam,
      enabled: true,
      points: [],
    };
  }, [track.automationLanes, activeParam]);

  const isEnabled = activeLane.enabled;
  const points = activeLane.points;

  const [isDrawing, setIsDrawing] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; bar: number; value: number } | null>(null);

  const drawingPointsRef = useRef<AutomationPoint[]>([]);

  const canvasHeight = 90;
  const paddingY = 10;
  const usableHeight = canvasHeight - paddingY * 2;
  const totalWidthPx = totalBars * barWidthPx;

  const barToX = useCallback((bar: number) => {
    return (bar - 1) * barWidthPx;
  }, [barWidthPx]);

  const xToBar = useCallback((x: number) => {
    const rawBar = 1 + x / barWidthPx;
    return Math.max(1, Math.min(totalBars, parseFloat(rawBar.toFixed(2))));
  }, [barWidthPx, totalBars]);

  const valueToY = useCallback((val: number) => {
    const norm = normalizeValue(activeParam, val);
    return paddingY + (1 - norm) * usableHeight;
  }, [activeParam, usableHeight, paddingY]);

  const yToValue = useCallback((y: number) => {
    const clampedY = Math.max(paddingY, Math.min(canvasHeight - paddingY, y));
    const norm = 1 - (clampedY - paddingY) / usableHeight;
    return denormalizeValue(activeParam, norm);
  }, [activeParam, usableHeight, paddingY, canvasHeight]);

  // Live evaluated value at playhead
  const currentLiveValue = useMemo(() => {
    const fallback = activeParam === 'volume' ? track.volume : activeParam === 'pan' ? track.pan : 20000;
    return interpolateAutomationValue(activeParam, points, currentBar, fallback);
  }, [activeParam, points, currentBar, track.volume, track.pan]);

  // SVG Paths
  const { pathString, areaPathString, sortedDisplayPoints } = useMemo(() => {
    const sorted = sortAndCleanPoints(points);

    if (sorted.length === 0) {
      const defVal = activeParam === 'volume' ? track.volume : activeParam === 'pan' ? track.pan : paramConfig.defaultValue;
      const y = valueToY(defVal);
      return {
        pathString: `M 0 ${y} L ${totalWidthPx} ${y}`,
        areaPathString: `M 0 ${y} L ${totalWidthPx} ${y} L ${totalWidthPx} ${canvasHeight} L 0 ${canvasHeight} Z`,
        sortedDisplayPoints: [],
      };
    }

    const segments: string[] = [];
    const firstPt = sorted[0];
    const lastPt = sorted[sorted.length - 1];

    const firstX = barToX(firstPt.bar);
    const firstY = valueToY(firstPt.value);
    segments.push(`M 0 ${firstY}`);
    if (firstX > 0) {
      segments.push(`L ${firstX} ${firstY}`);
    }

    for (let i = 0; i < sorted.length; i++) {
      const px = barToX(sorted[i].bar);
      const py = valueToY(sorted[i].value);
      segments.push(`L ${px} ${py}`);
    }

    const lastX = barToX(lastPt.bar);
    const lastY = valueToY(lastPt.value);
    if (lastX < totalWidthPx) {
      segments.push(`L ${totalWidthPx} ${lastY}`);
    }

    const strokePath = segments.join(' ');
    const fillPath = `${strokePath} L ${totalWidthPx} ${canvasHeight} L 0 ${canvasHeight} Z`;

    return {
      pathString: strokePath,
      areaPathString: fillPath,
      sortedDisplayPoints: sorted,
    };
  }, [points, activeParam, track.volume, track.pan, paramConfig.defaultValue, valueToY, barToX, totalWidthPx, canvasHeight]);

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isEnabled || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedBar = xToBar(mouseX);
    const clickedVal = yToValue(mouseY);

    if (drawMode === 'pencil') {
      setIsDrawing(true);
      const newPt: AutomationPoint = {
        id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bar: clickedBar,
        value: clickedVal,
      };

      const existing = points.filter((p) => Math.abs(p.bar - clickedBar) > 0.3);
      const updated = sortAndCleanPoints([...existing, newPt]);
      drawingPointsRef.current = updated;
      onUpdateAutomationPoints(track.id, activeParam, updated);
    } else {
      const newPt: AutomationPoint = {
        id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bar: clickedBar,
        value: clickedVal,
      };
      const updated = sortAndCleanPoints([...points, newPt]);
      onUpdateAutomationPoints(track.id, activeParam, updated);
      setDraggingPointId(newPt.id);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const bar = xToBar(mouseX);
    const val = yToValue(mouseY);

    setHoverCoords({ x: mouseX, y: mouseY, bar, value: val });

    // Smooth freehand pencil curve drawing
    if (isDrawing && drawMode === 'pencil' && isEnabled) {
      const lastPt = drawingPointsRef.current[drawingPointsRef.current.length - 1];
      if (!lastPt || Math.abs(lastPt.bar - bar) >= 0.12) {
        const newPt: AutomationPoint = {
          id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          bar,
          value: val,
        };
        const filtered = drawingPointsRef.current.filter((p) => Math.abs(p.bar - bar) > 0.2);
        const updated = sortAndCleanPoints([...filtered, newPt]);
        drawingPointsRef.current = updated;
        onUpdateAutomationPoints(track.id, activeParam, updated);
      }
    }

    // Node dragging
    if (draggingPointId && isEnabled) {
      const updated = points.map((p) => {
        if (p.id === draggingPointId) {
          return {
            ...p,
            bar,
            value: val,
          };
        }
        return p;
      });
      onUpdateAutomationPoints(track.id, activeParam, sortAndCleanPoints(updated));
    }
  };

  const handleSvgMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onUpdateAutomationPoints(track.id, activeParam, sortAndCleanPoints(drawingPointsRef.current));
    }
    if (draggingPointId) {
      setDraggingPointId(null);
    }
  };

  const handleSvgMouseLeave = () => {
    setHoverCoords(null);
    if (isDrawing) {
      setIsDrawing(false);
    }
    if (draggingPointId) {
      setDraggingPointId(null);
    }
  };

  const handleDeletePoint = (ptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = points.filter((p) => p.id !== ptId);
    onUpdateAutomationPoints(track.id, activeParam, updated);
  };

  return (
    <div
      style={{ width: `${totalWidthPx}px`, height: `${canvasHeight}px` }}
      className="relative bg-neutral-950 select-none overflow-hidden cursor-crosshair border-b border-neutral-800"
    >
      {/* Horizontal Reference Grid Lines (100%, 50%, 0%) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1.5 px-3 text-[9px] font-mono text-neutral-500 opacity-60">
        <div className="w-full flex items-center justify-between border-b border-neutral-850/80 pb-0.5">
          <span>{paramConfig.formatValue(paramConfig.max)}</span>
        </div>
        <div className="w-full flex items-center justify-between border-b border-dashed border-neutral-800/60 pb-0.5">
          <span>
            {activeParam === 'pan' ? 'Centro (C)' : activeParam === 'volume' ? '75%' : '1.0 kHz'}
          </span>
        </div>
        <div className="w-full flex items-center justify-between pt-0.5">
          <span>{paramConfig.formatValue(paramConfig.min)}</span>
        </div>
      </div>

      {/* Vertical Bar Dividing Lines */}
      {Array.from({ length: totalBars }).map((_, barIdx) => (
        <div
          key={barIdx}
          style={{ left: `${barIdx * barWidthPx}px` }}
          className="absolute top-0 bottom-0 border-l border-neutral-850/70 pointer-events-none"
        />
      ))}

      {/* SVG Interactive Drawing Canvas */}
      <svg
        ref={canvasRef}
        width={totalWidthPx}
        height={canvasHeight}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseLeave}
        className="absolute inset-0 z-10"
      >
        <defs>
          <linearGradient id={`canvas-grad-${track.id}-${activeParam}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={paramConfig.color} stopOpacity={isEnabled ? 0.3 : 0.06} />
            <stop offset="100%" stopColor={paramConfig.color} stopOpacity={0.0} />
          </linearGradient>

          <filter id={`canvas-glow-${track.id}-${activeParam}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={paramConfig.color} floodOpacity={isEnabled ? 0.6 : 0.1} />
          </filter>
        </defs>

        {/* Shaded Area Fill Under Curve */}
        <path
          d={areaPathString}
          fill={`url(#canvas-grad-${track.id}-${activeParam})`}
          className="transition-all duration-75"
        />

        {/* Automation Curve Stroke Line */}
        <path
          d={pathString}
          fill="none"
          stroke={isEnabled ? paramConfig.color : '#525252'}
          strokeWidth={isEnabled ? 2.5 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#canvas-glow-${track.id}-${activeParam})`}
          className="transition-all duration-75"
        />

        {/* Nodes / Automation Points */}
        {sortedDisplayPoints.map((pt) => {
          const cx = barToX(pt.bar);
          const cy = valueToY(pt.value);
          const isDragging = draggingPointId === pt.id;

          return (
            <g 
              key={pt.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingPointId(pt.id);
              }}
              onDoubleClick={(e) => handleDeletePoint(pt.id, e)}
              className="cursor-grab active:cursor-grabbing"
            >
              <circle
                cx={cx}
                cy={cy}
                r={12}
                fill="transparent"
                className="hover:stroke-white/30 hover:stroke-1"
              />
              <circle
                cx={cx}
                cy={cy}
                r={isDragging ? 6.5 : 5}
                fill={isDragging ? '#ffffff' : paramConfig.color}
                stroke="#171717"
                strokeWidth="2"
                className="transition-all duration-75 shadow-md"
              />
              <circle
                cx={cx}
                cy={cy}
                r={2}
                fill="#171717"
              />
            </g>
          );
        })}

        {/* Live Playhead Marker on Curve */}
        {isEnabled && (
          <g transform={`translate(${barToX(currentBar)}, ${valueToY(currentLiveValue)})`}>
            <circle
              r={7}
              fill="none"
              stroke={paramConfig.color}
              strokeWidth="1.5"
              className="animate-ping opacity-75"
            />
            <circle
              r={4.5}
              fill="#ffffff"
              stroke={paramConfig.color}
              strokeWidth="2"
            />
          </g>
        )}

        {/* Hover Crosshair */}
        {hoverCoords && isEnabled && (
          <g transform={`translate(${hoverCoords.x}, ${hoverCoords.y})`} className="pointer-events-none">
            <circle
              r={3.5}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </g>
        )}
      </svg>

      {/* Floating Tooltip with Bar & Value */}
      {hoverCoords && (
        <div
          style={{
            left: `${Math.min(hoverCoords.x + 12, totalWidthPx - 130)}px`,
            top: `${Math.max(4, Math.min(canvasHeight - 26, hoverCoords.y - 14))}px`,
          }}
          className="absolute pointer-events-none z-30 bg-neutral-900/95 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-neutral-200 shadow-xl flex items-center gap-1.5"
        >
          <span className="text-amber-400 font-semibold">C{hoverCoords.bar.toFixed(1)}</span>
          <span className="text-neutral-500">|</span>
          <span style={{ color: paramConfig.color }} className="font-bold">
            {paramConfig.formatValue(hoverCoords.value)}
          </span>
        </div>
      )}

      {/* Playhead Red Needle traversing the lane */}
      <div
        style={{ transform: `translateX(${barToX(currentBar)}px)` }}
        className="absolute top-0 bottom-0 w-px bg-rose-500 shadow-sm pointer-events-none z-20 transition-transform duration-75"
      />
    </div>
  );
};
