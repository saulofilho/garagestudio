import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Repeat, 
  Volume2, 
  Sliders, 
  Music, 
  Download, 
  Sparkles, 
  Plus, 
  Clock,
  Radio,
  Disc
} from 'lucide-react';
import { SongProject } from '../types/daw';

interface HeaderProps {
  project: SongProject;
  isPlaying: boolean;
  currentBar: number;
  timeSeconds: number;
  masterMeter: number;
  metronomeOn: boolean;
  activeView: 'timeline' | 'mixer';
  onPlayPause: () => void;
  onStop: () => void;
  onRewind: () => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onMasterVolumeChange: (vol: number) => void;
  onBpmChange: (bpm: number) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenMixAdvisor: () => void;
  onToggleView: (view: 'timeline' | 'mixer') => void;
  onOpenInstruments: () => void;
  onToggleAudioMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  isPlaying,
  currentBar,
  timeSeconds,
  masterMeter,
  metronomeOn,
  activeView,
  onPlayPause,
  onStop,
  onRewind,
  onToggleLoop,
  onToggleMetronome,
  onMasterVolumeChange,
  onBpmChange,
  onOpenImport,
  onOpenExport,
  onOpenMixAdvisor,
  onToggleView,
  onOpenInstruments,
  onToggleAudioMode,
}) => {
  const [editingBpm, setEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState(project.bpm.toString());

  // Tap Tempo state & interval tracking
  const tapHistoryRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapFeedback, setTapFeedback] = useState<{ count: number; bpm: number | null; active: boolean }>({
    count: 0,
    bpm: null,
    active: false,
  });
  const [tapPulsing, setTapPulsing] = useState(false);

  // Sync input text when project BPM changes externally
  useEffect(() => {
    if (!editingBpm) {
      setBpmInput(project.bpm.toString());
    }
  }, [project.bpm, editingBpm]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      tapHistoryRef.current = [];
      setTapFeedback({ count: 0, bpm: null, active: false });
    }, 2200);
  }, []);

  // Calculate average BPM from tap intervals
  const handleTapTempo = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = performance.now();
    const history = tapHistoryRef.current;

    // Trigger visual pulse
    setTapPulsing(true);
    setTimeout(() => setTapPulsing(false), 120);

    // If gap from last tap > 2.2s, treat as a fresh tap sequence
    if (history.length > 0) {
      const lastTap = history[history.length - 1];
      const delta = now - lastTap;
      if (delta > 2200) {
        tapHistoryRef.current = [now];
        setTapFeedback({ count: 1, bpm: null, active: true });
        scheduleReset();
        return;
      }
      // Debounce accidental double clicks (< 120ms)
      if (delta < 120) {
        return;
      }
    }

    const newHistory = [...history, now];
    // Keep up to 8 taps (7 intervals) for an accurate, smooth moving average
    if (newHistory.length > 8) {
      newHistory.shift();
    }
    tapHistoryRef.current = newHistory;

    const count = newHistory.length;

    if (count >= 2) {
      // Calculate intervals between consecutive taps
      const intervals: number[] = [];
      for (let i = 1; i < newHistory.length; i++) {
        intervals.push(newHistory[i] - newHistory[i - 1]);
      }

      // Average interval in milliseconds
      const avgIntervalMs = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

      // 60,000 ms / avgIntervalMs = BPM
      const calculatedBpm = Math.round(60000 / avgIntervalMs);
      const clampedBpm = Math.max(40, Math.min(260, calculatedBpm));

      setBpmInput(clampedBpm.toString());
      onBpmChange(clampedBpm);
      setTapFeedback({ count, bpm: clampedBpm, active: true });
    } else {
      setTapFeedback({ count: 1, bpm: null, active: true });
    }

    scheduleReset();
  }, [onBpmChange, scheduleReset]);

  // Format timecode: Bar : Beat : Tick
  const barNumber = Math.floor(currentBar);
  const beatFraction = (currentBar - barNumber) * 4;
  const beatNumber = Math.floor(beatFraction) + 1;
  const tickNumber = Math.floor((beatFraction - Math.floor(beatFraction)) * 240);

  const formattedBars = `${barNumber.toString().padStart(3, '0')} : ${beatNumber.toString().padStart(2, '0')} : ${tickNumber.toString().padStart(3, '0')}`;

  // Format MM:SS.ms
  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const millis = Math.floor((timeSeconds % 1) * 100);
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;

  const handleBpmSubmit = () => {
    const val = parseInt(bpmInput, 10);
    if (!isNaN(val) && val >= 40 && val <= 260) {
      onBpmChange(val);
    } else {
      setBpmInput(project.bpm.toString());
    }
    setEditingBpm(false);
  };

  return (
    <header className="flex flex-col bg-neutral-900 border-b border-neutral-800 select-none shrink-0 shadow-md">
      {/* Top Bar Contract: 3 zones */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/80">
        {/* Zone 1: Single text element brand wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-sm">
            <Radio className="w-4 h-4 text-neutral-950 font-bold" />
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-100 font-sans flex items-center gap-1.5">
            GarageStudio
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Motor de Áudio Ativo" />
          </span>
          <div className="hidden lg:flex items-center gap-2 ml-3 text-xs text-neutral-400 border-l border-neutral-800 pl-3">
            <span className="text-neutral-200 font-medium truncate max-w-[200px]">{project.title}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[150px]">{project.artist}</span>
            <span aria-hidden="true">·</span>
            <span>{project.genre}</span>
          </div>

          {/* Real Audio Stems vs Physical Modeling Synth mode indicator & toggle */}
          {project.tracks.some((t) => t.audioBuffer) && onToggleAudioMode && (
            <button
              onClick={onToggleAudioMode}
              title="Clique para alternar entre o Áudio Real de Estúdio e o Sintetizador Físico"
              className={`ml-2 px-2.5 py-1 text-[11px] font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                project.audioMode === 'synth'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25 shadow-xs'
              }`}
            >
              <Disc className="w-3.5 h-3.5 animate-spin text-emerald-400" style={{ animationDuration: '6s' }} />
              <span>
                {project.audioMode === 'synth' ? 'Sintetizador Físico' : 'Áudio Real (Stems Isoladas)'}
              </span>
            </button>
          )}
        </div>

        {/* Zone 2: Navigation views */}
        <nav className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => onToggleView('timeline')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeView === 'timeline'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pistas & Arranjo
          </button>
          <button
            onClick={() => onToggleView('mixer')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeView === 'mixer'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Mesa de Mixagem
          </button>
          <button
            onClick={onOpenInstruments}
            className="px-3 py-1 text-xs font-medium rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
          >
            <Music className="w-3 h-3 text-amber-400" />
            <span>Teclado & Bateria</span>
          </button>
          <button
            onClick={onOpenMixAdvisor}
            className="px-3 py-1 text-xs font-medium rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Dicas AI</span>
          </button>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Importar Spotify</span>
          </button>
          <button
            onClick={onOpenExport}
            className="px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1.5 border border-neutral-700/60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Stems</span>
          </button>
        </div>
      </div>

      {/* Transport Bar (GarageBand classic LCD center console & transport controls) */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-950/60 text-xs">
        {/* Left: Transport Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRewind}
            title="Voltar ao Início (Enter)"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onStop}
            title="Parar"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={onPlayPause}
            title={isPlaying ? 'Pausar (Espaço)' : 'Tocar (Espaço)'}
            className={`p-2 rounded-full transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 ring-2 ring-amber-500/30'
                : 'bg-neutral-100 text-neutral-950 hover:bg-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={onToggleLoop}
            title="Loop do Ciclo (C)"
            className={`p-1.5 rounded transition-colors ml-1 ${
              project.loopEnabled
                ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMetronome}
            title="Metrônomo (K)"
            className={`px-2 py-1 text-xs font-mono font-bold rounded transition-colors ${
              metronomeOn
                ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            CLIK
          </button>
          <button
            onClick={handleTapTempo}
            title="Tap Tempo: Clique seguidamente no ritmo da música para calcular o BPM médio"
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer select-none flex items-center gap-1 active:scale-95 ${
              tapFeedback.active
                ? tapPulsing
                  ? 'bg-amber-400 text-neutral-950 ring-2 ring-amber-300 shadow-md font-extrabold scale-105'
                  : 'text-amber-400 bg-amber-400/20 border border-amber-400/50 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-700/60'
            }`}
          >
            <span>TAP</span>
            {tapFeedback.count > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-900/90 text-amber-300 border border-amber-500/30">
                {tapFeedback.count}
              </span>
            )}
          </button>
        </div>

        {/* Center: Skeuomorphic LCD Display (GarageBand Signature Screen) */}
        <div className="flex items-center gap-4 px-4 py-1.5 bg-neutral-900/90 rounded-lg border border-neutral-700/60 shadow-inner font-mono text-neutral-100">
          {/* Bars / Beats / Ticks */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-neutral-500 font-sans tracking-wider">Compasso</span>
            <span className="text-sm font-bold tracking-wider text-amber-400 tabular-nums">
              {formattedBars}
            </span>
          </div>

          <div className="h-6 w-px bg-neutral-800" />

          {/* Timecode MM:SS.MS */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-neutral-500 font-sans tracking-wider">Tempo</span>
            <span className="text-sm font-semibold text-neutral-200 tabular-nums">
              {formattedTime}
            </span>
          </div>

          <div className="h-6 w-px bg-neutral-800" />

          {/* Tempo BPM (Editable) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] uppercase text-neutral-500 font-sans tracking-wider">
              <span>Andamento</span>
              {tapFeedback.active && tapFeedback.bpm && (
                <span className="text-[9px] text-amber-400 font-mono font-semibold animate-pulse">
                  TAP {tapFeedback.bpm}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {editingBpm ? (
                <input
                  type="number"
                  min="40"
                  max="260"
                  value={bpmInput}
                  autoFocus
                  onChange={(e) => setBpmInput(e.target.value)}
                  onBlur={handleBpmSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleBpmSubmit()}
                  className="w-14 text-center bg-neutral-950 text-amber-300 font-bold border border-amber-500/50 rounded text-xs py-0.5 outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingBpm(true)}
                  title="Clique para digitar o BPM"
                  className="text-sm font-bold text-amber-300 hover:text-amber-200 cursor-pointer tabular-nums flex items-center gap-0.5"
                >
                  <span>{project.bpm}</span>
                  <span className="text-[10px] text-neutral-400 font-sans">BPM</span>
                </button>
              )}
              <button
                onClick={handleTapTempo}
                title="Tap Tempo: Clique no ritmo para calcular o BPM médio"
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer select-none active:scale-90 ${
                  tapPulsing
                    ? 'bg-amber-400 text-neutral-950 font-black'
                    : tapFeedback.active
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-neutral-700/50'
                }`}
              >
                {tapFeedback.count > 1 ? `TAP ${tapFeedback.count}` : 'TAP'}
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-800" />

          {/* Key / Tom */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-neutral-500 font-sans tracking-wider">Tonalidade</span>
            <span className="text-xs font-semibold text-neutral-300">
              {project.key}
            </span>
          </div>

          <div className="h-6 w-px bg-neutral-800" />

          {/* Time Signature */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-neutral-500 font-sans tracking-wider">Fórmula</span>
            <span className="text-xs font-semibold text-neutral-300">
              {project.timeSignature}
            </span>
          </div>
        </div>

        {/* Right: Master Output Volume & Peak LED Meter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-neutral-400" />
            <div className="flex flex-col gap-1 w-24">
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={project.masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                title={`Volume Master: ${Math.round(project.masterVolume * 100)}%`}
              />
            </div>
          </div>

          {/* Stereo Master Meter Bar */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded border border-neutral-800">
            <div className="flex flex-col gap-0.5 w-12">
              <div className="h-1.5 w-full bg-neutral-950 rounded-xs overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    masterMeter > 0.85
                      ? 'bg-rose-500'
                      : masterMeter > 0.65
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, masterMeter * 100)}%` }}
                />
              </div>
              <div className="h-1.5 w-full bg-neutral-950 rounded-xs overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    masterMeter > 0.85
                      ? 'bg-rose-500'
                      : masterMeter > 0.65
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, masterMeter * 95)}%` }}
                />
              </div>
            </div>
            {/* Clip LED indicator */}
            <div
              className={`w-2 h-3.5 rounded-xs transition-colors ${
                masterMeter > 0.92 ? 'bg-rose-600 shadow-sm shadow-rose-500' : 'bg-neutral-800'
              }`}
              title="Indicador de Pico / Clip Master"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
