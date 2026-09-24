import React from 'react';
import { X, Sparkles, Sliders, Disc, Activity } from 'lucide-react';
import { Track, TrackFX } from '../types/daw';

interface FXRackProps {
  track: Track;
  tracks: Track[];
  onUpdateFX: (trackId: string, newFX: TrackFX) => void;
  onSelectTrack: (trackId: string) => void;
  onClose: () => void;
}

export const FXRack: React.FC<FXRackProps> = ({
  track,
  tracks,
  onUpdateFX,
  onSelectTrack,
  onClose,
}) => {
  const { fx } = track;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-4xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Rack de Efeitos & Processamento de Áudio
                <span className="text-xs font-normal text-neutral-400">· GarageBand Studio FX</span>
              </h2>
            </div>

            {/* Track Switcher */}
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

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Studio Rack Units Grid */}
        <div className="p-6 bg-neutral-950 grid grid-cols-2 gap-4">
          {/* Unit 1: Studio Reverb (Convolver / Plate) */}
          <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Reverb Espacial
              </span>
              <input
                type="checkbox"
                checked={fx.reverb.enabled}
                onChange={(e) =>
                  onUpdateFX(track.id, {
                    ...fx,
                    reverb: { ...fx.reverb, enabled: e.target.checked },
                  })
                }
                className="accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-3 py-3">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Mix Wet / Dry</span>
                  <span className="font-mono text-cyan-300">{Math.round(fx.reverb.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={fx.reverb.wet}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      reverb: { ...fx.reverb, wet: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Tempo de Decaimento (Decay)</span>
                  <span className="font-mono text-cyan-300">{fx.reverb.decay.toFixed(1)} s</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="5.0"
                  step="0.1"
                  value={fx.reverb.decay}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      reverb: { ...fx.reverb, decay: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Unit 2: Stereo Echo / Delay */}
          <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5" />
                Delay Estéreo / Eco
              </span>
              <input
                type="checkbox"
                checked={fx.delay.enabled}
                onChange={(e) =>
                  onUpdateFX(track.id, {
                    ...fx,
                    delay: { ...fx.delay, enabled: e.target.checked },
                  })
                }
                className="accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-3 py-3">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Mix Wet / Dry</span>
                  <span className="font-mono text-amber-300">{Math.round(fx.delay.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={fx.delay.wet}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      delay: { ...fx.delay, wet: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Feedback (Repetições)</span>
                  <span className="font-mono text-amber-300">{Math.round(fx.delay.feedback * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.85"
                  step="0.02"
                  value={fx.delay.feedback}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      delay: { ...fx.delay, feedback: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Unit 3: Analog Saturation / Distortion */}
          <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Overdrive & Distorção
              </span>
              <input
                type="checkbox"
                checked={fx.distortion.enabled}
                onChange={(e) =>
                  onUpdateFX(track.id, {
                    ...fx,
                    distortion: { ...fx.distortion, enabled: e.target.checked },
                  })
                }
                className="accent-rose-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-3 py-3">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Drive (Saturação Valvulada)</span>
                  <span className="font-mono text-rose-300">{fx.distortion.drive.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={fx.distortion.drive}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      distortion: { ...fx.distortion, drive: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-rose-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Mix</span>
                  <span className="font-mono text-rose-300">{Math.round(fx.distortion.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={fx.distortion.wet}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      distortion: { ...fx.distortion, wet: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-rose-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Unit 4: Dynamic Compressor */}
          <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Compressor Dinâmico
              </span>
              <input
                type="checkbox"
                checked={fx.compressor.enabled}
                onChange={(e) =>
                  onUpdateFX(track.id, {
                    ...fx,
                    compressor: { ...fx.compressor, enabled: e.target.checked },
                  })
                }
                className="accent-purple-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-3 py-3">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Threshold (Limiar)</span>
                  <span className="font-mono text-purple-300">{fx.compressor.threshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="0"
                  step="1"
                  value={fx.compressor.threshold}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      compressor: { ...fx.compressor, threshold: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-purple-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Ratio (Taxa de Compressão)</span>
                  <span className="font-mono text-purple-300">{fx.compressor.ratio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="12.0"
                  step="0.2"
                  value={fx.compressor.ratio}
                  onChange={(e) =>
                    onUpdateFX(track.id, {
                      ...fx,
                      compressor: { ...fx.compressor, ratio: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-neutral-800 rounded appearance-none accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
