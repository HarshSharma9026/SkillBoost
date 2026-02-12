import React, { useEffect, useState } from 'react';
import { TimerStatus } from '../types';
import { PlayIcon, PauseIcon, CheckCircleIcon } from './Icons';

interface TimerProps {
  initialSeconds: number;
  onUpdate: (seconds: number) => void;
  onComplete: () => void;
  isCompleted: boolean;
}

export const Timer: React.FC<TimerProps> = ({ initialSeconds, onUpdate, onComplete, isCompleted }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);

  useEffect(() => {
    let interval: any;
    if (status === TimerStatus.RUNNING) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Sync back to parent occasionally or on pause
  useEffect(() => {
    if (status === TimerStatus.PAUSED || status === TimerStatus.IDLE) {
      onUpdate(seconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, seconds]); // Relaxed deps to allow periodic updates if needed, but here simple sync on state change

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isCompleted) {
    return (
      <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-sm font-medium">
        <CheckCircleIcon className="w-5 h-5" />
        <span>Completed ({formatTime(seconds)})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm min-w-[60px] text-center">
        {formatTime(seconds)}
      </div>
      
      {status !== TimerStatus.RUNNING ? (
        <button 
          onClick={() => setStatus(TimerStatus.RUNNING)}
          className="p-1.5 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300 hover:bg-primary/20 transition"
          title="Start Studying"
        >
          <PlayIcon className="w-5 h-5" />
        </button>
      ) : (
        <button 
          onClick={() => setStatus(TimerStatus.PAUSED)}
          className="p-1.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 transition"
          title="Pause Timer"
        >
          <PauseIcon className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={() => {
          setStatus(TimerStatus.IDLE);
          onUpdate(seconds);
          onComplete();
        }}
        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline px-2"
      >
        Finish
      </button>
    </div>
  );
};