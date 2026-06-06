import React from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { calculateCumulativeStats } from '../core/analytics';
import { Heatmap } from './Heatmap';

export const Dashboard: React.FC = () => {
  const { sessions, setView } = useTrainerStore();
  const stats = calculateCumulativeStats(sessions.length > 0 ? [sessions[0]] : []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Title */}
      <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-mono">
        <div>
          <h2 className="text-base font-bold tracking-wider text-terminal-text uppercase">
            [SYS_CONSOLE] - TRADING TERMINAL HOMEPAGE
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Monitor training summaries, accuracy metrics, and ECN accuracy heatmap.
          </p>
        </div>
        <button
          onClick={() => setView('trainer')}
          className="px-4 py-2 bg-success-green hover:bg-success-green/90 text-terminal-bg font-black text-xs cursor-pointer border-0 uppercase"
        >
          Open execution arena
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cumulative Stats Chamber */}
        <div className="lg:col-span-4 bg-terminal-panel border border-terminal-border p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              MOST RECENT SESSION SNAPSHOT
            </h3>

            {sessions.length === 0 ? (
              <div className="py-12 text-center font-mono space-y-1">
                <p className="text-xs text-terminal-muted">NO METRICS LOADED</p>
                <p className="text-[10px] text-terminal-muted/60">Launch a trainer run to populate logs.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-terminal-border/40">
                  <span className="text-terminal-muted">Completed Sessions:</span>
                  <span className="text-terminal-text font-bold">{sessions.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border/40">
                  <span className="text-terminal-muted">Session Trials:</span>
                  <span className="text-terminal-text font-bold">{stats.totalPrompts}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border/40">
                  <span className="text-terminal-muted">Session Avg Speed:</span>
                  <span className="text-info-blue font-bold">{(stats.averageReactionTimeMs / 1000).toFixed(3)}s</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-terminal-muted">Session Accuracy:</span>
                  <span className={`font-bold text-sm ${stats.overallAccuracy >= 90 ? 'text-success-green' : stats.overallAccuracy >= 75 ? 'text-warning-amber' : 'text-error-red'}`}>
                    {stats.overallAccuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <button
              onClick={() => setView('settings')}
              className="w-full py-2 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text font-mono text-xs uppercase cursor-pointer"
            >
              Configure Key Bindings & Preferences
            </button>
          </div>
        </div>

        {/* Heatmap Strength Matrix Column */}
        <div className="lg:col-span-8 bg-terminal-panel border border-terminal-border p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-terminal-border pb-2">
            <h3 className="text-xs font-bold font-mono text-terminal-text uppercase tracking-wide">
              MOST RECENT SESSION ECN MATRIX
            </h3>
            <span className="text-[10px] font-mono text-terminal-muted">SESSION ACCURACY PROFILE</span>
          </div>
          <p className="text-[10px] font-mono text-terminal-muted">
            The color intensity illustrates accuracy for physical keys mapped to each target ECN destination in the most recent session. Darker squares highlight accuracy gaps.
          </p>
          <div className="pt-2">
            <Heatmap ecnMetrics={stats.ecnMetrics} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
