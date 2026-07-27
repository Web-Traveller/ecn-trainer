import React, { useState, useEffect, useRef } from "react";
import { useTrainerStore } from "./store/trainerStore";
import { Dashboard } from "./components/Dashboard";
import { Trainer } from "./components/Trainer";
import { Analytics } from "./components/Analytics";
import { Settings } from "./components/Settings";
import { ConfettiBurst } from "./components/ConfettiBurst";
import {
  FiGithub,
  FiLinkedin,
  FiTerminal,
  FiX,
  FiAward,
  FiStar,
} from "react-icons/fi";

const GITHUB_URL = "https://github.com/AjinkyaK03";
const LINKEDIN_URL = "https://linkedin.com/in/ajinkya-kadam-5829b5245";

// 7 days in milliseconds
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const App: React.FC = () => {
  const currentView = useTrainerStore((state) => state.currentView);
  const sessionState = useTrainerStore((state) => state.sessionState);
  const setView = useTrainerStore((state) => state.setView);

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Check if golden title is currently active within 7-day expiration window
  const [goldenTitle, setGoldenTitle] = useState(() => {
    const expiresAt = localStorage.getItem("ecn_golden_title_expires");
    if (expiresAt) {
      const expTime = parseInt(expiresAt, 10);
      return !isNaN(expTime) && Date.now() < expTime;
    }
    return false;
  });

  const keyBufferRef = useRef<string>("");

  // Name Hotkey Signature Listener: Typing "AJINKYA" triggers Confetti + 7-Day Golden Crown Title!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing inside inputs or textareas
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT")
      ) {
        return;
      }

      // Shortcut Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        triggerSignatureEffect();
        return;
      }

      // Sequence buffer check for "AJINKYA"
      const key = e.key.toUpperCase();
      if (key.length === 1 && key >= "A" && key <= "Z") {
        keyBufferRef.current = (keyBufferRef.current + key).slice(-7);
        if (keyBufferRef.current === "AJINKYA") {
          triggerSignatureEffect();
          keyBufferRef.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const triggerSignatureEffect = () => {
    setGoldenTitle(true);
    setTriggerConfetti(true);

    // Save 7-day expiration timestamp to localStorage
    const expiresAt = Date.now() + SEVEN_DAYS_MS;
    localStorage.setItem("ecn_golden_title_expires", String(expiresAt));

    // Confetti burst lasts 4 seconds
    setTimeout(() => {
      setTriggerConfetti(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col font-sans selection:bg-terminal-border selection:text-terminal-text relative">
      {/* Golden Confetti Particle Burst (4 Seconds) */}
      {triggerConfetti && <ConfettiBurst durationMs={4000} />}

      {/* Top Menu / Status Bar */}
      <header className="border-b border-terminal-border bg-terminal-panel">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-6">
            <span className="font-bold font-mono tracking-wider flex items-center gap-1.5 select-none">
              {goldenTitle ? (
                <span className="text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                  👑 ECN EXECUTION TERMINAL v2.0
                </span>
              ) : (
                <span className="text-terminal-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-info-blue inline-block"></span>
                  ECN EXECUTION TERMINAL v2.0
                </span>
              )}
            </span>

            <nav className="flex items-center border-l border-terminal-border pl-6 gap-2">
              <button
                onClick={() => setView("dashboard")}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${
                  currentView === "dashboard"
                    ? "bg-terminal-border border-terminal-border text-white font-bold"
                    : "border-transparent text-terminal-muted"
                }`}
              >
                [01] Dashboard
              </button>
              <button
                onClick={() => setView("trainer")}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${
                  currentView === "trainer"
                    ? "bg-terminal-border border-terminal-border text-white font-bold"
                    : "border-transparent text-terminal-muted"
                }`}
              >
                [02] Trainer
              </button>
              <button
                onClick={() => setView("analytics")}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${
                  currentView === "analytics"
                    ? "bg-terminal-border border-terminal-border text-white font-bold"
                    : "border-transparent text-terminal-muted"
                }`}
              >
                [03] Analytics
              </button>
              <button
                onClick={() => setView("settings")}
                className={`px-3 py-1 font-mono uppercase tracking-tight hover:bg-terminal-border/40 transition-colors cursor-pointer border ${
                  currentView === "settings"
                    ? "bg-terminal-border border-terminal-border text-white font-bold"
                    : "border-transparent text-terminal-muted"
                }`}
              >
                [05] Settings
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            {sessionState === "RUNNING" && (
              <div className="flex items-center gap-1.5 text-success-green font-bold">
                <span className="w-2 h-2 bg-success-green animate-pulse rounded-none"></span>
                SIMULATOR RUNNING
              </div>
            )}
            {sessionState === "PAUSED" && (
              <div className="flex items-center gap-1.5 text-warning-amber font-bold">
                <span className="w-2 h-2 bg-warning-amber rounded-none"></span>
                SIMULATOR PAUSED
              </div>
            )}
            {sessionState === "IDLE" && (
              <div className="flex items-center gap-1.5 text-terminal-muted">
                <span className="w-2 h-2 bg-terminal-border rounded-none"></span>
                TERMINAL READY
              </div>
            )}
            {sessionState === "COMPLETED" && (
              <div className="flex items-center gap-1.5 text-success-green font-bold">
                <span className="w-2 h-2 bg-success-green rounded-none"></span>
                SESSION COMPLETED
              </div>
            )}
            {sessionState === "TERMINATED" && (
              <div className="flex items-center gap-1.5 text-error-red font-bold">
                <span className="w-2 h-2 bg-error-red rounded-none"></span>
                SESSION TERMINATED
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Panel Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-start">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "trainer" && <Trainer />}
        {currentView === "analytics" && <Analytics />}
        {currentView === "settings" && <Settings />}
      </main>

      {/* Developer Dedication / About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-terminal-bg/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-terminal-panel border border-terminal-border max-w-lg w-full p-6 space-y-5 font-mono shadow-2xl relative">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-terminal-muted hover:text-terminal-text p-1"
            >
              <FiX className="text-base" />
            </button>

            <div className="flex items-center gap-3 border-b border-terminal-border pb-3">
              <div className="w-10 h-10 bg-info-blue/10 border border-info-blue/30 text-info-blue flex items-center justify-center text-xl">
                <FiAward />
              </div>
              <div>
                <h3 className="text-sm font-bold text-terminal-text uppercase tracking-wider">
                  ECN TRAINER PRO — DESK EDITION
                </h3>
                <span className="text-[10px] text-info-blue font-bold">
                  CREATED BY AJINKYA KADAM
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-terminal-text leading-relaxed">
              <p>
                This application was custom engineered by{" "}
                <strong className="text-white">Ajinkya Kadam</strong> to help
                the trading desk build razor-sharp muscle memory, hotkey routing
                speed, and order execution precision.
              </p>
              <p className="text-terminal-muted italic border-l-2 border-info-blue pl-3 py-1">
                "Execution excellence is not an accident—it's built one keypress
                at a time."
              </p>
              <p className="text-[11px] text-amber-400 pt-1 flex items-center gap-1.5">
                <FiStar />
                <span>
                  Tip: Type <strong>AJINKYA</strong> anywhere to trigger golden confetti & 7-day crown title!
                </span>
              </p>
            </div>

            {/* Social Links */}
            <div className="pt-3 border-t border-terminal-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[10px] text-terminal-muted uppercase font-bold">
                Connect & Code:
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 bg-terminal-bg border border-terminal-border hover:border-info-blue text-terminal-text hover:text-info-blue transition-colors font-bold text-[11px]"
                >
                  <FiGithub />
                  <span>GitHub</span>
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 bg-terminal-bg border border-terminal-border hover:border-info-blue text-terminal-text hover:text-info-blue transition-colors font-bold text-[11px]"
                >
                  <FiLinkedin />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Terminal Status Ticker */}
      <footer className="border-t border-terminal-border bg-terminal-panel">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-[10px] font-mono text-terminal-muted">
          <div>SYS: ACTIVE | ENGINE: DYNAMIC_ROUTING | STORE: LOCALPERSIST</div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAboutModal(true)}
              className="hover:text-info-blue transition-colors cursor-pointer flex items-center gap-1 font-bold text-terminal-text"
            >
              <FiTerminal className="text-info-blue" />
              <span>Built by Ajinkya</span>
            </button>

            <span className="text-terminal-border">|</span>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal-text transition-colors flex items-center gap-1"
              title="GitHub Profile"
            >
              <FiGithub />
              <span>GitHub</span>
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal-text transition-colors flex items-center gap-1"
              title="LinkedIn Profile"
            >
              <FiLinkedin />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
