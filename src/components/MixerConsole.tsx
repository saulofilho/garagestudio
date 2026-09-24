import React from 'react';
import { Volume2, Sliders, Mic, Disc, Activity, Guitar, Music, Layers, Radio } from 'lucide-react';
import { SongProject, Track } from '../types/daw';

interface MixerConsoleProps {
  project: SongProject;
  meterLevels: { [trackId: string]: number; master: number };
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackPanChange: (trackId: string, pan: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onOpenEQ: (trackId: string) => void;
  onOpenFX: (trackId: string) => void;
}

export const MixerConsole: React.FC<MixerConsoleProps> = ({
  project,
  meterLevels,
  onTrackVolumeChange,
  onTrackPanChange,
  onToggleMute,
  onToggleSolo,
  onMasterVolumeChange,
  onOpenEQ,
  onOpenFX,
}) => {
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

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 p-6 overflow-x-auto select-none">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            Mesa de Mixagem de Estúdio
            <span className="text-xs font-normal text-neutral-400">· Controle Total da Sonoridade</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Ajuste os canais individuais de cada stem, balanço estéreo (Pan), equalização e faders em dB.
          </p>
        </div>
      </div>

      {/* Channel Strips Row */}
      <div className="flex items-stretch gap-3 flex-1 min-w-max pb-4">
        {/* Track Channel Strips */}
        {project.tracks.map((track) => {
          const meterVal = meterLevels[track.id] || 0;
          const volDb =
            track.volume === 0
              ? '-∞'
              : `${(20 * Math.log10(track.volume)).toFixed(1)} dB`;

          return (
            <div
              key={track.id}
              className="w-40 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col justify-between p-3 shadow-lg shrink-0 relative overflow-hidden"
              style={{ borderTop: `4px solid ${track.color}` }}
            >
              {/* Top: Instrument & Name */}
              <div className="flex flex-col items-center gap-1 text-center border-b border-neutral-800 pb-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-750 shadow-inner">
                  {getInstrumentIcon(track.instrument)}
                </div>
                <span className="text-xs font-bold text-neutral-200 truncate w-full" title={track.name}>
                  {track.name}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  {track.instrument}
                </span>
              </div>

              {/* EQ & FX Quick Launchers */}
              <div className="flex items-center justify-center gap-2 py-2 border-b border-neutral-800/80">
                <button
                  onClick={() => onOpenEQ(track.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                    track.eq.enabled
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-xs'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  EQ PARAM
                </button>
                <button
                  onClick={() => onOpenFX(track.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                    track.fx.reverb.enabled || track.fx.delay.enabled || track.fx.distortion.enabled
                      ? 'bg-purple-400/20 text-purple-300 border-purple-400/40 shadow-xs'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  FX RACK
                </button>
              </div>

              {/* Pan Knob Slider */}
              <div className="flex flex-col items-center gap-1 py-2">
                <div className="flex justify-between w-full text-[10px] font-mono text-neutral-400 px-1">
                  <span>L</span>
                  <span className="font-semibold text-neutral-200">
                    {track.pan === 0 ? 'C' : track.pan < 0 ? `${Math.round(Math.abs(track.pan) * 100)}L` : `${Math.round(track.pan * 100)}R`}
                  </span>
                  <span>R</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={track.pan}
                  onChange={(e) => onTrackPanChange(track.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Mute & Solo Buttons */}
              <div className="flex items-center justify-center gap-2 py-2 border-y border-neutral-800/80">
                <button
                  onClick={() => onToggleMute(track.id)}
                  className={`w-7 h-7 rounded text-xs font-extrabold flex items-center justify-center transition-colors shadow-xs ${
                    track.muted
                      ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo(track.id)}
                  className={`w-7 h-7 rounded text-xs font-extrabold flex items-center justify-center transition-colors shadow-xs ${
                    track.solo
                      ? 'bg-amber-400 text-neutral-950 font-black ring-1 ring-amber-300'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  S
                </button>
              </div>

              {/* Fader & Stereo Peak LED Meter Area */}
              <div className="flex items-center justify-center gap-4 py-4 flex-1">
                {/* Vertical Long-Throw Fader */}
                <div className="flex flex-col items-center justify-between h-48 py-1">
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.01"
                    value={track.volume}
                    onChange={(e) => onTrackVolumeChange(track.id, parseFloat(e.target.value))}
                    className="h-44 w-2 bg-neutral-800 rounded appearance-none accent-neutral-200 hover:accent-amber-400 cursor-pointer -rotate-90 origin-center"
                    style={{ width: '176px' }}
                  />
                </div>

                {/* Dual Vertical Stereo Peak LED Meter */}
                <div className="w-5 h-44 bg-neutral-950 rounded border border-neutral-800 p-0.5 flex gap-0.5">
                  {/* Left channel meter */}
                  <div className="flex-1 bg-neutral-900 rounded-xs flex flex-col justify-end overflow-hidden">
                    <div
                      className={`w-full transition-all duration-75 ${
                        meterVal > 0.85 ? 'bg-rose-500' : meterVal > 0.6 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ height: `${Math.min(100, meterVal * 100)}%` }}
                    />
                  </div>
                  {/* Right channel meter */}
                  <div className="flex-1 bg-neutral-900 rounded-xs flex flex-col justify-end overflow-hidden">
                    <div
                      className={`w-full transition-all duration-75 ${
                        meterVal > 0.85 ? 'bg-rose-500' : meterVal > 0.6 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ height: `${Math.min(100, meterVal * 95)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Decibel Readout */}
              <div className="text-center bg-neutral-950 py-1.5 rounded font-mono text-[11px] text-amber-400 font-bold border border-neutral-800">
                {volDb}
              </div>
            </div>
          );
        })}

        {/* Master Bus Channel Strip */}
        <div className="w-44 bg-neutral-900 rounded-xl border-2 border-neutral-700 flex flex-col justify-between p-3 shadow-2xl shrink-0 relative overflow-hidden">
          <div className="flex flex-col items-center gap-1 text-center border-b border-neutral-800 pb-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-neutral-950 font-bold shadow-md">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold text-neutral-100 uppercase tracking-wider">
              MASTER MIX
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Saída Estéreo</span>
          </div>

          <div className="py-2 border-b border-neutral-800 text-center">
            <span className="text-[10px] text-neutral-400 font-mono">LIMITADOR ANALÓGICO ATIVO</span>
          </div>

          {/* Master Fader & Meter */}
          <div className="flex items-center justify-center gap-4 py-4 flex-1">
            <div className="flex flex-col items-center justify-between h-48 py-1">
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={project.masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                className="h-44 w-2 bg-neutral-800 rounded appearance-none accent-amber-500 cursor-pointer -rotate-90 origin-center"
                style={{ width: '176px' }}
              />
            </div>

            {/* Master Stereo VU Meters */}
            <div className="w-6 h-44 bg-neutral-950 rounded border border-neutral-800 p-0.5 flex gap-1">
              <div className="flex-1 bg-neutral-900 rounded-xs flex flex-col justify-end overflow-hidden">
                <div
                  className={`w-full transition-all duration-75 ${
                    meterLevels.master > 0.85 ? 'bg-rose-500' : meterLevels.master > 0.65 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ height: `${Math.min(100, meterLevels.master * 100)}%` }}
                />
              </div>
              <div className="flex-1 bg-neutral-900 rounded-xs flex flex-col justify-end overflow-hidden">
                <div
                  className={`w-full transition-all duration-75 ${
                    meterLevels.master > 0.85 ? 'bg-rose-500' : meterLevels.master > 0.65 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ height: `${Math.min(100, meterLevels.master * 97)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Master dB Readout */}
          <div className="text-center bg-neutral-950 py-1.5 rounded font-mono text-[11px] text-amber-300 font-bold border border-neutral-800">
            {project.masterVolume === 0
              ? '-∞'
              : `${(20 * Math.log10(project.masterVolume)).toFixed(1)} dB`}
          </div>
        </div>
      </div>
    </div>
  );
};
