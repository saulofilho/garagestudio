import { SongProject, TrackEQ, TrackFX } from '../types/daw';

export const createDefaultEQ = (): TrackEQ => ({
  enabled: true,
  lowShelf: {
    id: 'ls',
    name: 'Low Shelf (Sub/Bass)',
    type: 'lowshelf',
    frequency: 80,
    gain: 0,
    q: 0.71,
    enabled: true,
  },
  lowMid: {
    id: 'lm',
    name: 'Low Mid (Body/Mud)',
    type: 'peaking',
    frequency: 300,
    gain: 0,
    q: 1.0,
    enabled: true,
  },
  mid: {
    id: 'm',
    name: 'Mid (Presence)',
    type: 'peaking',
    frequency: 1200,
    gain: 0,
    q: 1.2,
    enabled: true,
  },
  highMid: {
    id: 'hm',
    name: 'High Mid (Clarity)',
    type: 'peaking',
    frequency: 4500,
    gain: 0,
    q: 1.1,
    enabled: true,
  },
  highShelf: {
    id: 'hs',
    name: 'High Shelf (Air/Shine)',
    type: 'highshelf',
    frequency: 10000,
    gain: 0,
    q: 0.71,
    enabled: true,
  },
});

export const createDefaultFX = (): TrackFX => ({
  reverb: {
    enabled: false,
    wet: 0.25,
    decay: 1.8,
    roomSize: 0.6,
  },
  delay: {
    enabled: false,
    wet: 0.2,
    time: 0.35,
    feedback: 0.3,
  },
  distortion: {
    enabled: false,
    wet: 0.15,
    drive: 2.0,
  },
  compressor: {
    enabled: true,
    threshold: -18,
    ratio: 3.5,
    attack: 0.02,
    release: 0.15,
  },
});

// Helper to generate simulated waveform peak arrays
export function generateWaveformPeaks(bars: number, seed: number): number[] {
  const points = bars * 24;
  const peaks: number[] = [];
  for (let i = 0; i < points; i++) {
    const time = i / 12;
    const base = Math.sin(time * 3 + seed) * 0.3 + 0.5;
    const noise = Math.sin(time * 19 + seed * 2) * 0.2;
    const accent = (i % 6 === 0) ? 0.35 : 0;
    const val = Math.max(0.1, Math.min(1.0, base + noise + accent));
    peaks.push(parseFloat(val.toFixed(2)));
  }
  return peaks;
}

export const DEMO_PROJECTS: SongProject[] = [
  {
    id: 'spotify-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    previewAudioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/19/d6/60/19d660ff-e3a9-8377-15a3-ce4b28e89cac/mzaf_18422426156481158187.plus.aac.p.m4a',
    audioMode: 'real',
    bpm: 171,
    key: 'Fm (Fá Menor)',
    timeSignature: '4/4',
    totalBars: 32,
    loopStartBar: 1,
    loopEndBar: 16,
    loopEnabled: false,
    genre: 'Synthwave / 80s Pop',
    masterVolume: 0.9,
    masterPan: 0,
    mixingAdvice: 'Mantenha os graves do sintetizador analógico focados no centro. Dê boost de 3kHz na voz para cortar a densidade dos sintetizadores.',
    arrangementSections: [
      { name: 'Intro', startBar: 1, endBar: 4, activeStems: ['drums', 'bass', 'keys_synths'] },
      { name: 'Verse 1', startBar: 5, endBar: 12, activeStems: ['vocals', 'drums', 'bass', 'guitars'] },
      { name: 'Pre-Chorus', startBar: 13, endBar: 16, activeStems: ['vocals', 'drums', 'keys_synths', 'fx_strings'] },
      { name: 'Chorus 1', startBar: 17, endBar: 24, activeStems: ['vocals', 'drums', 'bass', 'keys_synths', 'guitars', 'fx_strings'] },
      { name: 'Bridge', startBar: 25, endBar: 28, activeStems: ['drums', 'bass', 'guitars'] },
      { name: 'Outro', startBar: 29, endBar: 32, activeStems: ['vocals', 'drums', 'bass', 'keys_synths'] }
    ],
    tracks: [
      {
        id: 'vocals',
        name: 'Lead Vocals & Chorus',
        instrument: 'vocals',
        color: '#ef4444',
        volume: 0.92,
        pan: 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: {
          ...createDefaultEQ(),
          lowShelf: { ...createDefaultEQ().lowShelf, gain: -4, frequency: 100 },
          mid: { ...createDefaultEQ().mid, gain: 2.5, frequency: 3200 },
          highShelf: { ...createDefaultEQ().highShelf, gain: 3.5, frequency: 11000 },
        },
        fx: {
          ...createDefaultFX(),
          reverb: { enabled: true, wet: 0.32, decay: 2.2, roomSize: 0.7 },
          delay: { enabled: true, wet: 0.22, time: 0.35, feedback: 0.25 },
        },
        clips: [
          {
            id: 'clip-vocal-1',
            trackId: 'vocals',
            startBar: 5,
            durationBars: 8,
            name: 'Verse 1 Vocal Stem',
            color: '#ef4444',
            waveformPeaks: generateWaveformPeaks(8, 1),
            pitchShift: 0,
          },
          {
            id: 'clip-vocal-2',
            trackId: 'vocals',
            startBar: 17,
            durationBars: 8,
            name: 'Chorus Lead Vocal Hook',
            color: '#ef4444',
            waveformPeaks: generateWaveformPeaks(8, 2),
            pitchShift: 0,
          },
          {
            id: 'clip-vocal-3',
            trackId: 'vocals',
            startBar: 29,
            durationBars: 4,
            name: 'Outro Ad-libs',
            color: '#ef4444',
            waveformPeaks: generateWaveformPeaks(4, 3),
            pitchShift: 0,
          }
        ],
        selectedAutomationParam: 'volume',
        automationLanes: [
          {
            param: 'volume',
            enabled: true,
            points: [
              { id: 'voc-vol-1', bar: 5, value: 0.88 },
              { id: 'voc-vol-2', bar: 12.8, value: 0.92 },
              { id: 'voc-vol-3', bar: 13, value: 0.85 },
              { id: 'voc-vol-4', bar: 17, value: 1.05 },
              { id: 'voc-vol-5', bar: 25, value: 0.9 },
              { id: 'voc-vol-6', bar: 30, value: 0.85 },
              { id: 'voc-vol-7', bar: 32, value: 0.0 },
            ],
          },
          {
            param: 'pan',
            enabled: true,
            points: [
              { id: 'voc-pan-1', bar: 5, value: 0 },
              { id: 'voc-pan-2', bar: 29, value: -0.2 },
              { id: 'voc-pan-3', bar: 31, value: 0.2 },
            ],
          },
        ],
      },
      {
        id: 'drums',
        name: 'Electronic Drums (80s Linndrum)',
        instrument: 'drums',
        color: '#f59e0b',
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: {
          ...createDefaultEQ(),
          lowShelf: { ...createDefaultEQ().lowShelf, gain: 3.0, frequency: 65 },
          lowMid: { ...createDefaultEQ().lowMid, gain: -2.0, frequency: 350 },
          highMid: { ...createDefaultEQ().highMid, gain: 2.5, frequency: 5000 },
        },
        fx: {
          ...createDefaultFX(),
          compressor: { enabled: true, threshold: -14, ratio: 4.5, attack: 0.01, release: 0.1 },
        },
        clips: [
          {
            id: 'clip-drums-all',
            trackId: 'drums',
            startBar: 1,
            durationBars: 32,
            name: 'Linndrum Beat Loop 171BPM',
            color: '#f59e0b',
            waveformPeaks: generateWaveformPeaks(32, 4),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'bass',
        name: 'Analog Moog Synth Bass',
        instrument: 'bass',
        color: '#8b5cf6',
        volume: 0.88,
        pan: 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: {
          ...createDefaultEQ(),
          lowShelf: { ...createDefaultEQ().lowShelf, gain: 4.0, frequency: 75 },
          highShelf: { ...createDefaultEQ().highShelf, gain: -3.0, frequency: 4500 },
        },
        fx: {
          ...createDefaultFX(),
          distortion: { enabled: true, wet: 0.18, drive: 2.2 },
        },
        clips: [
          {
            id: 'clip-bass-main',
            trackId: 'bass',
            startBar: 1,
            durationBars: 32,
            name: 'Fm Synth Bassline Groove',
            color: '#8b5cf6',
            waveformPeaks: generateWaveformPeaks(32, 5),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'keys_synths',
        name: 'Poly Synth Lead & Chords (Juno 106)',
        instrument: 'synth',
        color: '#3b82f6',
        volume: 0.84,
        pan: -0.2,
        muted: false,
        solo: false,
        recordArm: false,
        eq: {
          ...createDefaultEQ(),
          lowShelf: { ...createDefaultEQ().lowShelf, gain: -3.0, frequency: 180 },
          highMid: { ...createDefaultEQ().highMid, gain: 2.5, frequency: 6000 },
        },
        fx: {
          ...createDefaultFX(),
          reverb: { enabled: true, wet: 0.35, decay: 2.0, roomSize: 0.65 },
          delay: { enabled: true, wet: 0.25, time: 0.28, feedback: 0.3 },
        },
        clips: [
          {
            id: 'clip-synth-lead',
            trackId: 'keys_synths',
            startBar: 1,
            durationBars: 32,
            name: 'Iconic Hook Synth Melody',
            color: '#3b82f6',
            waveformPeaks: generateWaveformPeaks(32, 6),
            pitchShift: 0,
          }
        ],
        showAutomation: true,
        selectedAutomationParam: 'filterCutoff',
        automationLanes: [
          {
            param: 'filterCutoff',
            enabled: true,
            points: [
              { id: 'ks-cut-1', bar: 1, value: 1400 },
              { id: 'ks-cut-2', bar: 4.8, value: 18500 },
              { id: 'ks-cut-3', bar: 5, value: 3200 },
              { id: 'ks-cut-4', bar: 12.8, value: 5500 },
              { id: 'ks-cut-5', bar: 13, value: 900 },
              { id: 'ks-cut-6', bar: 16.8, value: 19800 },
              { id: 'ks-cut-7', bar: 17, value: 16000 },
              { id: 'ks-cut-8', bar: 24.8, value: 16000 },
              { id: 'ks-cut-9', bar: 25, value: 1200 },
              { id: 'ks-cut-10', bar: 28.8, value: 19000 },
              { id: 'ks-cut-11', bar: 32, value: 14000 },
            ],
          },
          {
            param: 'pan',
            enabled: true,
            points: [
              { id: 'ks-pan-1', bar: 1, value: -0.4 },
              { id: 'ks-pan-2', bar: 5, value: 0.4 },
              { id: 'ks-pan-3', bar: 9, value: -0.5 },
              { id: 'ks-pan-4', bar: 13, value: 0.5 },
              { id: 'ks-pan-5', bar: 17, value: -0.2 },
              { id: 'ks-pan-6', bar: 32, value: 0.2 },
            ],
          },
          {
            param: 'volume',
            enabled: true,
            points: [
              { id: 'ks-vol-1', bar: 1, value: 0.7 },
              { id: 'ks-vol-2', bar: 4, value: 0.85 },
              { id: 'ks-vol-3', bar: 13, value: 0.8 },
              { id: 'ks-vol-4', bar: 17, value: 0.95 },
              { id: 'ks-vol-5', bar: 29, value: 0.85 },
              { id: 'ks-vol-6', bar: 32, value: 0.15 },
            ],
          },
        ],
      },
      {
        id: 'guitars',
        name: 'Rhythm Guitar Chords',
        instrument: 'guitar',
        color: '#10b981',
        volume: 0.78,
        pan: 0.3,
        muted: false,
        solo: false,
        recordArm: false,
        eq: {
          ...createDefaultEQ(),
          lowShelf: { ...createDefaultEQ().lowShelf, gain: -4.0, frequency: 150 },
          mid: { ...createDefaultEQ().mid, gain: 2.0, frequency: 2800 },
        },
        fx: {
          ...createDefaultFX(),
          reverb: { enabled: true, wet: 0.2, decay: 1.5, roomSize: 0.5 },
        },
        clips: [
          {
            id: 'clip-guitars-chorus',
            trackId: 'guitars',
            startBar: 5,
            durationBars: 24,
            name: 'Funk Rhythm Guitar Comp',
            color: '#10b981',
            waveformPeaks: generateWaveformPeaks(24, 7),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'fx_strings',
        name: 'Strings Pad & Transition Sweeps',
        instrument: 'strings',
        color: '#ec4899',
        volume: 0.74,
        pan: 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: {
          ...createDefaultEQ(),
          highShelf: { ...createDefaultEQ().highShelf, gain: 3.0, frequency: 9000 },
        },
        fx: {
          ...createDefaultFX(),
          reverb: { enabled: true, wet: 0.45, decay: 3.2, roomSize: 0.85 },
        },
        clips: [
          {
            id: 'clip-fx-sweeps',
            trackId: 'fx_strings',
            startBar: 13,
            durationBars: 16,
            name: 'Atmospheric Riser & String Pad',
            color: '#ec4899',
            waveformPeaks: generateWaveformPeaks(16, 8),
            pitchShift: 0,
          }
        ]
      }
    ]
  },
  {
    id: 'spotify-garota-ipanema',
    title: 'Garota de Ipanema',
    artist: 'Antônio Carlos Jobim & Stan Getz',
    spotifyUrl: 'https://open.spotify.com/track/3NdDpSvN911NVWqzAC7RQT',
    thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b27318ec70cb0715cf438ef9ff52',
    previewAudioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/09/69/7c/09697cd5-aa05-e34b-8b91-63bfbc342573/mzaf_11624938030212274213.plus.aac.p.m4a',
    audioMode: 'real',
    bpm: 126,
    key: 'F Major (Fá Maior)',
    timeSignature: '4/4',
    totalBars: 32,
    loopStartBar: 1,
    loopEndBar: 16,
    loopEnabled: false,
    genre: 'Bossa Nova / Jazz Acústico',
    masterVolume: 0.88,
    masterPan: 0,
    mixingAdvice: 'Bossa Nova requer dinâmica suave: evite compressão excessiva. Mantenha o violão de nylon com médios aveludados e a bateria de vassourinhas no estéreo.',
    arrangementSections: [
      { name: 'Intro', startBar: 1, endBar: 4, activeStems: ['guitars', 'drums'] },
      { name: 'Verse 1', startBar: 5, endBar: 12, activeStems: ['vocals', 'guitars', 'drums', 'bass'] },
      { name: 'Verse 2', startBar: 13, endBar: 20, activeStems: ['vocals', 'guitars', 'drums', 'bass', 'keys_synths'] },
      { name: 'Sax Solo', startBar: 21, endBar: 28, activeStems: ['guitars', 'drums', 'bass', 'keys_synths'] },
      { name: 'Outro', startBar: 29, endBar: 32, activeStems: ['vocals', 'guitars', 'drums', 'bass'] }
    ],
    tracks: [
      {
        id: 'vocals',
        name: 'Voz Melódica Suave (Astrud & Tom)',
        instrument: 'vocals',
        color: '#ef4444',
        volume: 0.88,
        pan: 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: createDefaultEQ(),
        fx: createDefaultFX(),
        clips: [
          {
            id: 'clip-bossa-vox',
            trackId: 'vocals',
            startBar: 5,
            durationBars: 16,
            name: 'Voz Bossa Suave',
            color: '#ef4444',
            waveformPeaks: generateWaveformPeaks(16, 11),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'guitars',
        name: 'Violão de Nylon (Batida de Bossa)',
        instrument: 'guitar',
        color: '#10b981',
        volume: 0.92,
        pan: -0.2,
        muted: false,
        solo: false,
        recordArm: false,
        eq: createDefaultEQ(),
        fx: createDefaultFX(),
        clips: [
          {
            id: 'clip-bossa-violao',
            trackId: 'guitars',
            startBar: 1,
            durationBars: 32,
            name: 'Violão Nylon João Gilberto',
            color: '#10b981',
            waveformPeaks: generateWaveformPeaks(32, 12),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'drums',
        name: 'Bateria com Vassourinhas (Brushes)',
        instrument: 'drums',
        color: '#f59e0b',
        volume: 0.82,
        pan: 0.15,
        muted: false,
        solo: false,
        recordArm: false,
        eq: createDefaultEQ(),
        fx: createDefaultFX(),
        clips: [
          {
            id: 'clip-bossa-drums',
            trackId: 'drums',
            startBar: 1,
            durationBars: 32,
            name: 'Samba Bossa Brushes',
            color: '#f59e0b',
            waveformPeaks: generateWaveformPeaks(32, 13),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'bass',
        name: 'Contrabaixo Acústico (Upright Bass)',
        instrument: 'bass',
        color: '#8b5cf6',
        volume: 0.85,
        pan: 0,
        muted: false,
        solo: false,
        recordArm: false,
        eq: createDefaultEQ(),
        fx: createDefaultFX(),
        clips: [
          {
            id: 'clip-bossa-bass',
            trackId: 'bass',
            startBar: 5,
            durationBars: 28,
            name: 'Upright Bass Swing',
            color: '#8b5cf6',
            waveformPeaks: generateWaveformPeaks(28, 14),
            pitchShift: 0,
          }
        ]
      },
      {
        id: 'keys_synths',
        name: 'Piano de Cauda Acústico & Sax',
        instrument: 'keys',
        color: '#3b82f6',
        volume: 0.84,
        pan: 0.25,
        muted: false,
        solo: false,
        recordArm: false,
        eq: createDefaultEQ(),
        fx: createDefaultFX(),
        clips: [
          {
            id: 'clip-bossa-piano',
            trackId: 'keys_synths',
            startBar: 13,
            durationBars: 16,
            name: 'Piano Chords & Sax Tenor',
            color: '#3b82f6',
            waveformPeaks: generateWaveformPeaks(16, 15),
            pitchShift: 0,
          }
        ]
      }
    ]
  }
];
