/**
 * Combat Log Display Component
 * 8-bit retro style combat log with CRT effect
 */

import React, { useEffect, useRef } from 'react';
import { CombatLog } from '../types';

interface CombatLogDisplayProps {
  logs: CombatLog[];
}

export const CombatLogDisplay: React.FC<CombatLogDisplayProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Get text color based on log type
  const getTextColor = (type: CombatLog['type']) => {
    switch (type) {
      case 'victory':
        return 'text-[#FFD700]'; // Gold
      case 'defeat':
        return 'text-[#FF4444]'; // Red
      case 'warning':
        return 'text-[#FFA500]'; // Orange
      case 'damage':
        return 'text-[#FF9FAA]'; // Pink
      case 'action':
        return 'text-[#00BFFF]'; // Light blue
      case 'system':
      default:
        return 'text-[#00FF00]'; // Green
    }
  };

  return (
    <div className="relative bg-black/90 border-2 md:border-4 border-[#4A4A4A] rounded-lg p-2.5 md:p-3 h-full overflow-hidden shadow-2xl">
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.03)_50%)] bg-[length:100%_4px] animate-scan" />
      </div>

      {/* CRT Glow Effect */}
      <div className="absolute inset-0 pointer-events-none rounded-lg shadow-[inset_0_0_30px_rgba(0,255,0,0.2)]" />

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none rounded-lg bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Log Content */}
      <div
        ref={containerRef}
        className="relative h-full overflow-y-auto space-y-2 text-sm font-mono custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#00FF00 transparent',
        }}
      >
        {(Array.isArray(logs) ? logs.filter((log): log is CombatLog => !!log) : []).map(log => (
          <div
            key={log.id}
            className={`flex items-start gap-2 ${getTextColor(log.type)}`}
          >
            <span className="text-[#888] shrink-0 font-bold">[T{log.turn}]</span>
            <span className="break-words leading-relaxed">{log.text}</span>
          </div>
        ))}
      </div>

      {/* Corner Decorations (8-bit style) */}
      <div className="absolute top-2 left-2 w-2 h-2 bg-[#00FF00] opacity-50" />
      <div className="absolute top-2 right-2 w-2 h-2 bg-[#00FF00] opacity-50" />
      <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#00FF00] opacity-50" />
      <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#00FF00] opacity-50" />
    </div>
  );
};
