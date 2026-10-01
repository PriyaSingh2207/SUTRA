import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, RotateCcw } from 'lucide-react';
import { LinkEntity } from '../types';

interface TemporalSliderProps {
  edges: LinkEntity[];
  activeThreshold: number;
  onChangeThreshold: (val: number) => void;
}

export const TemporalSlider: React.FC<TemporalSliderProps> = ({
  edges,
  activeThreshold,
  onChangeThreshold
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const epochs = edges.map((e) => e.timestamp_epoch).filter(Boolean);
  const minEpoch = epochs.length > 0 ? Math.min(...epochs) : 0;
  const maxEpoch = epochs.length > 0 ? Math.max(...epochs) : 100;

  const thresholdRef = useRef<number | null>(activeThreshold);
  thresholdRef.current = activeThreshold;

  useEffect(() => {
    let interval: any;
    if (isPlaying && maxEpoch > minEpoch) {
      interval = setInterval(() => {
        const currentVal = thresholdRef.current ?? minEpoch;
        const step = Math.max(60, Math.floor((maxEpoch - minEpoch) / 200)) * speed;
        const next = currentVal + step;
        if (next >= maxEpoch) {
          setIsPlaying(false);
          onChangeThreshold(maxEpoch);
        } else {
          onChangeThreshold(next);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, minEpoch, maxEpoch, speed, onChangeThreshold]);

  const activeDate = activeThreshold ? new Date(activeThreshold * 1000).toLocaleString() : 'All Dates';

  return (
    <div className="bg-police-900/90 backdrop-blur-md p-3 rounded-2xl border border-police-700/60 shadow-xl">
      <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onChangeThreshold(minEpoch)}
            className="p-1.5 rounded-lg bg-police-800 hover:bg-police-700 text-slate-300 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-white">15-Day Temporal Playback</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">{activeDate}</span>
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))}
            className="px-2 py-0.5 rounded bg-police-800 text-[10px] text-slate-300 font-bold border border-police-700"
          >
            {speed}x
          </button>
        </div>
      </div>

      <input
        type="range"
        min={minEpoch}
        max={maxEpoch}
        value={activeThreshold || maxEpoch}
        onChange={(e) => onChangeThreshold(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
};
