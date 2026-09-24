import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, CheckCircle, Sliders, Volume2, Radio } from 'lucide-react';
import { SongProject } from '../types/daw';

interface MixAdvisorModalProps {
  project: SongProject;
  onClose: () => void;
}

export const MixAdvisorModal: React.FC<MixAdvisorModalProps> = ({ project, onClose }) => {
  const [advice, setAdvice] = useState<string>(project.mixingAdvice || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    try {
      const activeTracks = project.tracks.map((t) => ({
        name: t.name,
        instrument: t.instrument,
        volume: t.volume,
        pan: t.pan,
        eqLowGain: t.eq.lowShelf.gain,
        eqHighGain: t.eq.highShelf.gain,
      }));

      const res = await fetch('/api/gemini/mix-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          genre: project.genre,
          bpm: project.bpm,
          activeTracks,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.advice) {
          setAdvice(data.advice);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!advice) {
      fetchAdvice();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Engenheiro de Som AI (Mix Advisor)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-neutral-950 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Análise técnica para <strong className="text-neutral-200">{project.title}</strong> ({project.genre})
            </span>
            <button
              onClick={fetchAdvice}
              disabled={isLoading}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Recalcular Análise</span>
            </button>
          </div>

          <div className="p-4 bg-neutral-900/90 rounded-xl border border-neutral-800 text-neutral-300 text-xs leading-relaxed space-y-3 shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-neutral-400 text-xs">
                  Avaliando mascaramento de frequências e imagem estéreo...
                </span>
              </div>
            ) : advice ? (
              <div className="whitespace-pre-line font-sans">{advice}</div>
            ) : (
              <div className="text-neutral-500 py-4 text-center">
                Clique em "Recalcular Análise" para obter dicas profissionais de mixagem.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
