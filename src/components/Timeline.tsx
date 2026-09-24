import React, { useRef, useState, useEffect } from 'react';
import { 
  Mic, 
  Disc, 
  Activity, 
  Music, 
  Scissors, 
  Copy, 
  Trash2, 
  Plus, 
  Volume2,
  Guitar,
  Layers,
  TrendingUp
} from 'lucide-react';
import { SongProject, Track, AudioClip, AutomationParameter, AutomationPoint } from '../types/daw';
import { AutomationLaneHeader, AutomationLaneCanvas } from './AutomationLaneView';
import { AUTOMATION_CONFIGS } from '../utils/automation';

interface TimelineProps {
  project: SongProject;
  currentBar: number;
  meterLevels: { [trackId: string]: number; master: number };
  selectedTrackId: string | null;
  selectedClipId: string | null;
  onSelectTrack: (trackId: string) => void;
  onSelectClip: (clipId: string | null) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackPanChange: (trackId: string, pan: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onToggleRecordArm: (trackId: string) => void;
  onOpenEQ: (trackId: string) => void;
  onOpenFX: (trackId: string) => void;
  onOpenInstrument: (trackId: string) => void;
  onSeekToBar: (bar: number) => void;
  onSplitClipAtPlayhead: (trackId: string, clipId: string) => void;
  onDuplicateClip: (trackId: string, clipId: string) => void;
  onDeleteClip: (trackId: string, clipId: string) => void;
  onAddTrack: () => void;
  onSetLoopRange: (startBar: number, endBar: number) => void;
  // Automation Lane Callbacks
  onUpdateTrackAutomationPoints: (trackId: string, param: AutomationParameter, points: AutomationPoint[]) => void;
  onToggleTrackAutomationEnabled: (trackId: string, param: AutomationParameter, enabled: boolean) => void;
  onSelectTrackAutomationParam: (trackId: string, param: AutomationParameter) => void;
  onToggleTrackAutomationLane: (trackId: string) => void;
  onToggleAllAutomationLanes: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentBar,
  meterLevels,
  selectedTrackId,
  selectedClipId,
  onSelectTrack,
  onSelectClip,
  onTrackVolumeChange,
  onTrackPanChange,
  onToggleMute,
  onToggleSolo,
  onToggleRecordArm,
  onOpenEQ,
  onOpenFX,
  onOpenInstrument,
  onSeekToBar,
  onSplitClipAtPlayhead,
  onDuplicateClip,
  onDeleteClip,
  onAddTrack,
  onSetLoopRange,
  onUpdateTrackAutomationPoints,
  onToggleTrackAutomationEnabled,
  onSelectTrackAutomationParam,
  onToggleTrackAutomationLane,
  onToggleAllAutomationLanes,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const leftHeadersRef = useRef<HTMLDivElement>(null);
  const rightArrangementRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Global drawing tool for automation lanes: 'pencil' (freehand drawing) or 'nodes' (node manipulation)
  const [drawMode, setDrawMode] = useState<'pencil' | 'nodes'>('pencil');

  // Pixel scaling: 1 bar = 68px width
  const barWidthPx = 68;
  const totalWidthPx = project.totalBars * barWidthPx;

  // Sync vertical scrolling between track headers and timeline lanes
  const handleRightArrangementScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (leftHeadersRef.current) {
      leftHeadersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newBar = Math.max(1, Math.min(project.totalBars, 1 + clickX / barWidthPx));
    onSeekToBar(newBar);
    setIsScrubbing(true);
  };

  const handleRulerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrubbing || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newBar = Math.max(1, Math.min(project.totalBars, 1 + clickX / barWidthPx));
    onSeekToBar(newBar);
  };

  const handleRulerMouseUp = () => {
    setIsScrubbing(false);
  };

  const playheadPositionPx = (currentBar - 1) * barWidthPx;

  // Keyboard shortcut listener for 'A' key to toggle automation on selected track
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (selectedTrackId) {
          onToggleTrackAutomationLane(selectedTrackId);
        } else if (project.tracks.length > 0) {
          onToggleTrackAutomationLane(project.tracks[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrackId, project.tracks, onToggleTrackAutomationLane]);

  // Render instrument icon
  const getInstrumentIcon = (instrument: Track['instrument']) => {
    switch (instrument) {
      case 'vocals':
        return <Mic className="w-4 h-4 text-rose-400" />;
      case 'drums':
        return <Disc className="w-4 h-4 text-amber-400" />;
      case 'bass':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'guitar':
        return <Guitar className="w-4 h-4 text-emerald-400" />;
      case 'keys':
      case 'synth':
        return <Music className="w-4 h-4 text-blue-400" />;
      case 'strings':
      default:
        return <Layers className="w-4 h-4 text-pink-400" />;
    }
  };

  const allAutomationsVisible = project.tracks.every((t) => t.showAutomation);

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden select-none">
      {/* Arrangement Section Markers Strip (Intro, Verse, Chorus, etc.) */}
      <div className="flex items-center bg-neutral-900/95 border-b border-neutral-800 text-xs py-1 px-2 overflow-x-auto">
        <div className="w-[280px] shrink-0 flex items-center gap-1.5 text-neutral-400 font-medium px-2 text-[11px] uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Estrutura da Composição</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-max">
          {project.arrangementSections.map((section, idx) => {
            const widthPx = (section.endBar - section.startBar + 1) * barWidthPx;
            const isCurrent = currentBar >= section.startBar && currentBar <= section.endBar;

            return (
              <button
                key={idx}
                onClick={() => onSeekToBar(section.startBar)}
                style={{ width: `${widthPx - 6}px` }}
                className={`text-left px-2 py-0.5 rounded text-[11px] font-semibold truncate transition-all border ${
                  isCurrent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                    : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:text-white'
                }`}
                title={`Pular para ${section.name} (Compasso ${section.startBar})`}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Multitrack Workspace: Left Track Headers + Right Arrangement Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Track Headers and Expanded Automation Lane Headers */}
        <div 
          ref={leftHeadersRef}
          className="w-[280px] shrink-0 flex flex-col bg-neutral-900 border-r border-neutral-800 overflow-y-hidden z-10 shadow-lg"
        >
          {/* Top ruler filler to align with timeline ruler */}
          <div className="h-10 bg-neutral-900 px-3 flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Pistas ({project.tracks.length})
              </span>
              {/* Global Automation Mode Toggle Button */}
              <button
                onClick={onToggleAllAutomationLanes}
                title={allAutomationsVisible ? "Recolher Linhas de Automação de Todas as Pistas" : "Expandir Linhas de Automação em Todas as Pistas"}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                  allAutomationsVisible
                    ? 'bg-amber-400 text-neutral-950 ring-1 ring-amber-300 font-extrabold shadow-xs'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750 border border-neutral-700'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Automação</span>
              </button>
            </div>
            <button
              onClick={onAddTrack}
              title="Adicionar Nova Faixa de Instrumento"
              className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Track Headers and Automation Headers List */}
          <div className="flex flex-col divide-y divide-neutral-800/80">
            {project.tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const meterVal = meterLevels[track.id] || 0;
              const hasActiveAutomation = track.automationLanes?.some((l) => l.enabled && l.points.length > 0);
              const activeParam: AutomationParameter = track.selectedAutomationParam || 'volume';
              const paramCfg = AUTOMATION_CONFIGS[activeParam];

              return (
                <React.Fragment key={track.id}>
                  {/* Primary Track Control Header (h-24) */}
                  <div
                    onClick={() => onSelectTrack(track.id)}
                    style={{ borderLeftColor: track.color }}
                    className={`h-24 px-3 py-2 flex flex-col justify-between border-l-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-neutral-800/90' : 'hover:bg-neutral-850 bg-neutral-900/60'
                    }`}
                  >
                    {/* Row 1: Instrument Icon, Name & Action Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center bg-neutral-800 shrink-0 shadow-xs"
                          style={{ border: `1px solid ${track.color}40` }}
                        >
                          {getInstrumentIcon(track.instrument)}
                        </div>
                        <span className="text-xs font-semibold text-neutral-100 truncate" title={track.name}>
                          {track.name}
                        </span>
                        {/* Active Parameter Tag if automation has points */}
                        {hasActiveAutomation && (
                          <span 
                            style={{ color: paramCfg.color, borderColor: `${paramCfg.color}40` }}
                            className="px-1 py-0.2 rounded text-[9px] font-mono border bg-neutral-950/80 font-bold shrink-0"
                            title={`Automação ativa: ${paramCfg.name}`}
                          >
                            {paramCfg.shortName}
                          </span>
                        )}
                      </div>

                      {/* Automation, EQ, FX, Instrument Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Track Automation Toggle Button [A] */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTrackAutomationLane(track.id);
                          }}
                          title={track.showAutomation ? "Recolher Linha de Automação (Volume, Pan, Filtro Cutoff) [Atalho: A]" : "Expandir Linha de Automação (Volume, Pan, Filtro Cutoff) [Atalho: A]"}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors shadow-2xs ${
                            track.showAutomation
                              ? 'bg-amber-400 text-neutral-950 font-extrabold ring-1 ring-amber-300'
                              : hasActiveAutomation
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          A
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEQ(track.id);
                          }}
                          title="Abrir Equalizador Paramétrico da Faixa"
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            track.eq.enabled
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          EQ
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFX(track.id);
                          }}
                          title="Abrir Rack de Efeitos (Reverb, Delay, Distorção, Compressor)"
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            track.fx.reverb.enabled || track.fx.delay.enabled || track.fx.distortion.enabled
                              ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          FX
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInstrument(track.id);
                          }}
                          title="Tocar Teclado / Pads nesta Faixa"
                          className="p-1 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Music className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Mute, Solo, Record, Pan Knob */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        {/* Mute Button (GarageBand Blue M) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMute(track.id);
                          }}
                          title="Silenciar Faixa (Mute)"
                          className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors shadow-xs ${
                            track.muted
                              ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          M
                        </button>

                        {/* Solo Button (GarageBand Yellow S) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSolo(track.id);
                          }}
                          title="Solo da Faixa (Solo)"
                          className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors shadow-xs ${
                            track.solo
                              ? 'bg-amber-400 text-neutral-950 font-extrabold ring-1 ring-amber-300'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          S
                        </button>

                        {/* Record Arm Button (Red R) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleRecordArm(track.id);
                          }}
                          title="Armar Gravação"
                          className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors shadow-xs ${
                            track.recordArm
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          R
                        </button>
                      </div>

                      {/* Pan Slider / Knob */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-neutral-500 font-mono">PAN</span>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.05"
                          value={track.pan}
                          onChange={(e) => onTrackPanChange(track.id, parseFloat(e.target.value))}
                          className="w-14 h-1 bg-neutral-700 rounded appearance-none accent-amber-400 cursor-pointer"
                          title={`Pan: ${
                            track.pan === 0 ? 'Centro' : track.pan < 0 ? `${Math.round(Math.abs(track.pan) * 100)}% L` : `${Math.round(track.pan * 100)}% R`
                          }`}
                        />
                      </div>
                    </div>

                    {/* Row 3: Volume Fader + Real-time Peak LED Meter */}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Volume2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.01"
                        value={track.volume}
                        onChange={(e) => onTrackVolumeChange(track.id, parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-neutral-800 rounded appearance-none accent-neutral-300 hover:accent-amber-400 cursor-pointer"
                        title={`Volume da Faixa: ${Math.round(track.volume * 100)}%`}
                      />

                      {/* Mini LED Meter */}
                      <div className="w-10 h-2 bg-neutral-950 rounded-xs overflow-hidden flex border border-neutral-800">
                        <div
                          className={`h-full transition-all duration-75 ${
                            meterVal > 0.85 ? 'bg-rose-500' : meterVal > 0.6 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, meterVal * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Automation Sub-Lane Control Header (h-[90px]) */}
                  {track.showAutomation && (
                    <AutomationLaneHeader
                      track={track}
                      currentBar={currentBar}
                      drawMode={drawMode}
                      onSetDrawMode={setDrawMode}
                      onUpdateAutomationPoints={onUpdateTrackAutomationPoints}
                      onToggleAutomationEnabled={onToggleTrackAutomationEnabled}
                      onSelectParam={onSelectTrackAutomationParam}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right Area: Timeline Ruler + Audio Clips Lanes + Automation Drawing Lanes */}
        <div 
          ref={rightArrangementRef}
          onScroll={handleRightArrangementScroll}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative bg-neutral-950"
        >
          {/* Timeline Bar Ruler */}
          <div
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            onMouseMove={handleRulerMouseMove}
            onMouseUp={handleRulerMouseUp}
            style={{ width: `${totalWidthPx}px` }}
            className="h-10 bg-neutral-900 border-b border-neutral-800 relative cursor-pointer select-none shrink-0"
          >
            {/* GarageBand Yellow Cycle Loop Region Bar */}
            {project.loopEnabled && (
              <div
                style={{
                  left: `${(project.loopStartBar - 1) * barWidthPx}px`,
                  width: `${(project.loopEndBar - project.loopStartBar + 1) * barWidthPx}px`,
                }}
                className="absolute top-0 h-2 bg-amber-400/90 rounded-b shadow-sm z-20"
                title={`Região de Ciclo em Loop: Compassos ${project.loopStartBar} até ${project.loopEndBar}`}
              />
            )}

            {/* Bar Numbers and Ticks */}
            {Array.from({ length: project.totalBars }).map((_, barIdx) => {
              const barNum = barIdx + 1;
              const leftPx = barIdx * barWidthPx;

              return (
                <div
                  key={barNum}
                  style={{ left: `${leftPx}px`, width: `${barWidthPx}px` }}
                  className="absolute top-0 bottom-0 border-l border-neutral-700/60 flex flex-col justify-between px-1 py-1"
                >
                  <span className="text-[10px] font-mono text-neutral-400 font-semibold">{barNum}</span>
                  {/* Beat sub-ticks */}
                  <div className="flex justify-between w-full h-1.5 opacity-40">
                    <div className="w-px h-full bg-neutral-600" />
                    <div className="w-px h-full bg-neutral-600" />
                    <div className="w-px h-full bg-neutral-600" />
                  </div>
                </div>
              );
            })}

            {/* Red Playhead Line & Triangle in Ruler */}
            <div
              style={{ transform: `translateX(${playheadPositionPx}px)` }}
              className="absolute top-0 bottom-0 pointer-events-none z-30 transition-transform duration-75"
            >
              {/* Triangle Playhead Cap */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-500 -ml-[6px]" />
            </div>
          </div>

          {/* Track Lanes with Audio Waveform Clips and Automation Canvases */}
          <div style={{ width: `${totalWidthPx}px` }} className="flex-1 relative divide-y divide-neutral-850">
            {project.tracks.map((track) => {
              const isTrackSelected = selectedTrackId === track.id;

              return (
                <React.Fragment key={track.id}>
                  {/* Audio Clips Lane (h-24) */}
                  <div
                    onClick={() => onSelectTrack(track.id)}
                    className={`h-24 relative transition-colors ${
                      isTrackSelected ? 'bg-neutral-900/40' : 'bg-neutral-950/80 hover:bg-neutral-900/20'
                    }`}
                  >
                    {/* Vertical bar grid lines for reference */}
                    {Array.from({ length: project.totalBars }).map((_, barIdx) => (
                      <div
                        key={barIdx}
                        style={{ left: `${barIdx * barWidthPx}px` }}
                        className="absolute top-0 bottom-0 border-l border-neutral-850/60 pointer-events-none"
                      />
                    ))}

                    {/* Audio Clips */}
                    {track.clips.map((clip) => {
                      const clipLeftPx = (clip.startBar - 1) * barWidthPx;
                      const clipWidthPx = clip.durationBars * barWidthPx;
                      const isClipSelected = selectedClipId === clip.id;

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip.id);
                            onSelectTrack(track.id);
                          }}
                          style={{
                            left: `${clipLeftPx}px`,
                            width: `${clipWidthPx}px`,
                            backgroundColor: `${clip.color}25`,
                            borderColor: isClipSelected ? '#ffffff' : `${clip.color}90`,
                          }}
                          className={`absolute top-2 bottom-2 rounded-md border flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-md group ${
                            isClipSelected ? 'ring-2 ring-white/80 shadow-lg' : 'hover:border-white/60'
                          }`}
                        >
                          {/* Clip Header Label & Tools */}
                          <div
                            style={{ backgroundColor: `${clip.color}dd` }}
                            className="h-5 px-2 flex items-center justify-between text-[10px] font-semibold text-neutral-950 truncate"
                          >
                            <span className="truncate">{clip.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSplitClipAtPlayhead(track.id, clip.id);
                                }}
                                title="Cortar Clip no Cursor (Scissors / Cortar)"
                                className="p-0.5 hover:bg-black/20 rounded text-neutral-950"
                              >
                                <Scissors className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateClip(track.id, clip.id);
                                }}
                                title="Duplicar Clip"
                                className="p-0.5 hover:bg-black/20 rounded text-neutral-950"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteClip(track.id, clip.id);
                                }}
                                title="Excluir Clip"
                                className="p-0.5 hover:bg-black/20 rounded text-neutral-950"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Waveform Visualization Canvas */}
                          <div className="flex-1 flex items-center px-1.5 py-0.5 gap-[1px] overflow-hidden">
                            {clip.waveformPeaks.map((peak, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  height: `${Math.max(12, peak * 100)}%`,
                                  backgroundColor: clip.color,
                                }}
                                className="flex-1 min-w-[2px] rounded-full opacity-80"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded Automation Drawing Canvas Lane (h-[90px]) */}
                  {track.showAutomation && (
                    <AutomationLaneCanvas
                      track={track}
                      totalBars={project.totalBars}
                      barWidthPx={barWidthPx}
                      currentBar={currentBar}
                      drawMode={drawMode}
                      onUpdateAutomationPoints={onUpdateTrackAutomationPoints}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Global Playhead Red Needle traversing all tracks and lanes */}
            <div
              style={{ transform: `translateX(${playheadPositionPx}px)` }}
              className="absolute top-0 bottom-0 w-px bg-rose-500 shadow-sm pointer-events-none z-30 transition-transform duration-75"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
