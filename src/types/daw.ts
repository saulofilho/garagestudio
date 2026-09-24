export type InstrumentType = 
  | 'vocals' 
  | 'drums' 
  | 'bass' 
  | 'keys' 
  | 'guitar' 
  | 'strings' 
  | 'synth';

export interface EQBand {
  id: string;
  name: string;
  type: BiquadFilterType;
  frequency: number; // Hz
  gain: number;      // dB (-15 to +15)
  q: number;         // Quality factor (0.1 to 18)
  enabled: boolean;
}

export interface TrackEQ {
  enabled: boolean;
  lowShelf: EQBand;
  lowMid: EQBand;
  mid: EQBand;
  highMid: EQBand;
  highShelf: EQBand;
}

export interface TrackFX {
  reverb: {
    enabled: boolean;
    wet: number;    // 0 to 1
    decay: number;  // 0.2 to 5 seconds
    roomSize: number; // 0.1 to 1
  };
  delay: {
    enabled: boolean;
    wet: number;    // 0 to 1
    time: number;   // 0.05 to 1.0 seconds
    feedback: number; // 0 to 0.85
  };
  distortion: {
    enabled: boolean;
    wet: number;    // 0 to 1
    drive: number;  // 0 to 10
  };
  compressor: {
    enabled: boolean;
    threshold: number; // -60 to 0 dB
    ratio: number;     // 1 to 20
    attack: number;    // 0.001 to 0.1s
    release: number;   // 0.05 to 0.5s
  };
}

export interface NoteEvent {
  note: string;     // e.g. "C4", "G3"
  midi: number;     // e.g. 60
  time: number;     // in bar units (e.g. 1.0, 1.25)
  duration: number; // in bar units (e.g. 0.25, 0.5)
  velocity: number; // 0 to 1
}

export interface AudioClip {
  id: string;
  trackId: string;
  startBar: number;
  durationBars: number;
  name: string;
  color: string;
  waveformPeaks: number[];
  pitchShift: number; // semitones: -12 to +12
  isMuted?: boolean;
}

export interface Track {
  id: string;
  name: string;
  instrument: InstrumentType;
  color: string;
  volume: number;     // 0 to 1.5, default 0.85
  pan: number;        // -1 to +1, default 0
  muted: boolean;
  solo: boolean;
  recordArm: boolean;
  clips: AudioClip[];
  eq: TrackEQ;
  fx: TrackFX;
  notes?: NoteEvent[];
  audioBuffer?: AudioBuffer;
  automationLanes?: AutomationLane[];
  showAutomation?: boolean;
  selectedAutomationParam?: AutomationParameter;
}

export type AutomationParameter = 'volume' | 'pan' | 'filterCutoff';

export interface AutomationPoint {
  id: string;
  bar: number;      // 1.0 to totalBars
  value: number;    // volume: 0 to 1.5; pan: -1 to +1; filterCutoff: 20 to 20000 Hz
}

export interface AutomationLane {
  param: AutomationParameter;
  enabled: boolean;
  points: AutomationPoint[];
}

export interface ArrangementSection {
  name: string;
  startBar: number;
  endBar: number;
  activeStems: string[];
}

export interface SongProject {
  id: string;
  title: string;
  artist: string;
  spotifyUrl?: string;
  thumbnailUrl?: string;
  previewAudioUrl?: string;
  audioMode?: 'real' | 'synth';
  bpm: number;
  key: string;
  timeSignature: string;
  totalBars: number;
  loopStartBar: number;
  loopEndBar: number;
  loopEnabled: boolean;
  genre: string;
  tracks: Track[];
  arrangementSections: ArrangementSection[];
  masterVolume: number;
  masterPan: number;
  mixingAdvice?: string;
}
