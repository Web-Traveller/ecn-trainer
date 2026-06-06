import React from 'react';
import type { ECNMetrics } from '../core/analytics';
import { ALL_ECNS } from '../core/learning';

interface HeatmapProps {
  ecnMetrics: Record<string, ECNMetrics>;
}

export const Heatmap: React.FC<HeatmapProps> = ({ ecnMetrics }) => {
  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center border-b border-terminal-border pb-2">
        <h3 className="text-xs font-bold text-terminal-text uppercase tracking-wider">
          ECN Route Strength Grid
        </h3>
        {/* Legend */}
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-success-green/20 border border-success-green/40" />
            <span className="text-terminal-muted">≥ 90%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-warning-amber/20 border border-warning-amber/40" />
            <span className="text-terminal-muted">75% - 89%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-error-red/20 border border-error-red/40" />
            <span className="text-terminal-muted">&lt; 75%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-terminal-bg border border-terminal-border" />
            <span className="text-terminal-muted">Untested</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {ALL_ECNS.map((ecn) => {
          const metric = ecnMetrics[ecn];
          const hasData = metric && metric.attempts > 0;
          
          let colorClass = 'bg-terminal-bg text-terminal-muted border-terminal-border';
          if (hasData) {
            const acc = metric.accuracy;
            if (acc >= 90) {
              colorClass = 'bg-success-green/10 text-success-green border-success-green/30 hover:bg-success-green/15';
            } else if (acc >= 75) {
              colorClass = 'bg-warning-amber/10 text-warning-amber border-warning-amber/30 hover:bg-warning-amber/15';
            } else {
              colorClass = 'bg-error-red/10 text-error-red border-error-red/30 hover:bg-error-red/15';
            }
          }

          return (
            <div
              key={ecn}
              className={`p-3 border flex flex-col justify-between min-h-[80px] transition-all duration-200 ${colorClass}`}
            >
              <span className="text-xs font-bold text-terminal-text">{ecn}</span>
              <div className="mt-2 text-[10px] leading-none">
                {hasData ? (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className="font-bold">{metric.accuracy.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span>{(metric.averageTimeMs / 1000).toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hits:</span>
                      <span>{metric.attempts}x</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-terminal-muted/40 block pt-3 italic">NO TRIALS</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Heatmap;
