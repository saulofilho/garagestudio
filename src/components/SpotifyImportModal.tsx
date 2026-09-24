import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Upload, 
  Radio, 
  Sparkles, 
  CheckCircle2, 
  Music, 
  ArrowRight,
  Disc,
  Layers,
  AlertCircle
} from 'lucide-react';
import { SongProject } from '../types/daw';
import { DEMO_PROJECTS, createDefaultEQ, createDefaultFX, generateWaveformPeaks } from '../data/defaultProjects';
import { audioEngine } from '../audio/audioEngine';

interface SpotifyImportModalProps {
  onLoadProject: (project: SongProject) => void;
  onClose: () => void;
}

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  onLoadProject,
  onClose,
}) => {
  const [tab, setTab] = useState<'spotify' | 'upload' | 'demos'>('spotify');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvedPreview, setResolvedPreview] = useState<any>(null);

  // Handle Spotify URL Resolution
  const handleResolveSpotify = async () => {
    if (!spotifyUrl.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setLoadingStep('Conectando à API do Spotify...');

    try {
      const res = await fetch('/api/spotify/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: spotifyUrl }),
      });

      if (!res.ok) {
        throw new Error('Não foi possível conectar ao Spotify');
      }

      setLoadingStep('Identificando instrumentos, andamento e tonalidade com Gemini AI...');
      const data = await res.json();

      setResolvedPreview(data);
      setLoadingStep('Preparando projeto multitrack estilo GarageBand...');

      // Build SongProject
      const analysis = data.stemAnalysis;
      const bpm = analysis?.bpm || 124;
      const totalBars = analysis?.barsCount || 32;

      // Stems
      const stems = analysis?.stems || [
        { id: 'vocals', name: 'Vocal Principal', instrument: 'vocals', color: '#ef4444' },
        { id: 'drums', name: 'Bateria & Percussão', instrument: 'drums', color: '#f59e0b' },
        { id: 'bass', name: 'Baixo & Sub', instrument: 'bass', color: '#8b5cf6' },
        { id: 'keys_synths', name: 'Teclados & Sintetizadores', instrument: 'keys', color: '#3b82f6' },
        { id: 'guitars', name: 'Guitarras & Harmonia', instrument: 'guitar', color: '#10b981' },
      ];

      const tracks = stems.map((s: any, idx: number) => ({
        id: s.id,
        name: s.name,
        instrument: s.instrument,
        color: s.color || '#3b82f6',
        volume: s.defaultVolume || 0.85,
        pan: s.panning || 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: createDefaultEQ(),
        fx: createDefaultFX(),
        clips: [
          {
            id: `clip-${s.id}-main`,
            trackId: s.id,
            startBar: 1,
            durationBars: totalBars,
            name: `${s.name} (Stem Extraída)`,
            color: s.color || '#3b82f6',
            waveformPeaks: generateWaveformPeaks(totalBars, idx + 1),
            pitchShift: 0,
          },
        ],
      }));

      const newProject: SongProject = {
        id: `spotify-${Date.now()}`,
        title: data.title || 'Música do Spotify',
        artist: data.artist || 'Artista do Spotify',
        spotifyUrl: data.providerUrl || spotifyUrl,
        thumbnailUrl: data.thumbnailUrl,
        previewAudioUrl: data.previewAudioUrl || '',
        audioMode: data.previewAudioUrl ? 'real' : 'synth',
        bpm,
        key: analysis?.key || 'C Menor',
        timeSignature: analysis?.timeSignature || '4/4',
        totalBars,
        loopStartBar: 1,
        loopEndBar: 16,
        loopEnabled: false,
        genre: analysis?.genre || 'Pop Contemporâneo',
        tracks,
        arrangementSections: analysis?.arrangementSections || [
          { name: 'Intro', startBar: 1, endBar: 4, activeStems: ['drums', 'bass'] },
          { name: 'Verso 1', startBar: 5, endBar: 12, activeStems: ['vocals', 'drums', 'bass'] },
          { name: 'Refrão', startBar: 13, endBar: 20, activeStems: ['vocals', 'drums', 'bass', 'keys_synths', 'guitars'] },
          { name: 'Ponte', startBar: 21, endBar: 28, activeStems: ['drums', 'bass', 'guitars'] },
          { name: 'Outro', startBar: 29, endBar: 32, activeStems: ['vocals', 'drums', 'bass'] },
        ],
        masterVolume: 0.9,
        masterPan: 0,
        mixingAdvice: analysis?.mixingAdvice || 'Equilibre a faixa de voz no centro com brilho nos agudos.',
      };

      let finalProject = newProject;
      if (data.previewAudioUrl) {
        setLoadingStep('Extraindo faixas de estúdio isoladas (Vocal, Bateria, Baixo, Guitarras, Sintetizadores)...');
        try {
          finalProject = await audioEngine.loadRealSongStems(newProject, data.previewAudioUrl);
        } catch (err) {
          console.warn('Real audio stem extraction fallback:', err);
        }
      }

      onLoadProject(finalProject);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar música. Verifique o link e tente novamente.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Handle local audio file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingStep('Decodificando arquivo de áudio e extraindo faixas por filtro de frequências...');
    try {
      const baseProject = DEMO_PROJECTS[0];
      const newProject = await audioEngine.processAudioFileIntoStems(file, baseProject);
      onLoadProject(newProject);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha ao processar arquivo de áudio. Certifique-se de que é um formato válido (MP3, WAV, etc.)');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                Importar Música & Gerar Stems do GarageBand
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-5 pt-2 text-xs">
          <button
            onClick={() => setTab('spotify')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              tab === 'spotify'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Link do Spotify
          </button>
          <button
            onClick={() => setTab('demos')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              tab === 'demos'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Músicas Prontas (Demos)
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              tab === 'upload'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Upload de Arquivo (MP3 / WAV)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-neutral-950 flex flex-col gap-5">
          {tab === 'spotify' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Cole o link de qualquer música do Spotify (ex:{' '}
                <code className="bg-neutral-900 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
                  https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b
                </code>
                ). O sistema decompõe a música em faixas separadas de instrumentos no padrão GarageBand com equalizadores e mixer configurados.
              </p>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://open.spotify.com/track/... ou spotify:track:..."
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResolveSpotify()}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-emerald-500/70 transition-colors"
                  />
                </div>
                <button
                  onClick={handleResolveSpotify}
                  disabled={isLoading || !spotifyUrl.trim()}
                  className="px-4 py-2.5 text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Separar Faixas</span>
                </button>
              </div>

              {/* Sample Spotify Quick Links */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-neutral-500">Exemplos rápidos:</span>
                <button
                  onClick={() => setSpotifyUrl('https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b')}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  The Weeknd (Blinding Lights)
                </button>
                <span className="text-neutral-600">·</span>
                <button
                  onClick={() => setSpotifyUrl('https://open.spotify.com/track/3NdDpSvN911NVWqzAC7RQT')}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  Tom Jobim (Garota de Ipanema)
                </button>
              </div>
            </div>
          )}

          {tab === 'demos' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-400">
                Selecione uma produção multitrack já isolada com todas as faixas (voz, bateria, baixo, sintetizadores) prontas para edição imediata:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {DEMO_PROJECTS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={async () => {
                      if (demo.previewAudioUrl && !demo.tracks.some((t) => t.audioBuffer)) {
                        setIsLoading(true);
                        setLoadingStep('Extraindo faixas de estúdio isoladas da demonstração...');
                        try {
                          const enriched = await audioEngine.loadRealSongStems(demo, demo.previewAudioUrl);
                          onLoadProject(enriched);
                          onClose();
                          return;
                        } catch (err) {
                          console.warn('Demo stem loading fallback:', err);
                        } finally {
                          setIsLoading(false);
                          setLoadingStep('');
                        }
                      }
                      onLoadProject(demo);
                      onClose();
                    }}
                    className="p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/50 rounded-xl transition-all text-left flex items-center gap-3.5 group shadow-sm"
                  >
                    {demo.thumbnailUrl ? (
                      <img
                        src={demo.thumbnailUrl}
                        alt={demo.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <Disc className="w-6 h-6 text-neutral-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-neutral-100 block truncate">
                        {demo.title}
                      </span>
                      <span className="text-[11px] text-neutral-400 block truncate">
                        {demo.artist}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                        {demo.tracks.length} Faixas Stems · {demo.bpm} BPM
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-neutral-400">
                Faça upload de qualquer arquivo de áudio (MP3, WAV, AAC, FLAC) do seu computador. O motor de áudio extrairá as faixas de frequências de bateria, baixo, voz e harmonia diretamente no navegador:
              </p>

              <label className="border-2 border-dashed border-neutral-800 hover:border-emerald-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-900/40 hover:bg-neutral-900/80">
                <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="text-xs font-bold text-neutral-200">
                  Clique ou arraste um arquivo de áudio aqui
                </span>
                <span className="text-[11px] text-neutral-500 mt-1">
                  Formatos aceitos: MP3, WAV, AAC, M4A, OGG
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-200">
                  Processando Stems e Formato GarageBand...
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">{loadingStep}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
