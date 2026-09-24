import React, { useState, useEffect } from 'react';
import { X, Music, Disc, Sliders, Volume2, Sparkles } from 'lucide-react';
import { Track, SongProject } from '../types/daw';
import { audioEngine } from '../audio/audioEngine';

interface InstrumentModalProps {
  track: Track;
  project: SongProject;
  onClose: () => void;
  onAddNoteToTrack?: (note: any) => void;
}

export const InstrumentModal: React.FC<InstrumentModalProps> = ({
  track,
  project,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'drums'>('keyboard');
  const [octave, setOctave] = useState(4);
  const [synthCutoff, setSynthCutoff] = useState(2500);

  // Piano keys mapping (2 octaves)
  const whiteKeys = [
    { note: 'C', key: 'a' },
    { note: 'D', key: 's' },
    { note: 'E', key: 'd' },
    { note: 'F', key: 'f' },
    { note: 'G', key: 'g' },
    { note: 'A', key: 'h' },
    { note: 'B', key: 'j' },
    { note: 'C+', key: 'k' },
    { note: 'D+', key: 'l' },
    { note: 'E+', key: ';' },
  ];

  const blackKeys = [
    { note: 'C#', key: 'w', leftOffset: 28 },
    { note: 'D#', key: 'e', leftOffset: 72 },
    { note: 'F#', key: 't', leftOffset: 160 },
    { note: 'G#', key: 'y', leftOffset: 204 },
    { note: 'A#', key: 'u', leftOffset: 248 },
    { note: 'C#+', key: 'o', leftOffset: 336 },
    { note: 'D#+', key: 'p', leftOffset: 380 },
  ];

  // Frequency calculation
  const getNoteFreq = (noteName: string, baseOctave: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let cleanNote = noteName;
    let oct = baseOctave;
    if (noteName.includes('+')) {
      cleanNote = noteName.replace('+', '');
      oct += 1;
    }
    const semitone = notes.indexOf(cleanNote);
    const midi = (oct + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const handlePlayKey = (noteName: string) => {
    const freq = getNoteFreq(noteName, octave);
    audioEngine.playInteractiveNote(freq, track.instrument);
  };

  // Drum Pads Configuration
  const drumPads = [
    { id: 'kick', name: 'Kick Drum (Bumbo)', freq: 60, key: '1', color: '#f59e0b' },
    { id: 'snare', name: 'Snare (Caixa)', freq: 190, key: '2', color: '#ef4444' },
    { id: 'hihat_c', name: 'Hi-Hat Fechado', freq: 8000, key: '3', color: '#3b82f6' },
    { id: 'hihat_o', name: 'Hi-Hat Aberto', freq: 6500, key: '4', color: '#8b5cf6' },
    { id: 'clap', name: 'Hand Clap (Palma)', freq: 1200, key: '5', color: '#ec4899' },
    { id: 'tom_low', name: 'Tom Grave', freq: 110, key: '6', color: '#10b981' },
    { id: 'tom_high', name: 'Tom Agudo', freq: 160, key: '7', color: '#14b8a6' },
    { id: 'crash', name: 'Crash Cymbal (Prato)', freq: 9500, key: '8', color: '#eab308' },
  ];

  const handlePlayDrum = (freq: number) => {
    audioEngine.playInteractiveNote(freq, 'drums', 0.35);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const k = e.key.toLowerCase();
      // Piano key
      const wKey = whiteKeys.find((item) => item.key === k);
      if (wKey) {
        handlePlayKey(wKey.note);
        return;
      }
      const bKey = blackKeys.find((item) => item.key === k);
      if (bKey) {
        handlePlayKey(bKey.note);
        return;
      }
      // Drum pad
      const dPad = drumPads.find((pad) => pad.key === k);
      if (dPad) {
        handlePlayDrum(dPad.freq);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [octave, track.instrument]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-3xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Instrumento Virtual da Faixa: {track.name}
                <span className="text-xs font-normal text-neutral-400">· GarageBand Synth Engine</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveTab('keyboard')}
                className={`px-3 py-1 font-medium rounded transition-colors ${
                  activeTab === 'keyboard'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Teclado & Sintetizador
              </button>
              <button
                onClick={() => setActiveTab('drums')}
                className={`px-3 py-1 font-medium rounded transition-colors ${
                  activeTab === 'drums'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Pads de Bateria (MPC)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-neutral-950 flex flex-col gap-6">
          {activeTab === 'keyboard' ? (
            <div className="flex flex-col gap-5">
              {/* Keyboard Controls & Octave selector */}
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Oitava:</span>
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded p-0.5">
                    <button
                      onClick={() => setOctave((o) => Math.max(1, o - 1))}
                      className="px-2 py-0.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-amber-400 px-2">C{octave}</span>
                    <button
                      onClick={() => setOctave((o) => Math.min(6, o + 1))}
                      className="px-2 py-0.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-neutral-500 font-mono text-[11px]">
                  Pressione as teclas do seu teclado físico (A, S, D, F, G...) ou clique com o mouse
                </span>
              </div>

              {/* Realistic Piano Keyboard */}
              <div className="relative h-48 bg-neutral-900 rounded-xl p-3 border border-neutral-800 shadow-inner flex justify-center overflow-x-auto">
                <div className="relative flex">
                  {/* White Keys */}
                  {whiteKeys.map((k, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => handlePlayKey(k.note)}
                      className="w-11 h-40 bg-gradient-to-b from-neutral-100 to-neutral-200 hover:from-white hover:to-neutral-100 active:from-neutral-300 active:to-neutral-400 rounded-b-md border-r border-neutral-300 shadow-md flex flex-col justify-end items-center pb-2 text-neutral-900 text-xs font-bold transition-all"
                    >
                      <span className="text-[10px] text-neutral-500 uppercase">{k.key}</span>
                      <span>{k.note}</span>
                    </button>
                  ))}

                  {/* Black Keys */}
                  {blackKeys.map((k, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => handlePlayKey(k.note)}
                      style={{ left: `${k.leftOffset}px` }}
                      className="absolute top-0 w-7 h-24 bg-gradient-to-b from-neutral-900 to-neutral-950 hover:from-neutral-800 hover:to-neutral-900 active:from-neutral-700 rounded-b-md shadow-xl border-x border-b border-black flex flex-col justify-end items-center pb-2 text-neutral-100 text-[10px] font-bold z-10"
                    >
                      <span className="text-[9px] text-amber-400 uppercase">{k.key}</span>
                      <span>{k.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Drum Pads Beat Machine */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-neutral-400">
                  MPC Drum Machine: Pressione os números 1 a 8 ou clique nos pads
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {drumPads.map((pad) => (
                  <button
                    key={pad.id}
                    onMouseDown={() => handlePlayDrum(pad.freq)}
                    style={{ borderColor: `${pad.color}50` }}
                    className="h-28 bg-neutral-900 hover:bg-neutral-850 active:scale-95 rounded-xl border-2 flex flex-col justify-between p-3.5 transition-all shadow-lg text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-bold font-mono flex items-center justify-center border border-neutral-700">
                        {pad.key}
                      </span>
                      <Disc className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                    </div>

                    <div>
                      <span className="text-xs font-bold text-neutral-100 block">{pad.name}</span>
                      <span className="text-[10px] font-mono text-neutral-500">{pad.freq} Hz</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
