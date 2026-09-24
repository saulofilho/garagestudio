import React, { useState } from 'react';
import { X, Download, FileAudio, Layers, CheckCircle2, Music } from 'lucide-react';
import { SongProject } from '../types/daw';
import { audioEngine } from '../audio/audioEngine';

interface ExportModalProps {
  project: SongProject;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Export Master WAV
  const handleExportMasterWav = async () => {
    setIsExporting(true);
    setExportStatus('Renderizando mixagem master em áudio WAV 44.1kHz...');
    setSuccessMsg('');

    try {
      const blob = await audioEngine.exportToWav(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}_MasterMix.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg('Mix Master exportada com sucesso em alta definição (WAV)!');
    } catch (err) {
      console.error(err);
      setSuccessMsg('Erro ao renderizar áudio.');
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  // Export Individual Track Stem
  const handleExportStem = async (trackId: string, trackName: string) => {
    setIsExporting(true);
    setExportStatus(`Renderizando faixa isolada: ${trackName}...`);
    setSuccessMsg('');

    try {
      const blob = await audioEngine.exportToWav(project, trackId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}_Stem_${trackName.replace(/\s+/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg(`Faixa "${trackName}" exportada com sucesso!`);
    } catch (err) {
      console.error(err);
      setSuccessMsg('Erro ao renderizar stem.');
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  // Export GarageBand Project Structure JSON
  const handleExportProjectJSON = () => {
    const projectData = {
      garageBandProjectFormat: '2.0',
      application: 'GarageStudio Web DAW',
      exportedAt: new Date().toISOString(),
      project: {
        title: project.title,
        artist: project.artist,
        bpm: project.bpm,
        key: project.key,
        timeSignature: project.timeSignature,
        totalBars: project.totalBars,
        tracks: project.tracks.map((t) => ({
          name: t.name,
          instrument: t.instrument,
          volumeDb: t.volume > 0 ? (20 * Math.log10(t.volume)).toFixed(2) : '-inf',
          pan: t.pan,
          muted: t.muted,
          solo: t.solo,
          eqBands: t.eq,
          fxRack: t.fx,
          clipsCount: t.clips.length,
          clips: t.clips.map((c) => ({
            name: c.name,
            startBar: c.startBar,
            durationBars: c.durationBars,
            pitchShift: c.pitchShift,
          })),
        })),
        arrangementSections: project.arrangementSections,
      },
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_GarageBand_Session.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMsg('Arquivo de sessão GarageBand exportado com sucesso!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                Exportar Projeto & Pistas Stems
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

        {/* Content Body */}
        <div className="p-6 bg-neutral-950 flex flex-col gap-5">
          {/* Option 1: Master Audio WAV */}
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-100 block">
                  Mixagem Master Completa (WAV)
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  Áudio estéreo unificado com todos os volumes, equalização e efeitos aplicados.
                </span>
              </div>
            </div>
            <button
              onClick={handleExportMasterWav}
              disabled={isExporting}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar WAV</span>
            </button>
          </div>

          {/* Option 2: Individual Stems */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-300">
              Exportar Pistas Isoladas (Stems):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {project.tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleExportStem(track.id, track.name)}
                  disabled={isExporting}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-850 disabled:opacity-50 border border-neutral-800 rounded-lg text-left flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                    <span className="text-xs font-medium text-neutral-200 truncate">{track.name}</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Option 3: GarageBand Session Data */}
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-100 block">
                  Projeto GarageBand / Logic Pro (.json)
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  Estrutura de faixas, compassos, andamento e configurações de equalizadores.
                </span>
              </div>
            </div>
            <button
              onClick={handleExportProjectJSON}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-neutral-700 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sessão DAW</span>
            </button>
          </div>

          {/* Status / Success message */}
          {isExporting && (
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-2 text-xs text-amber-400">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>{exportStatus}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
