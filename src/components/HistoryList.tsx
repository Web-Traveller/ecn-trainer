import React, { useState } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import type { Session } from '../types';

export const HistoryList: React.FC = () => {
  const sessions = useTrainerStore((state) => state.sessions);
  const setView = useTrainerStore((state) => state.setView);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const toggleSession = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatKeyName = (code: string) => {
    if (code.startsWith('Key')) return code.slice(3);
    if (code === 'Semicolon') return ';';
    if (code === 'Quote') return "'";
    if (code === 'Comma') return ',';
    if (code === 'Period') return '.';
    return code;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Title block */}
      <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider text-terminal-text uppercase">
            [SYS_HISTORY] - ARCHIVAL PRACTICE SESSIONS
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Audit logs of completed trading simulation exercises.
          </p>
        </div>
        <button
          onClick={() => setView('dashboard')}
          className="px-3 py-1.5 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text font-mono text-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-terminal-panel border border-terminal-border p-12 text-center font-mono space-y-2">
          <p className="text-xs text-terminal-muted">NO ARCHIVES FOUND</p>
          <p className="text-[10px] text-terminal-muted/60">Launch a trainer run to persist results.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: Session) => {
            const isExpanded = expandedSessionId === session.id;
            const correctCount = session.events.filter((e) => e.correct).length;
            const totalCount = session.events.length;
            
            return (
              <div 
                key={session.id}
                className="bg-terminal-panel border border-terminal-border font-mono text-xs"
              >
                {/* Session summary header bar */}
                <div 
                  onClick={() => toggleSession(session.id)}
                  className="p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer hover:bg-terminal-border/30 transition-colors select-none"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-terminal-muted">[{formatDate(session.date)}]</span>
                    <span className="font-bold text-terminal-text uppercase">MODE: {session.mode}</span>
                    {session.priceTrainingEnabled && (
                      <span className="text-[10px] text-info-blue border border-info-blue/30 px-1 font-bold">PRICE</span>
                    )}
                    {session.examModeEnabled && (
                      <span className="text-[10px] text-warning-amber border border-warning-amber/30 px-1 font-bold">EXAM</span>
                    )}
                  </div>

                  <div className="flex gap-6 items-center">
                    <div>
                      <span className="text-[10px] text-terminal-muted mr-1.5">ACCURACY:</span>
                      <span className={`font-bold ${session.accuracy >= 90 ? 'text-success-green' : session.accuracy >= 75 ? 'text-warning-amber' : 'text-error-red'}`}>
                        {session.accuracy.toFixed(1)}% ({correctCount}/{totalCount})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-terminal-muted mr-1.5">SPEED:</span>
                      <span className="font-bold text-info-blue">{(session.averageTime / 1000).toFixed(3)}s</span>
                    </div>

                    <div className="text-terminal-muted text-[10px] font-bold">
                      {isExpanded ? '[COLLAPSE -]' : '[EXPAND +]'}
                    </div>
                  </div>
                </div>

                {/* Expanded Session Logs Details */}
                {isExpanded && (
                  <div className="border-t border-terminal-border p-4 bg-terminal-bg/50 space-y-4">
                    
                    {/* Sum of mistakes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-terminal-panel border border-terminal-border p-2 text-center">
                        <span className="text-[9px] text-terminal-muted uppercase block">Overshoots</span>
                        <span className="text-xs font-bold text-terminal-text">
                          {session.events.reduce((sum, e) => sum + e.metrics.overshoots, 0)}
                        </span>
                      </div>
                      <div className="bg-terminal-panel border border-terminal-border p-2 text-center">
                        <span className="text-[9px] text-terminal-muted uppercase block">Wraps</span>
                        <span className="text-xs font-bold text-terminal-text">
                          {session.events.reduce((sum, e) => sum + e.metrics.wraps, 0)}
                        </span>
                      </div>
                      <div className="bg-terminal-panel border border-terminal-border p-2 text-center">
                        <span className="text-[9px] text-terminal-muted uppercase block">Recoveries</span>
                        <span className="text-xs font-bold text-terminal-text">
                          {session.events.reduce((sum, e) => sum + e.metrics.recoveries, 0)}
                        </span>
                      </div>
                      <div className="bg-terminal-panel border border-terminal-border p-2 text-center">
                        <span className="text-[9px] text-terminal-muted uppercase block">Space Resets</span>
                        <span className="text-xs font-bold text-terminal-text">
                          {session.events.reduce((sum, e) => sum + e.metrics.spaceResets, 0)}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable event lists table */}
                    <div className="border border-terminal-border overflow-x-auto max-h-72">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-terminal-panel border-b border-terminal-border text-terminal-muted">
                            <th className="p-2 font-bold uppercase">ID</th>
                            <th className="p-2 font-bold uppercase">STATUS</th>
                            <th className="p-2 font-bold uppercase">PROMPT TARGET</th>
                            <th className="p-2 font-bold uppercase">KEY BUFFER</th>
                            <th className="p-2 font-bold uppercase">RESOLVED ECN</th>
                            <th className="p-2 font-bold uppercase">PRICE ENTRY</th>
                            <th className="p-2 font-bold uppercase">SPEED</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-terminal-border/25">
                          {session.events.map((event, idx) => (
                            <tr key={event.id} className="hover:bg-terminal-panel/20">
                              <td className="p-2 text-terminal-muted">#{idx + 1}</td>
                              <td className="p-2">
                                <span className={`font-black ${event.correct ? 'text-success-green' : 'text-error-red'}`}>
                                  {event.correct ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                              <td className="p-2 text-terminal-text font-bold">
                                {event.prompt.action} {event.prompt.ecn}
                              </td>
                              <td className="p-2 text-info-blue font-bold">
                                {event.keySequence.length > 0 ? `Shift+${event.keySequence.map(formatKeyName).join('+')}` : 'None'}
                              </td>
                              <td className="p-2 text-terminal-text">{event.actualEcn}</td>
                              <td className="p-2">
                                {event.expectedPriceAdjustment !== undefined ? (
                                  <span className={event.priceCorrect ? 'text-success-green font-bold' : 'text-error-red font-bold'}>
                                    Got: {event.actualPriceAdjustment !== undefined && event.actualPriceAdjustment > 0 ? '+' : ''}{event.actualPriceAdjustment}¢ 
                                    (Target: {event.expectedPriceAdjustment > 0 ? '+' : ''}{event.expectedPriceAdjustment}¢)
                                  </span>
                                ) : (
                                  <span className="text-terminal-muted/40">—</span>
                                )}
                              </td>
                              <td className="p-2 text-terminal-text">{(event.reactionTimeMs / 1000).toFixed(3)}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryList;
