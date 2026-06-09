import React, { useState } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { calculateCumulativeStats } from '../core/analytics';
import { Heatmap } from './Heatmap';

export const Analytics: React.FC = () => {
  const sessions = useTrainerStore((state) => state.sessions);
  const setView = useTrainerStore((state) => state.setView);

  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const activeSessionId = sessions.some(s => s.id === selectedSessionId)
    ? selectedSessionId
    : (sessions.length > 0 ? sessions[0].id : '');

  const selectedSession = sessions.find((s) => s.id === activeSessionId);
  const stats = selectedSession ? calculateCumulativeStats([selectedSession]) : calculateCumulativeStats([]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Title */}
      <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider text-terminal-text uppercase">
            [SYS_ANALYTICS] - RUN PERFORMANCE DEBRIEFING
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Session-level performance analytics and metrics review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-terminal-muted uppercase">Select Session:</span>
              <select
                value={activeSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
              >
                {sessions.map((s, index) => (
                  <option key={s.id} value={s.id}>
                    Session {sessions.length - index} ({formatDate(s.date)}) - {s.accuracy.toFixed(0)}% Acc
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setView('dashboard')}
            className="px-3 py-1.5 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text font-mono text-xs cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-terminal-panel border border-terminal-border p-12 text-center font-mono space-y-2">
          <p className="text-xs text-terminal-muted">NO ANALYTICS LOGGED</p>
          <p className="text-[10px] text-terminal-muted/60">Please complete at least one trainer session.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* General Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-terminal-panel border border-terminal-border p-3 font-mono">
              <span className="text-[10px] text-terminal-muted uppercase block">Overall Accuracy</span>
              <strong className={`text-xl font-bold ${stats.overallAccuracy >= 90 ? 'text-success-green' : stats.overallAccuracy >= 75 ? 'text-warning-amber' : 'text-error-red'}`}>
                {stats.overallAccuracy.toFixed(1)}%
              </strong>
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-3 font-mono">
              <span className="text-[10px] text-terminal-muted uppercase block">Average Reaction Time</span>
              <strong className="text-xl font-bold text-info-blue">
                {(stats.averageReactionTimeMs / 1000).toFixed(3)}s
              </strong>
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-3 font-mono">
              <span className="text-[10px] text-terminal-muted uppercase block">Speed Extremes (Min/Max)</span>
              <strong className="text-sm font-bold text-terminal-text block mt-1">
                {(stats.fastestTimeMs / 1000).toFixed(3)}s / {(stats.slowestTimeMs / 1000).toFixed(2)}s
              </strong>
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-3 font-mono">
              <span className="text-[10px] text-terminal-muted uppercase block">Total Overhead Strokes</span>
              <strong className="text-xs font-bold text-terminal-text block mt-1">
                Resets: {stats.spaceResets} | Overshoots: {stats.overshoots}
              </strong>
              {selectedSession && selectedSession.priceTrainingEnabled && selectedSession.priceAccuracy !== undefined && (
                <span className="text-[10px] text-terminal-muted block mt-1">
                  Price Accuracy: <span className="font-bold text-success-green">{selectedSession.priceAccuracy.toFixed(1)}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Session Setup & Configuration Audit Panel */}
          {selectedSession && (
            <div className="bg-terminal-panel border border-terminal-border p-4 space-y-3 font-mono text-xs animate-fadeIn">
              <h3 className="text-xs font-bold text-terminal-text uppercase tracking-wider border-b border-terminal-border pb-2">
                SESSION SETUP & CONFIGURATION AUDIT
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Total Session Time</span>
                  <strong className="text-terminal-text">
                    {selectedSession.sessionDurationMs 
                      ? `${(selectedSession.sessionDurationMs / 1000).toFixed(1)}s` 
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Prompt Count</span>
                  <strong className="text-terminal-text">
                    {selectedSession.events.length} prompts
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Target ECN Mode</span>
                  <strong className={selectedSession.targetEcnModeEnabled ? 'text-info-blue' : 'text-terminal-muted'}>
                    {selectedSession.targetEcnModeEnabled 
                      ? `ENABLED (${selectedSession.targetEcns && selectedSession.targetEcns.length > 0 ? selectedSession.targetEcns.join(', ') : (selectedSession.targetEcn || 'NSDQ')})` 
                      : 'DISABLED'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Price Training Mode</span>
                  <strong className={selectedSession.priceTrainingEnabled ? 'text-success-green' : 'text-terminal-muted'}>
                    {selectedSession.priceTrainingEnabled ? 'ENABLED' : 'DISABLED'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Practice Mode Type</span>
                  <strong className="text-terminal-text uppercase">
                    {selectedSession.practiceModeType === 'time_limit' ? 'Time-Limit (Speed)' : 'Stable (Accuracy)'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Pacing Rules</span>
                  <span className="text-[11px] text-terminal-text block mt-0.5">
                    {selectedSession.practiceModeType === 'time_limit' ? (
                      <>
                        Init Limit: {((selectedSession.initialTimeLimitMs ?? 2000) / 1000).toFixed(1)}s | 
                        Decay: {selectedSession.speedDecayMs ?? 50}ms | 
                        Penalty: {selectedSession.speedPenaltyMs ?? 100}ms
                      </>
                    ) : (
                      'N/A (Stable Mode)'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Smart Learning</span>
                  <strong className={selectedSession.smartLearningEnabled ? 'text-success-green' : 'text-terminal-muted'}>
                    {selectedSession.smartLearningEnabled ? 'ENABLED' : 'DISABLED'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-terminal-muted uppercase block">Repetition Threshold</span>
                  <strong className="text-terminal-text">
                    {selectedSession.repetitionThreshold ? `${selectedSession.repetitionThreshold}x` : '2x'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Grid maps / heat map */}
          <div className="bg-terminal-panel border border-terminal-border p-4">
            <Heatmap ecnMetrics={stats.ecnMetrics} />
          </div>

          {/* Tables layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* ECN Metrics Table */}
            <div className="lg:col-span-8 bg-terminal-panel border border-terminal-border p-4 space-y-3">
              <h3 className="text-xs font-bold font-mono text-terminal-text uppercase tracking-wider border-b border-terminal-border pb-2">
                ECN PERFORMANCE AUDIT MATRIX
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-terminal-border text-terminal-muted text-[10px]">
                      <th className="py-1">ECN</th>
                      <th className="py-1">ACCURACY</th>
                      <th className="py-1">AVG SPEED</th>
                      <th className="py-1">ATTEMPTS</th>
                      <th className="py-1 text-center">SPACE RESETS</th>
                      <th className="py-1 text-center">OVERSHOOTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terminal-border/30">
                    {Object.values(stats.ecnMetrics)
                      .sort((a, b) => b.attempts - a.attempts)
                      .map((ecnM) => (
                        <tr key={ecnM.ecn} className="hover:bg-terminal-bg/50">
                          <td className="py-1.5 font-bold text-terminal-text">{ecnM.ecn}</td>
                          <td className={`py-1.5 font-bold ${ecnM.accuracy >= 90 ? 'text-success-green' : ecnM.accuracy >= 75 ? 'text-warning-amber' : 'text-error-red'}`}>
                            {ecnM.accuracy.toFixed(1)}%
                          </td>
                          <td className="py-1.5 text-terminal-text">{(ecnM.averageTimeMs / 1000).toFixed(3)}s</td>
                          <td className="py-1.5 text-terminal-muted">{ecnM.attempts}x</td>
                          <td className="py-1.5 text-center text-terminal-text">{ecnM.resets}</td>
                          <td className="py-1.5 text-center text-terminal-text">{ecnM.overshoots}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Switch Delay & Mistakes lists */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Switch delays transitions */}
              <div className="bg-terminal-panel border border-terminal-border p-4 space-y-3">
                <h3 className="text-xs font-bold font-mono text-terminal-text uppercase tracking-wider border-b border-terminal-border pb-2">
                  BUY/SELL SWITCH LATENCY
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-terminal-border text-terminal-muted text-[10px]">
                        <th className="py-1">TRANSITION</th>
                        <th className="py-1">TRIALS</th>
                        <th className="py-1">AVG SPEED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-terminal-border/30">
                      <tr>
                        <td className="py-1.5 font-bold text-info-blue">BUY → BUY</td>
                        <td className="py-1.5 text-terminal-muted">{stats.switchAnalysis.buyBuy.count}x</td>
                        <td className="py-1.5 text-terminal-text">{stats.switchAnalysis.buyBuy.avgTimeMs > 0 ? `${(stats.switchAnalysis.buyBuy.avgTimeMs / 1000).toFixed(3)}s` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-warning-amber">BUY → SELL</td>
                        <td className="py-1.5 text-terminal-muted">{stats.switchAnalysis.buySell.count}x</td>
                        <td className="py-1.5 text-terminal-text">{stats.switchAnalysis.buySell.avgTimeMs > 0 ? `${(stats.switchAnalysis.buySell.avgTimeMs / 1000).toFixed(3)}s` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-warning-amber">SELL → BUY</td>
                        <td className="py-1.5 text-terminal-muted">{stats.switchAnalysis.sellBuy.count}x</td>
                        <td className="py-1.5 text-terminal-text">{stats.switchAnalysis.sellBuy.avgTimeMs > 0 ? `${(stats.switchAnalysis.sellBuy.avgTimeMs / 1000).toFixed(3)}s` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-info-blue">SELL → SELL</td>
                        <td className="py-1.5 text-terminal-muted">{stats.switchAnalysis.sellSell.count}x</td>
                        <td className="py-1.5 text-terminal-text">{stats.switchAnalysis.sellSell.avgTimeMs > 0 ? `${(stats.switchAnalysis.sellSell.avgTimeMs / 1000).toFixed(3)}s` : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mismatch matrix */}
              <div className="bg-terminal-panel border border-terminal-border p-4 space-y-3">
                <h3 className="text-xs font-bold font-mono text-terminal-text uppercase tracking-wider border-b border-terminal-border pb-2">
                  TYPING MISMATCH MATRIX
                </h3>
                
                {stats.commonMistakes.length === 0 ? (
                  <p className="text-[10px] font-mono text-terminal-muted/60 italic text-center py-4">
                    NO ROUTE MISMATCHES LOGGED
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {stats.commonMistakes.map((mistake, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-terminal-bg border border-terminal-border p-2 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-terminal-muted font-bold">{mistake.expected}</span>
                          <span className="text-terminal-muted/40">→</span>
                          <span className="text-error-red font-bold">{mistake.actual}</span>
                        </div>
                        <span className="text-[10px] text-terminal-muted uppercase">
                          {mistake.count} hits
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
