import React from 'react';
import { useTrainerStore } from './store/trainerStore';
import { Dashboard } from './components/Dashboard';
import { Trainer } from './components/Trainer';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';

export const App: React.FC = () => {
  const currentView = useTrainerStore((state) => state.currentView);
  const sessionState = useTrainerStore((state) => state.sessionState);
  const setView = useTrainerStore((state) => state.setView);



  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col font-sans selection:bg-terminal-border selection:text-terminal-text">
      {/* Top Menu / Status Bar */}
      <header className="border-b border-terminal-border bg-terminal-panel">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-6">
            <span className="font-bold font-mono tracking-wider text-terminal-text flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-info-blue inline-block"></span>
              ECN EXECUTION TERMINAL v2.0
            </span>
            <nav className="flex items-center border-l border-terminal-border pl-6 gap-2">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${currentView === 'dashboard' ? 'bg-terminal-border border-terminal-border text-white' : 'border-transparent text-terminal-muted'
                  }`}
              >
                [01] Dashboard
              </button>
              <button
                onClick={() => setView('trainer')}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${currentView === 'trainer' ? 'bg-terminal-border border-terminal-border text-white' : 'border-transparent text-terminal-muted'
                  }`}
              >
                [02] Trainer
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${currentView === 'analytics' ? 'bg-terminal-border border-terminal-border text-white' : 'border-transparent text-terminal-muted'
                  }`}
              >
                [03] Analytics
              </button>
              {/* [04] History hidden temporarily */}
              <button
                onClick={() => setView('settings')}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${currentView === 'settings' ? 'bg-terminal-border border-terminal-border text-white' : 'border-transparent text-terminal-muted'
                  }`}
              >
                [05] Settings
              </button>
              {/* [06] Docs hidden temporarily */}
            </nav>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            {sessionState === 'RUNNING' && (
              <div className="flex items-center gap-1.5 text-success-green">
                <span className="w-2 h-2 bg-success-green animate-pulse rounded-none"></span>
                SIMULATOR RUNNING
              </div>
            )}
            {sessionState === 'PAUSED' && (
              <div className="flex items-center gap-1.5 text-warning-amber">
                <span className="w-2 h-2 bg-warning-amber rounded-none"></span>
                SIMULATOR PAUSED
              </div>
            )}
            {sessionState === 'IDLE' && (
              <div className="flex items-center gap-1.5 text-terminal-muted">
                <span className="w-2 h-2 bg-terminal-border rounded-none"></span>
                TERMINAL READY
              </div>
            )}
            {sessionState === 'COMPLETED' && (
              <div className="flex items-center gap-1.5 text-success-green">
                <span className="w-2 h-2 bg-success-green rounded-none"></span>
                SESSION COMPLETED
              </div>
            )}
            {sessionState === 'TERMINATED' && (
              <div className="flex items-center gap-1.5 text-error-red">
                <span className="w-2 h-2 bg-error-red rounded-none"></span>
                SESSION TERMINATED
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Panel Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-start">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'trainer' && <Trainer />}
        {currentView === 'analytics' && <Analytics />}
        {currentView === 'settings' && <Settings />}
      </main>

      {/* Bottom Terminal Status Ticker */}
      <footer className="border-t border-terminal-border bg-terminal-panel">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-terminal-muted">
          <div>
            SYS: ACTIVE | LEARNING_ENGINE: ON | STORE: LOCALPERSIST
          </div>
          <div className="flex gap-4">
            <span>Built By AJ with Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
