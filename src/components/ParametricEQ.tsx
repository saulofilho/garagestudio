import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  X, 
  RotateCcw, 
  Power, 
  Sparkles, 
  Volume2,
  ChevronDown
} from 'lucide-react';
import { Track, EQBand, TrackEQ } from '../types/daw';
import { audioEngine } from '../audio/audioEngine';

interface ParametricEQProps {
  track: Track;
  tracks: Track[];
  onUpdateEQ: (trackId: string, newEQ: TrackEQ) => void;
  onSelectTrack: (trackId: string) => void;
  onClose: () => void;
}

export const ParametricEQ: React.FC<ParametricEQProps> = ({
  track,
  tracks,
  onUpdateEQ,
  onSelectTrack,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBandKey, setSelectedBandKey] = useState<keyof Omit<TrackEQ, 'enabled'>>('mid');
  const [isDraggingNode, setIsDraggingNode] = useState<keyof Omit<TrackEQ, 'enabled'> | null>(null);

  const bandsList: (keyof Omit<TrackEQ, 'enabled'>)[] = ['lowShelf', 'lowMid', 'mid', 'highMid', 'highShelf'];

  const bandColors: Record<keyof Omit<TrackEQ, 'enabled'>, string> = {
    lowShelf: '#ef4444',
    lowMid: '#f59e0b',
    mid: '#3b82f6',
    highMid: '#8b5cf6',
    highShelf: '#10b981',
  };

  // Convert Frequency (20Hz - 20000Hz) to Canvas X coordinate (Logarithmic)
  const freqToX = (freq: number, width: number) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const logVal = Math.log10(Math.max(20, Math.min(20000, freq)));
    return ((logVal - minLog) / (maxLog - minLog)) * width;
  };

  // Convert Canvas X coordinate to Frequency (Logarithmic)
  const xToFreq = (x: number, width: number) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const ratio = Math.max(0, Math.min(1, x / width));
    const logVal = minLog + ratio * (maxLog - minLog);
    return Math.round(Math.pow(10, logVal));
  };

  // Convert Gain (-15dB to +15dB) to Canvas Y coordinate
  const gainToY = (gain: number, height: number) => {
    const minGain = -15;
    const maxGain = 15;
    const normalized = (gain - minGain) / (maxGain - minGain);
    return height - normalized * height;
  };

  // Convert Canvas Y coordinate to Gain (-15dB to +15dB)
  const yToGain = (y: number, height: number) => {
    const minGain = -15;
    const maxGain = 15;
    const ratio = 1 - Math.max(0, Math.min(1, y / height));
    const gain = minGain + ratio * (maxGain - minGain);
    return Math.round(gain * 10) / 10;
  };

  // Draw EQ Transfer Curve and grid lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines (Frequencies & dB)
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;

    // Frequencies: 50, 100, 200, 500, 1k, 2k, 5k, 10k, 20k
    const gridFreqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.fillStyle = '#737373';
    ctx.font = '10px JetBrains Mono, monospace';

    gridFreqs.forEach((freq) => {
      const x = freqToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      ctx.fillText(label, x + 4, height - 6);
    });

    // Decibels: +12, +6, 0, -6, -12
    const gridDbs = [12, 6, 0, -6, -12];
    gridDbs.forEach((db) => {
      const y = gainToY(db, height);
      ctx.beginPath();
      if (db === 0) {
        ctx.strokeStyle = '#404040';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = '#1f1f1f';
        ctx.setLineDash([]);
      }
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, 6, y - 4);
    });

    // 2. Calculate and Draw Continuous Biquad Filter Frequency Response Curve
    const numPoints = 256;
    const freqs = new Float32Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      freqs[i] = xToFreq((i / (numPoints - 1)) * width, width);
    }

    const responseDb = audioEngine.getEQFrequencyResponse(track.eq, freqs);

    // Draw Fill Under Curve with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${track.color}40`);
    gradient.addColorStop(0.5, `${track.color}15`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const y = gainToY(responseDb[i], height);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Curve Outline
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const y = gainToY(responseDb[i], height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = track.eq.enabled ? '#38bdf8' : '#737373';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Draw Draggable Interactive Handles for each EQ Band
    bandsList.forEach((bandKey, idx) => {
      const band = track.eq[bandKey];
      const x = freqToX(band.frequency, width);
      const y = gainToY(track.eq.enabled && band.enabled ? band.gain : 0, height);

      const isSelected = selectedBandKey === bandKey;
      const color = bandColors[bandKey];

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = `${color}30`;
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = band.enabled ? color : '#525252';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Band number label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((idx + 1).toString(), x, y);
    });
  }, [track.eq, selectedBandKey, track.color]);

  // Handle Dragging Node Points on Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check hit test for each band node
    for (const bandKey of bandsList) {
      const band = track.eq[bandKey];
      const nodeX = freqToX(band.frequency, canvas.width);
      const nodeY = gainToY(band.gain, canvas.height);
      const dist = Math.hypot(clickX - nodeX, clickY - nodeY);

      if (dist <= 20) {
        setSelectedBandKey(bandKey);
        setIsDraggingNode(bandKey);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const newFreq = xToFreq(mouseX, canvas.width);
    const newGain = yToGain(mouseY, canvas.height);

    const currentBand = track.eq[isDraggingNode];
    const updatedEQ: TrackEQ = {
      ...track.eq,
      [isDraggingNode]: {
        ...currentBand,
        frequency: newFreq,
        gain: newGain,
      },
    };
    onUpdateEQ(track.id, updatedEQ);
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingNode(null);
  };

  // Preset curves
  const applyPreset = (presetName: string) => {
    let newEQ = { ...track.eq };
    switch (presetName) {
      case 'vocal':
        newEQ = {
          ...newEQ,
          lowShelf: { ...newEQ.lowShelf, frequency: 120, gain: -5, enabled: true },
          lowMid: { ...newEQ.lowMid, frequency: 320, gain: -2.5, q: 1.2, enabled: true },
          mid: { ...newEQ.mid, frequency: 1200, gain: 1.5, q: 1.0, enabled: true },
          highMid: { ...newEQ.highMid, frequency: 3800, gain: 3.5, q: 1.1, enabled: true },
          highShelf: { ...newEQ.highShelf, frequency: 11000, gain: 4.0, enabled: true },
        };
        break;
      case 'drum_punch':
        newEQ = {
          ...newEQ,
          lowShelf: { ...newEQ.lowShelf, frequency: 60, gain: 4.5, enabled: true },
          lowMid: { ...newEQ.lowMid, frequency: 380, gain: -3.5, q: 1.4, enabled: true },
          mid: { ...newEQ.mid, frequency: 1500, gain: 0, q: 1.0, enabled: false },
          highMid: { ...newEQ.highMid, frequency: 5000, gain: 3.2, q: 1.2, enabled: true },
          highShelf: { ...newEQ.highShelf, frequency: 10000, gain: 2.0, enabled: true },
        };
        break;
      case 'sub_bass':
        newEQ = {
          ...newEQ,
          lowShelf: { ...newEQ.lowShelf, frequency: 75, gain: 5.0, enabled: true },
          lowMid: { ...newEQ.lowMid, frequency: 220, gain: 1.5, q: 1.2, enabled: true },
          mid: { ...newEQ.mid, frequency: 800, gain: -2.0, q: 1.0, enabled: true },
          highMid: { ...newEQ.highMid, frequency: 3000, gain: -4.0, q: 1.1, enabled: true },
          highShelf: { ...newEQ.highShelf, frequency: 8000, gain: -6.0, enabled: true },
        };
        break;
      case 'flat':
      default:
        newEQ = {
          ...newEQ,
          lowShelf: { ...newEQ.lowShelf, gain: 0, enabled: true },
          lowMid: { ...newEQ.lowMid, gain: 0, enabled: true },
          mid: { ...newEQ.mid, gain: 0, enabled: true },
          highMid: { ...newEQ.highMid, gain: 0, enabled: true },
          highShelf: { ...newEQ.highShelf, gain: 0, enabled: true },
        };
        break;
    }
    onUpdateEQ(track.id, newEQ);
  };

  const activeBand = track.eq[selectedBandKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-4xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Equalizador Paramétrico de Estúdio
                <span className="text-xs font-normal text-neutral-400">· 5 Bandas</span>
              </h2>
            </div>

            {/* Track Switcher Dropdown */}
            <div className="relative ml-4">
              <select
                value={track.id}
                onChange={(e) => onSelectTrack(e.target.value)}
                className="bg-neutral-800 text-neutral-200 text-xs font-medium py-1 px-2.5 rounded border border-neutral-700 outline-none cursor-pointer hover:bg-neutral-750"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Pista: {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master EQ Power / Bypass Switch */}
            <button
              onClick={() => onUpdateEQ(track.id, { ...track.eq, enabled: !track.eq.enabled })}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-colors border ${
                track.eq.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{track.eq.enabled ? 'EQ ATIVO' : 'BYPASS'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Frequency Canvas Display */}
        <div className="p-5 bg-neutral-950 flex flex-col gap-3">
          <div className="relative w-full h-64 bg-neutral-900/90 rounded-lg border border-neutral-800 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={880}
              height={256}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full h-full cursor-crosshair"
            />
            {/* Helper label */}
            <div className="absolute top-2 right-3 text-[10px] text-neutral-500 font-mono">
              Arraste os nós numerados no gráfico para moldar frequências e ganho
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-400 font-medium">Predefinições de Equalização:</span>
              <button
                onClick={() => applyPreset('vocal')}
                className="px-2 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-750 transition-colors"
              >
                Voz Cristalina
              </button>
              <button
                onClick={() => applyPreset('drum_punch')}
                className="px-2 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-750 transition-colors"
              >
                Punch de Bateria
              </button>
              <button
                onClick={() => applyPreset('sub_bass')}
                className="px-2 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-750 transition-colors"
              >
                Graves & Sub
              </button>
              <button
                onClick={() => applyPreset('flat')}
                className="px-2 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-750 transition-colors"
              >
                Reset Flat
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Panel: 5 Band Selectors & Rotary Knob Sliders */}
        <div className="p-5 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-4">
          {/* Band Selector Tabs */}
          <div className="grid grid-cols-5 gap-2">
            {bandsList.map((key, idx) => {
              const band = track.eq[key];
              const isSelected = selectedBandKey === key;
              const color = bandColors[key];

              return (
                <button
                  key={key}
                  onClick={() => setSelectedBandKey(key)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-800 border-amber-400/60 shadow-sm'
                      : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      Banda {idx + 1}
                    </span>
                    <input
                      type="checkbox"
                      checked={band.enabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateEQ(track.id, {
                          ...track.eq,
                          [key]: { ...band, enabled: e.target.checked },
                        });
                      }}
                      className="accent-amber-400 cursor-pointer"
                      title="Ativar/Desativar esta banda"
                    />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-[11px] font-mono text-neutral-400">
                    <span>{band.frequency >= 1000 ? `${(band.frequency / 1000).toFixed(1)}kHz` : `${band.frequency}Hz`}</span>
                    <span className={band.gain > 0 ? 'text-emerald-400' : band.gain < 0 ? 'text-rose-400' : 'text-neutral-400'}>
                      {band.gain > 0 ? `+${band.gain}` : band.gain}dB
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Band Fine Controls */}
          {activeBand && (
            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 grid grid-cols-3 gap-6">
              {/* Frequency Control */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Frequência Central</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {activeBand.frequency} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="5"
                  value={activeBand.frequency}
                  onChange={(e) => {
                    onUpdateEQ(track.id, {
                      ...track.eq,
                      [selectedBandKey]: { ...activeBand, frequency: parseInt(e.target.value, 10) },
                    });
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Gain Control */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Ganho (Boost / Cut)</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {activeBand.gain > 0 ? `+${activeBand.gain}` : activeBand.gain} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.2"
                  value={activeBand.gain}
                  onChange={(e) => {
                    onUpdateEQ(track.id, {
                      ...track.eq,
                      [selectedBandKey]: { ...activeBand, gain: parseFloat(e.target.value) },
                    });
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Q / Resonance Factor */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Fator Q (Largura de Banda)</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    Q = {activeBand.q.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="8.0"
                  step="0.05"
                  value={activeBand.q}
                  onChange={(e) => {
                    onUpdateEQ(track.id, {
                      ...track.eq,
                      [selectedBandKey]: { ...activeBand, q: parseFloat(e.target.value) },
                    });
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
