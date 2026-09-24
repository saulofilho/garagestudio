import { AutomationParameter, AutomationPoint, AutomationLane } from '../types/daw';

export interface ParamConfig {
  param: AutomationParameter;
  name: string;
  shortName: string;
  min: number;
  max: number;
  defaultValue: number;
  unit: string;
  color: string;
  glowColor: string;
  fillColor: string;
  isLogarithmic?: boolean;
  formatValue: (val: number) => string;
}

export const AUTOMATION_CONFIGS: Record<AutomationParameter, ParamConfig> = {
  volume: {
    param: 'volume',
    name: 'Volume',
    shortName: 'VOL',
    min: 0,
    max: 1.5,
    defaultValue: 0.85,
    unit: '%',
    color: '#38bdf8', // sky-400
    glowColor: 'rgba(56, 189, 248, 0.4)',
    fillColor: 'rgba(56, 189, 248, 0.12)',
    formatValue: (val: number) => `${Math.round(val * 100)}%`,
  },
  pan: {
    param: 'pan',
    name: 'Panorâmica',
    shortName: 'PAN',
    min: -1,
    max: 1,
    defaultValue: 0,
    unit: '',
    color: '#c084fc', // purple-400
    glowColor: 'rgba(192, 132, 252, 0.4)',
    fillColor: 'rgba(192, 132, 252, 0.12)',
    formatValue: (val: number) => {
      const rounded = Math.round(val * 100);
      if (Math.abs(rounded) <= 2) return 'Centro (C)';
      return rounded < 0 ? `${Math.abs(rounded)}% L` : `${rounded}% R`;
    },
  },
  filterCutoff: {
    param: 'filterCutoff',
    name: 'Filtro Cutoff (Lowpass)',
    shortName: 'CUTOFF',
    min: 20,
    max: 20000,
    defaultValue: 20000,
    unit: 'Hz',
    color: '#34d399', // emerald-400
    glowColor: 'rgba(52, 211, 153, 0.4)',
    fillColor: 'rgba(52, 211, 153, 0.12)',
    isLogarithmic: true,
    formatValue: (val: number) => {
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)} kHz`;
      }
      return `${Math.round(val)} Hz`;
    },
  },
};

/**
 * Normalizes a parameter value to [0, 1] where 1 is top/max and 0 is bottom/min
 */
export function normalizeValue(param: AutomationParameter, value: number): number {
  const cfg = AUTOMATION_CONFIGS[param];
  const clamped = Math.max(cfg.min, Math.min(cfg.max, value));

  if (cfg.isLogarithmic) {
    // Logarithmic scale for frequency response (20Hz - 20000Hz)
    const minLog = Math.log10(cfg.min);
    const maxLog = Math.log10(cfg.max);
    const valLog = Math.log10(clamped);
    return Math.max(0, Math.min(1, (valLog - minLog) / (maxLog - minLog)));
  }

  return Math.max(0, Math.min(1, (clamped - cfg.min) / (cfg.max - cfg.min)));
}

/**
 * Converts a normalized value [0, 1] back to the parameter's actual value
 */
export function denormalizeValue(param: AutomationParameter, norm: number): number {
  const cfg = AUTOMATION_CONFIGS[param];
  const clampedNorm = Math.max(0, Math.min(1, norm));

  if (cfg.isLogarithmic) {
    const minLog = Math.log10(cfg.min);
    const maxLog = Math.log10(cfg.max);
    const valLog = minLog + clampedNorm * (maxLog - minLog);
    return Math.round(Math.pow(10, valLog));
  }

  const raw = cfg.min + clampedNorm * (cfg.max - cfg.min);
  if (param === 'volume' || param === 'pan') {
    return Math.round(raw * 100) / 100;
  }
  return raw;
}

/**
 * Evaluates the automated value for a given bar position using linear interpolation
 */
export function interpolateAutomationValue(
  param: AutomationParameter,
  points: AutomationPoint[] | undefined,
  currentBar: number,
  fallbackValue: number
): number {
  if (!points || points.length === 0) return fallbackValue;

  // Ensure points are sorted by bar
  const sorted = [...points].sort((a, b) => a.bar - b.bar);

  if (currentBar <= sorted[0].bar) {
    return sorted[0].value;
  }
  if (currentBar >= sorted[sorted.length - 1].bar) {
    return sorted[sorted.length - 1].value;
  }

  // Find surrounding segment
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];

    if (currentBar >= p1.bar && currentBar <= p2.bar) {
      const deltaBar = p2.bar - p1.bar;
      if (deltaBar === 0) return p2.value;

      const factor = (currentBar - p1.bar) / deltaBar;

      if (param === 'filterCutoff') {
        const norm1 = normalizeValue('filterCutoff', p1.value);
        const norm2 = normalizeValue('filterCutoff', p2.value);
        const interpolatedNorm = norm1 + (norm2 - norm1) * factor;
        return denormalizeValue('filterCutoff', interpolatedNorm);
      }

      return p1.value + (p2.value - p1.value) * factor;
    }
  }

  return fallbackValue;
}

/**
 * Cleans and sorts automation points, removing duplicates within 0.05 bars
 */
export function sortAndCleanPoints(points: AutomationPoint[]): AutomationPoint[] {
  const sorted = [...points].sort((a, b) => a.bar - b.bar);
  const result: AutomationPoint[] = [];

  for (const pt of sorted) {
    const last = result[result.length - 1];
    if (last && Math.abs(last.bar - pt.bar) < 0.04) {
      // Overwrite or update closest point
      result[result.length - 1] = pt;
    } else {
      result.push(pt);
    }
  }

  return result;
}

/**
 * Generates creative curve presets for a track automation lane
 */
export function generateAutomationPresetPoints(
  param: AutomationParameter,
  presetId: 'fade-in' | 'fade-out' | 'filter-sweep-up' | 'filter-sweep-down' | 'auto-pan' | 'sidechain-pump' | 'flat-reset',
  totalBars: number,
  startBar: number = 1,
  endBar: number = totalBars
): AutomationPoint[] {
  const points: AutomationPoint[] = [];
  const cfg = AUTOMATION_CONFIGS[param];
  const safeEnd = Math.max(startBar + 1, Math.min(totalBars, endBar));
  const span = safeEnd - startBar;

  switch (presetId) {
    case 'fade-in': {
      // Smooth S-curve or ramp from min to default
      const startVal = param === 'volume' ? 0 : param === 'pan' ? -1 : 60;
      const targetVal = cfg.defaultValue;
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        // Smooth sine ease in-out
        const ease = 0.5 - 0.5 * Math.cos(frac * Math.PI);
        const bar = startBar + frac * span;
        const norm = (param === 'filterCutoff')
          ? normalizeValue('filterCutoff', startVal) + (normalizeValue('filterCutoff', targetVal) - normalizeValue('filterCutoff', startVal)) * ease
          : 0;
        const val = param === 'filterCutoff'
          ? denormalizeValue('filterCutoff', norm)
          : startVal + (targetVal - startVal) * ease;
        points.push({ id: `pt-${Date.now()}-${i}`, bar: parseFloat(bar.toFixed(2)), value: Math.round(val * 100) / 100 });
      }
      break;
    }

    case 'fade-out': {
      // Ramp from current/default to min
      const startVal = cfg.defaultValue;
      const endVal = param === 'volume' ? 0 : param === 'pan' ? 1 : 60;
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const ease = 0.5 - 0.5 * Math.cos(frac * Math.PI);
        const bar = startBar + frac * span;
        const norm = (param === 'filterCutoff')
          ? normalizeValue('filterCutoff', startVal) + (normalizeValue('filterCutoff', endVal) - normalizeValue('filterCutoff', startVal)) * ease
          : 0;
        const val = param === 'filterCutoff'
          ? denormalizeValue('filterCutoff', norm)
          : startVal + (endVal - startVal) * ease;
        points.push({ id: `pt-${Date.now()}-${i}`, bar: parseFloat(bar.toFixed(2)), value: Math.round(val * 100) / 100 });
      }
      break;
    }

    case 'filter-sweep-up': {
      // 40Hz to 20kHz exponential riser
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const bar = startBar + frac * span;
        // Exponential rise
        const norm = Math.pow(frac, 1.3);
        const val = denormalizeValue('filterCutoff', norm);
        points.push({ id: `pt-${Date.now()}-${i}`, bar: parseFloat(bar.toFixed(2)), value: Math.round(val) });
      }
      break;
    }

    case 'filter-sweep-down': {
      // 20kHz down to 200Hz
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const bar = startBar + frac * span;
        const norm = 1 - Math.pow(frac, 0.8) * 0.85; // Down to ~15% (approx 200Hz)
        const val = denormalizeValue('filterCutoff', norm);
        points.push({ id: `pt-${Date.now()}-${i}`, bar: parseFloat(bar.toFixed(2)), value: Math.round(val) });
      }
      break;
    }

    case 'auto-pan': {
      // Ping-pong stereo modulation
      const cycles = Math.max(1, Math.floor(span / 2));
      const steps = cycles * 8;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const bar = startBar + frac * span;
        const panVal = Math.sin(frac * cycles * 2 * Math.PI) * 0.85;
        points.push({ id: `pt-${Date.now()}-${i}`, bar: parseFloat(bar.toFixed(2)), value: Math.round(panVal * 100) / 100 });
      }
      break;
    }

    case 'sidechain-pump': {
      // 4/4 pump ducking curve
      for (let bar = startBar; bar < safeEnd; bar++) {
        for (let beat = 0; beat < 4; beat++) {
          const beatBar = bar + beat * 0.25;
          // Dip to 0.25 on the downbeat, rise back up to 0.9 by next 16th note
          points.push({ id: `pt-${Date.now()}-${bar}-${beat}-1`, bar: parseFloat(beatBar.toFixed(2)), value: param === 'volume' ? 0.2 : param === 'filterCutoff' ? 400 : -0.7 });
          points.push({ id: `pt-${Date.now()}-${bar}-${beat}-2`, bar: parseFloat((beatBar + 0.18).toFixed(2)), value: param === 'volume' ? 0.95 : param === 'filterCutoff' ? 18000 : 0.7 });
        }
      }
      points.push({ id: `pt-${Date.now()}-end`, bar: safeEnd, value: param === 'volume' ? 0.95 : cfg.defaultValue });
      break;
    }

    case 'flat-reset':
    default: {
      points.push({ id: `pt-${Date.now()}-start`, bar: 1, value: cfg.defaultValue });
      points.push({ id: `pt-${Date.now()}-end`, bar: totalBars, value: cfg.defaultValue });
      break;
    }
  }

  return sortAndCleanPoints(points);
}
