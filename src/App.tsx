import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SongProject, Track, TrackEQ, TrackFX, AudioClip, AutomationParameter, AutomationPoint } from './types/daw';
import { DEMO_PROJECTS, createDefaultEQ, createDefaultFX, generateWaveformPeaks } from './data/defaultProjects';
import { audioEngine } from './audio/audioEngine';

import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { MixerConsole } from './components/MixerConsole';
import { ParametricEQ } from './components/ParametricEQ';
import { FXRack } from './components/FXRack';
import { InstrumentModal } from './components/InstrumentModal';
import { SpotifyImportModal } from './components/SpotifyImportModal';
import { ExportModal } from './components/ExportModal';
import { MixAdvisorModal } from './components/MixAdvisorModal';

export default function App() {
  const [project, setProject] = useState<SongProject>(DEMO_PROJECTS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBar, setCurrentBar] = useState<number>(1);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [meterLevels, setMeterLevels] = useState<{ [trackId: string]: number; master: number }>({ master: 0 });
  const [metronomeOn, setMetronomeOn] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'timeline' | 'mixer'>('timeline');
  const [isExtractingStems, setIsExtractingStems] = useState<boolean>(false);
  const [stemExtractMessage, setStemExtractMessage] = useState<string | null>(null);

  // Selection states
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(DEMO_PROJECTS[0].tracks[0].id);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Modal states
  const [eqModalTrackId, setEqModalTrackId] = useState<string | null>(null);
  const [fxModalTrackId, setFxModalTrackId] = useState<string | null>(null);
  const [instrumentModalTrackId, setInstrumentModalTrackId] = useState<string | null>(null);
  const [showSpotifyImport, setShowSpotifyImport] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showMixAdvisor, setShowMixAdvisor] = useState<boolean>(false);

  // Keep a ref to project for audio callbacks
  const projectRef = useRef(project);
  projectRef.current = project;

  // Setup Web Audio callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (timeSec, bar) => {
        setTimeSeconds(timeSec);
        setCurrentBar(bar);
      },
      (meters) => {
        setMeterLevels(meters);
      }
    );
  }, []);

  // Update track nodes in audio engine whenever tracks change
  useEffect(() => {
    audioEngine.syncTracks(project.tracks);
    audioEngine.setMasterVolume(project.masterVolume);
  }, [project.tracks, project.masterVolume]);

  // Automatically load studio preview audio and decompose into real stems if available
  useEffect(() => {
    let isCancelled = false;
    const loadStemsIfNeeded = async () => {
      if (project.previewAudioUrl && !project.tracks.some((t) => t.audioBuffer)) {
        setIsExtractingStems(true);
        setStemExtractMessage('Isolando stems em alta fidelidade com DSP multi-passo zero-phase...');
        try {
          const enriched = await audioEngine.loadRealSongStems(project, project.previewAudioUrl);
          if (!isCancelled) {
            setProject(enriched);
          }
        } catch (err) {
          console.warn('Real audio stem extraction fallback:', err);
        } finally {
          if (!isCancelled) {
            setIsExtractingStems(false);
            setStemExtractMessage(null);
          }
        }
      }
    };

    loadStemsIfNeeded();
    return () => {
      isCancelled = true;
    };
  }, [project.id, project.previewAudioUrl]);

  // Spacebar and shortcuts listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        handleRewind();
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        handleToggleLoop();
      } else if (e.key.toLowerCase() === 'k' && !e.metaKey && !e.ctrlKey) {
        handleToggleMetronome();
      } else if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
        if (selectedTrackId) {
          handleToggleTrackAutomationLane(selectedTrackId);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isPlaying, project, selectedTrackId]);

  // Play / Pause
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play(projectRef.current, currentBar);
      setIsPlaying(true);
    }
  }, [isPlaying, currentBar]);

  // Stop
  const handleStop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentBar(1);
    setTimeSeconds(0);
  }, []);

  // Rewind to Bar 1
  const handleRewind = useCallback(() => {
    audioEngine.seek(projectRef.current, 1);
    setCurrentBar(1);
    setTimeSeconds(0);
  }, []);

  // Scrub / Seek to Bar
  const handleSeekToBar = useCallback((bar: number) => {
    setCurrentBar(bar);
    const secondsPerBar = (60 / projectRef.current.bpm) * 4;
    setTimeSeconds((bar - 1) * secondsPerBar);
    audioEngine.seek(projectRef.current, bar);
  }, []);

  // Loop Toggle
  const handleToggleLoop = useCallback(() => {
    setProject((prev) => ({ ...prev, loopEnabled: !prev.loopEnabled }));
  }, []);

  // Metronome Toggle
  const handleToggleMetronome = useCallback(() => {
    setMetronomeOn((prev) => {
      const next = !prev;
      audioEngine.setMetronome(next);
      return next;
    });
  }, []);

  // Master Volume
  const handleMasterVolumeChange = useCallback((vol: number) => {
    setProject((prev) => ({ ...prev, masterVolume: vol }));
    audioEngine.setMasterVolume(vol);
  }, []);

  // BPM Change
  const handleBpmChange = useCallback((bpm: number) => {
    setProject((prev) => ({ ...prev, bpm }));
    if (isPlaying) {
      audioEngine.play({ ...projectRef.current, bpm }, currentBar);
    }
  }, [isPlaying, currentBar]);

  // Track Volume Change
  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)),
    }));
  }, []);

  // Track Pan Change
  const handleTrackPanChange = useCallback((trackId: string, pan: number) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, pan } : t)),
    }));
  }, []);

  // Track Mute Toggle
  const handleToggleMute = useCallback((trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    }));
  }, []);

  // Track Solo Toggle
  const handleToggleSolo = useCallback((trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t)),
    }));
  }, []);

  // Record Arm Toggle
  const handleToggleRecordArm = useCallback((trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, recordArm: !t.recordArm } : t)),
    }));
  }, []);

  // EQ Update
  const handleUpdateEQ = useCallback((trackId: string, newEQ: TrackEQ) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, eq: newEQ } : t)),
    }));
  }, []);

  // FX Update
  const handleUpdateFX = useCallback((trackId: string, newFX: TrackFX) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, fx: newFX } : t)),
    }));
  }, []);

  // Split Clip At Current Playhead (Scissors)
  const handleSplitClipAtPlayhead = useCallback((trackId: string, clipId: string) => {
    setProject((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;

      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return prev;

      const splitBar = Math.floor(currentBar);
      if (splitBar <= clip.startBar || splitBar >= clip.startBar + clip.durationBars) {
        return prev;
      }

      const firstDuration = splitBar - clip.startBar;
      const secondDuration = clip.durationBars - firstDuration;

      const halfIndex = Math.floor(clip.waveformPeaks.length * (firstDuration / clip.durationBars));

      const firstClip: AudioClip = {
        ...clip,
        durationBars: firstDuration,
        waveformPeaks: clip.waveformPeaks.slice(0, halfIndex),
      };

      const secondClip: AudioClip = {
        ...clip,
        id: `clip-${trackId}-${Date.now()}`,
        startBar: splitBar,
        durationBars: secondDuration,
        waveformPeaks: clip.waveformPeaks.slice(halfIndex),
        name: `${clip.name} (Parte 2)`,
      };

      const updatedClips = track.clips
        .filter((c) => c.id !== clipId)
        .concat([firstClip, secondClip])
        .sort((a, b) => a.startBar - b.startBar);

      return {
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, clips: updatedClips } : t)),
      };
    });
  }, [currentBar]);

  // Duplicate Clip
  const handleDuplicateClip = useCallback((trackId: string, clipId: string) => {
    setProject((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return prev;

      const newClip: AudioClip = {
        ...clip,
        id: `clip-${trackId}-${Date.now()}`,
        startBar: clip.startBar + clip.durationBars,
        name: `${clip.name} (Cópia)`,
      };

      return {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
        ),
      };
    });
  }, []);

  // Delete Clip
  const handleDeleteClip = useCallback((trackId: string, clipId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t
      ),
    }));
  }, []);

  // Add New Track
  const handleAddTrack = useCallback(() => {
    const instruments: Track['instrument'][] = ['synth', 'guitar', 'vocals', 'drums', 'bass', 'strings'];
    const inst = instruments[project.tracks.length % instruments.length];
    const trackColors = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'];
    const color = trackColors[project.tracks.length % trackColors.length];

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `Nova Faixa ${project.tracks.length + 1}`,
      instrument: inst,
      color,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      recordArm: false,
      eq: createDefaultEQ(),
      fx: createDefaultFX(),
      showAutomation: false,
      selectedAutomationParam: 'volume',
      automationLanes: [],
      clips: [
        {
          id: `clip-${Date.now()}`,
          trackId: `track-${Date.now()}`,
          startBar: 1,
          durationBars: project.totalBars,
          name: `Faixa Gravada ${project.tracks.length + 1}`,
          color,
          waveformPeaks: generateWaveformPeaks(project.totalBars, project.tracks.length + 1),
          pitchShift: 0,
        },
      ],
    };

    setProject((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
    setSelectedTrackId(newTrack.id);
  }, [project.tracks.length, project.totalBars]);

  // Set Loop Range
  const handleSetLoopRange = useCallback((startBar: number, endBar: number) => {
    setProject((prev) => ({
      ...prev,
      loopStartBar: startBar,
      loopEndBar: endBar,
    }));
  }, []);

  // Update Track Automation Points (e.g. from freehand drawing, node dragging, presets, clear)
  const handleUpdateTrackAutomationPoints = useCallback((trackId: string, param: AutomationParameter, points: AutomationPoint[]) => {
    setProject((prev) => {
      const updatedTracks = prev.tracks.map((t) => {
        if (t.id !== trackId) return t;

        const lanes = t.automationLanes ? [...t.automationLanes] : [];
        const laneIndex = lanes.findIndex((l) => l.param === param);

        if (laneIndex >= 0) {
          lanes[laneIndex] = {
            ...lanes[laneIndex],
            points,
          };
        } else {
          lanes.push({
            param,
            enabled: true,
            points,
          });
        }

        return {
          ...t,
          automationLanes: lanes,
        };
      });

      const updatedProject = { ...prev, tracks: updatedTracks };
      audioEngine.syncTracks(updatedTracks, updatedProject);
      audioEngine.applyTrackAutomations(updatedProject, currentBar);
      return updatedProject;
    });
  }, [currentBar]);

  // Toggle automation enabled / bypass for a track parameter
  const handleToggleTrackAutomationEnabled = useCallback((trackId: string, param: AutomationParameter, enabled: boolean) => {
    setProject((prev) => {
      const updatedTracks = prev.tracks.map((t) => {
        if (t.id !== trackId) return t;

        const lanes = t.automationLanes ? [...t.automationLanes] : [];
        const laneIndex = lanes.findIndex((l) => l.param === param);

        if (laneIndex >= 0) {
          lanes[laneIndex] = {
            ...lanes[laneIndex],
            enabled,
          };
        } else {
          lanes.push({
            param,
            enabled,
            points: [],
          });
        }

        return {
          ...t,
          automationLanes: lanes,
        };
      });

      const updatedProject = { ...prev, tracks: updatedTracks };
      audioEngine.syncTracks(updatedTracks, updatedProject);
      audioEngine.applyTrackAutomations(updatedProject, currentBar);
      return updatedProject;
    });
  }, [currentBar]);

  // Select active parameter for track automation view (volume | pan | filterCutoff)
  const handleSelectTrackAutomationParam = useCallback((trackId: string, param: AutomationParameter) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, selectedAutomationParam: param } : t)),
    }));
  }, []);

  // Toggle expand/collapse single track automation lane
  const handleToggleTrackAutomationLane = useCallback((trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, showAutomation: !t.showAutomation } : t)),
    }));
  }, []);

  // Toggle expand/collapse all tracks' automation lanes
  const handleToggleAllAutomationLanes = useCallback(() => {
    setProject((prev) => {
      const anyOpen = prev.tracks.some((t) => t.showAutomation);
      return {
        ...prev,
        tracks: prev.tracks.map((t) => ({ ...t, showAutomation: !anyOpen })),
      };
    });
  }, []);

  // Toggle audio mode between real studio stems and physical modeling synth
  const handleToggleAudioMode = useCallback(() => {
    setProject((prev) => {
      const nextMode = prev.audioMode === 'synth' ? 'real' : 'synth';
      const updated: SongProject = { ...prev, audioMode: nextMode };
      if (isPlaying) {
        audioEngine.play(updated, currentBar);
      }
      return updated;
    });
  }, [isPlaying, currentBar]);

  // Load imported project
  const handleLoadProject = useCallback((newProject: SongProject) => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentBar(1);
    setTimeSeconds(0);
    setProject(newProject);
    setSelectedTrackId(newProject.tracks[0]?.id || null);
    setSelectedClipId(null);
  }, []);

  const activeEQTrack = project.tracks.find((t) => t.id === eqModalTrackId);
  const activeFXTrack = project.tracks.find((t) => t.id === fxModalTrackId);
  const activeInstrumentTrack = project.tracks.find(
    (t) => t.id === instrumentModalTrackId || t.id === selectedTrackId
  ) || project.tracks[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Header & Transport Bar */}
      <Header
        project={project}
        isPlaying={isPlaying}
        currentBar={currentBar}
        timeSeconds={timeSeconds}
        masterMeter={meterLevels.master}
        metronomeOn={metronomeOn}
        activeView={activeView}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onRewind={handleRewind}
        onToggleLoop={handleToggleLoop}
        onToggleMetronome={handleToggleMetronome}
        onMasterVolumeChange={handleMasterVolumeChange}
        onBpmChange={handleBpmChange}
        onOpenImport={() => setShowSpotifyImport(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenMixAdvisor={() => setShowMixAdvisor(true)}
        onToggleView={(view) => setActiveView(view)}
        onOpenInstruments={() => setInstrumentModalTrackId(selectedTrackId || project.tracks[0]?.id)}
        onToggleAudioMode={handleToggleAudioMode}
      />

      {/* Stem Extraction Notification Banner */}
      {isExtractingStems && stemExtractMessage && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">{stemExtractMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">DSP Multi-Passo Zero-Phase (LR4)</span>
        </div>
      )}

      {/* Main Studio View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'timeline' ? (
          <Timeline
            project={project}
            currentBar={currentBar}
            meterLevels={meterLevels}
            selectedTrackId={selectedTrackId}
            selectedClipId={selectedClipId}
            onSelectTrack={(id) => setSelectedTrackId(id)}
            onSelectClip={(id) => setSelectedClipId(id)}
            onTrackVolumeChange={handleTrackVolumeChange}
            onTrackPanChange={handleTrackPanChange}
            onToggleMute={handleToggleMute}
            onToggleSolo={handleToggleSolo}
            onToggleRecordArm={handleToggleRecordArm}
            onOpenEQ={(id) => setEqModalTrackId(id)}
            onOpenFX={(id) => setFxModalTrackId(id)}
            onOpenInstrument={(id) => setInstrumentModalTrackId(id)}
            onSeekToBar={handleSeekToBar}
            onSplitClipAtPlayhead={handleSplitClipAtPlayhead}
            onDuplicateClip={handleDuplicateClip}
            onDeleteClip={handleDeleteClip}
            onAddTrack={handleAddTrack}
            onSetLoopRange={handleSetLoopRange}
            onUpdateTrackAutomationPoints={handleUpdateTrackAutomationPoints}
            onToggleTrackAutomationEnabled={handleToggleTrackAutomationEnabled}
            onSelectTrackAutomationParam={handleSelectTrackAutomationParam}
            onToggleTrackAutomationLane={handleToggleTrackAutomationLane}
            onToggleAllAutomationLanes={handleToggleAllAutomationLanes}
          />
        ) : (
          <MixerConsole
            project={project}
            meterLevels={meterLevels}
            onTrackVolumeChange={handleTrackVolumeChange}
            onTrackPanChange={handleTrackPanChange}
            onToggleMute={handleToggleMute}
            onToggleSolo={handleToggleSolo}
            onMasterVolumeChange={handleMasterVolumeChange}
            onOpenEQ={(id) => setEqModalTrackId(id)}
            onOpenFX={(id) => setFxModalTrackId(id)}
          />
        )}
      </main>

      {/* 5-Band Visual Parametric Equalizer Modal */}
      {activeEQTrack && (
        <ParametricEQ
          track={activeEQTrack}
          tracks={project.tracks}
          onUpdateEQ={handleUpdateEQ}
          onSelectTrack={(id) => setEqModalTrackId(id)}
          onClose={() => setEqModalTrackId(null)}
        />
      )}

      {/* FX Processing Rack Modal */}
      {activeFXTrack && (
        <FXRack
          track={activeFXTrack}
          tracks={project.tracks}
          onUpdateFX={handleUpdateFX}
          onSelectTrack={(id) => setFxModalTrackId(id)}
          onClose={() => setFxModalTrackId(null)}
        />
      )}

      {/* GarageBand Virtual Keyboard / Drum MPC Modal */}
      {instrumentModalTrackId && activeInstrumentTrack && (
        <InstrumentModal
          track={activeInstrumentTrack}
          project={project}
          onClose={() => setInstrumentModalTrackId(null)}
        />
      )}

      {/* Spotify Import & Stem Decomposition Modal */}
      {showSpotifyImport && (
        <SpotifyImportModal
          onLoadProject={handleLoadProject}
          onClose={() => setShowSpotifyImport(false)}
        />
      )}

      {/* Export WAV & Stems Modal */}
      {showExportModal && (
        <ExportModal
          project={project}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* AI Mix Advisor Modal */}
      {showMixAdvisor && (
        <MixAdvisorModal
          project={project}
          onClose={() => setShowMixAdvisor(false)}
        />
      )}
    </div>
  );
}
