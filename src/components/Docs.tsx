import React from 'react';
import { useTrainerStore } from '../store/trainerStore';

export const Docs: React.FC = () => {
  const setView = useTrainerStore((state) => state.setView);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Page Title */}
      <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-mono">
        <div>
          <h2 className="text-base font-bold tracking-wider text-terminal-text uppercase">
            [SYS_DOCS] - REFERENCE MANUAL & SPECIFICATIONS
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Operational guide, mapping matrices, and system overview.
          </p>
        </div>
        <button
          onClick={() => setView('dashboard')}
          className="px-3 py-1.5 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text font-mono text-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
        {/* Left column: Quick Contents */}
        <div className="lg:col-span-3 bg-terminal-panel border border-terminal-border p-4 h-fit space-y-3">
          <h3 className="text-[10px] font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wide">
            DOCUMENT INDEX
          </h3>
          <ul className="space-y-2 text-terminal-muted">
            <li>
              <a href="#intro" className="hover:text-info-blue transition-colors block">
                1. INTRODUCTION
              </a>
            </li>
            <li>
              <a href="#modes" className="hover:text-info-blue transition-colors block">
                2. TRAINING MODES
              </a>
            </li>
            <li>
              <a href="#routing" className="hover:text-info-blue transition-colors block">
                3. ECN ROUTING SYSTEM
              </a>
            </li>
            <li>
              <a href="#price" className="hover:text-info-blue transition-colors block">
                4. PRICE TRAINING
              </a>
            </li>
            <li>
              <a href="#flow" className="hover:text-info-blue transition-colors block">
                5. SESSION FLOW
              </a>
            </li>
            <li>
              <a href="#controls" className="hover:text-info-blue transition-colors block">
                6. CONTROL BINDINGS
              </a>
            </li>
            <li>
              <a href="#analytics" className="hover:text-info-blue transition-colors block">
                7. ANALYTICS DEFINITION
              </a>
            </li>
            <li>
              <a href="#mistakes" className="hover:text-info-blue transition-colors block">
                8. USER ERRORS & MISTAKES
              </a>
            </li>
          </ul>
        </div>

        {/* Right column: Main Docs Body */}
        <div className="lg:col-span-9 bg-terminal-panel border border-terminal-border p-6 space-y-8 max-h-[800px] overflow-y-auto scrollbar-thin">
          
          {/* Section 1: Introduction */}
          <section id="intro" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              1. INTRODUCTION
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-2">
              <p>
                This application is a specialized ECN execution training simulator designed specifically for professional equities traders. 
                The primary purpose is to build muscle memory for keyboard-first order routing, optimizing both response latency and physical routing accuracy.
              </p>
              <p>
                By simulating rapid ECN routing prompts under customizable settings, traders learn to associate specific target destinations with keypress combinations, simulating live order execution environment conditions.
              </p>
            </div>
          </section>

          {/* Section 2: Training Modes */}
          <section id="modes" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              2. TRAINING MODES
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-3">
              <p>
                The simulator supports three training modes configures in the Simulator Controls panel:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-terminal-bg border border-terminal-border p-2.5">
                  <strong className="text-info-blue block mb-1">BUY ONLY</strong>
                  Renders only BUY order prompts. Commands map exclusively to BUY side key bindings.
                </div>
                <div className="bg-terminal-bg border border-terminal-border p-2.5">
                  <strong className="text-error-red block mb-1">SELL ONLY</strong>
                  Renders only SELL order prompts. Commands map exclusively to SELL side key bindings.
                </div>
                <div className="bg-terminal-bg border border-terminal-border p-2.5">
                  <strong className="text-warning-amber block mb-1">MIXED</strong>
                  Randomly interleaves BUY and SELL order prompts. Demands high spatial awareness to shift between BUY/SELL keys.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: ECN Routing System */}
          <section id="routing" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              3. ECN ROUTING SYSTEM
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-3">
              <p>
                To achieve rapid routing without requiring dozens of keybindings, ECNs are mapped into five physical key groups. 
                Repeatedly pressing a group's bound key cycles through ECNs in that group.
              </p>
              <p className="font-bold text-terminal-text">
                CRITICAL RULE: Holding the SHIFT key is strictly required for all routing actions. Keys pressed without Shift are ignored by the simulator.
              </p>
              
              {/* Mapping Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse border border-terminal-border">
                  <thead>
                    <tr className="bg-terminal-bg border-b border-terminal-border text-terminal-text">
                      <th className="p-2 border border-terminal-border text-left">GROUP</th>
                      <th className="p-2 border border-terminal-border text-left">ECN CYCLING LIST</th>
                      <th className="p-2 border border-terminal-border text-left">DEFAULT KEYS (BUY / SELL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-terminal-border/40">
                      <td className="p-2 border border-terminal-border font-bold text-terminal-text">Group A</td>
                      <td className="p-2 border border-terminal-border">NSDQ → ARCA → EDGX → EDGA</td>
                      <td className="p-2 border border-terminal-border">Shift+A / Shift+L</td>
                    </tr>
                    <tr className="border-b border-terminal-border/40">
                      <td className="p-2 border border-terminal-border font-bold text-terminal-text">Group S</td>
                      <td className="p-2 border border-terminal-border">NYSE → NSEX → IEX</td>
                      <td className="p-2 border border-terminal-border">Shift+S / Shift+Semicolon (;)</td>
                    </tr>
                    <tr className="border-b border-terminal-border/40">
                      <td className="p-2 border border-terminal-border font-bold text-terminal-text">Group D</td>
                      <td className="p-2 border border-terminal-border">CHX → PHLX</td>
                      <td className="p-2 border border-terminal-border">Shift+D / Shift+Quote (')</td>
                    </tr>
                    <tr className="border-b border-terminal-border/40">
                      <td className="p-2 border border-terminal-border font-bold text-terminal-text">Group Z</td>
                      <td className="p-2 border border-terminal-border">MEMX → MIAX → AMEX</td>
                      <td className="p-2 border border-terminal-border">Shift+Z / Shift+Comma (,)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-terminal-border font-bold text-terminal-text">Group X</td>
                      <td className="p-2 border border-terminal-border">BATS → BATY → BOSX</td>
                      <td className="p-2 border border-terminal-border">Shift+X / Shift+Period (.)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Examples */}
              <div className="bg-terminal-bg border border-terminal-border p-3 space-y-1">
                <span className="font-bold text-terminal-text uppercase block text-[10px]">CYCLED press examples:</span>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>
                    <span className="text-info-blue font-bold">Shift + A + A</span> = Targets <span className="font-bold text-terminal-text">ARCA</span> (2nd ECN in Group A, buy side)
                  </li>
                  <li>
                    <span className="text-warning-amber font-bold">Shift + L + L</span> = Targets <span className="font-bold text-terminal-text">ARCA</span> (2nd ECN in Group A, sell side)
                  </li>
                  <li>
                    <span className="text-info-blue font-bold">Shift + S + S + S</span> = Targets <span className="font-bold text-terminal-text">IEX</span> (3rd ECN in Group S, buy side)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Price Training */}
          <section id="price" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              4. PRICE TRAINING
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-2">
              <p>
                When Price Training is enabled, prompts contain price adjustment commands to simulate placing limit orders away from the current market price.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-info-blue">BUY commands</strong> expect a positive price adjustment (<span className="text-success-green">+¢</span>).
                </li>
                <li>
                  <strong className="text-error-red">SELL commands</strong> expect a negative price adjustment (<span className="text-error-red">-¢</span>).
                </li>
              </ul>
              <p>
                For example:
                <br />
                <span className="text-terminal-text font-bold">BUY ARCA +3¢</span>: Hold Shift, press KeyA two times, adjust price delta to +3, then submit.
                <br />
                <span className="text-terminal-text font-bold">SELL NSDQ -2¢</span>: Hold Shift, press KeyL one time, adjust price delta to -2, then submit.
              </p>
              <p>
                The maximum offset generated in price training is governed by the <span className="text-terminal-text font-bold">Max Price Adjustment</span> setting (available in Settings and the pre-session panel), which limits target prices between 1¢, 3¢, 5¢, or 10¢. Small, realistic random values are generated within the limit.
              </p>
            </div>
          </section>

          {/* Section 5: Session Flow */}
          <section id="flow" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              5. SESSION FLOW
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-2">
              <p>
                Sessions follow a strict, isolated lifecycle:
              </p>
              <div className="bg-terminal-bg border border-terminal-border p-3 font-mono text-center text-[10px] text-terminal-muted flex justify-between items-center gap-2">
                <span className="font-bold text-terminal-text">IDLE</span>
                <span>→</span>
                <span className="font-bold text-terminal-text">RUNNING</span>
                <span>→</span>
                <span className="font-bold text-terminal-text">PAUSED</span>
                <span>→</span>
                <span className="font-bold text-terminal-text">COMPLETED</span>
                <span>or</span>
                <span className="font-bold text-terminal-text">TERMINATED</span>
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>IDLE:</strong> Choose config preferences (mode, counts, focus ECNs, price bounds). Press START to begin.
                </li>
                <li>
                  <strong>RUNNING:</strong> Prompt is displayed. Live response timer ticks. Inputs are evaluated dynamically.
                </li>
                <li>
                  <strong>PAUSED:</strong> Clock freezes. Inputs are ignored. Allows taking breaks without spoiling latency averages.
                </li>
                <li>
                  <strong>COMPLETED:</strong> Session ends automatically once the configured prompt count (e.g. 10, 25, 50, 100) is fulfilled. Displays a detailed debrief.
                </li>
                <li>
                  <strong>TERMINATED:</strong> Triggered if the session is manually ended early. Events are still logged up to that point.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6: Controls */}
          <section id="controls" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              6. CONTROL BINDINGS
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-3">
              <p>
                Traders interact with the simulator exclusively through defined keyboard inputs:
              </p>
              
              {/* Controls List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-terminal-text border-b border-terminal-border/30 pb-1 uppercase tracking-wide">
                    ROUTING & CYCLE
                  </h4>
                  <ul className="space-y-1.5">
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">Shift + [A/S/D/Z/X]</span>
                      <span className="ml-2">Cycle/Route BUY ECNs</span>
                    </li>
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">Shift + [L/;/'/,/.]</span>
                      <span className="ml-2">Cycle/Route SELL ECNs</span>
                    </li>
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">Spacebar</span>
                      <span className="ml-2">Reset current prompt inputs</span>
                    </li>
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">Escape</span>
                      <span className="ml-2">Clear sequence back to empty</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-terminal-text border-b border-terminal-border/30 pb-1 uppercase tracking-wide">
                    SUBMIT & ADJUST
                  </h4>
                  <ul className="space-y-1.5">
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">Enter</span>
                      <span className="ml-2">Submit answer (default mode)</span>
                    </li>
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">← / → (Arrow Keys)</span>
                      <span className="ml-2">Adjust price delta by ±1¢</span>
                    </li>
                    <li>
                      <span className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text font-bold">Shift + ← / →</span>
                      <span className="ml-2">Adjust price delta by ±5¢</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Analytics */}
          <section id="analytics" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              7. ANALYTICS DEFINITION
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-2">
              <p>
                Unlike global training stats, ECN Trainer analytics are strictly <span className="text-terminal-text font-bold">session-based</span> to avoid mixing historic baselines with active drilling.
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>
                  <strong>Accuracy:</strong> Percentage of trials where the ECN route matches the prompt target and the adjusted price is correct.
                </li>
                <li>
                  <strong>Reaction Time:</strong> Latency from prompt render to Enter submit. Measured in milliseconds, tracking min (fastest) and max (slowest) bounds.
                </li>
                <li>
                  <strong>Mistake Matrix:</strong> A relative frequency grid showing expected ECN vs your resolved ECN, sorting high-frequency mistakes first to isolate finger lag.
                </li>
                <li>
                  <strong>Overshoots:</strong> Counts how many times you pressed a routing key beyond the index needed to target the ECN (e.g. 3 presses instead of 2).
                </li>
                <li>
                  <strong>Resets:</strong> Counts total uses of the Spacebar key to discard a sequence and start cycling from scratch.
                </li>
                <li>
                  <strong>Price Accuracy:</strong> Accuracy of your delta price adjustments, computed as percentage of price trials completed correctly.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 8: Common Mistakes */}
          <section id="mistakes" className="space-y-2">
            <h3 className="text-sm font-bold text-terminal-text border-b border-terminal-border pb-1.5 uppercase tracking-wider">
              8. USER ERRORS & MISTAKES
            </h3>
            <div className="text-terminal-muted leading-relaxed space-y-3">
              <p>
                To speed up execution, watch out for the following typical novice errors identified during telemetry runs:
              </p>
              <div className="space-y-2.5">
                <div className="border-l border-info-blue pl-3">
                  <strong className="text-terminal-text block">Forgetting the Shift Modifier</strong>
                  Pressing keys without Shift does not register. Ensure you hold Shift first before typing any routing key codes.
                </div>
                <div className="border-l border-info-blue pl-3">
                  <strong className="text-terminal-text block">Route Key Overshooting</strong>
                  Pressing a key 3 times when targeting the 2nd ECN in a group (e.g. pressing A three times when targeting ARCA). When this happens, use Spacebar to reset and retype.
                </div>
                <div className="border-l border-info-blue pl-3">
                  <strong className="text-terminal-text block">Incorrect Price Delta</strong>
                  Neglecting to verify the delta offset direction. BUY demands +¢, SELL demands -¢. Using too large of an increment (using Shift+Arrow key) and forgetting to micro-adjust with single Arrow keys.
                </div>
                <div className="border-l border-info-blue pl-3">
                  <strong className="text-terminal-text block">Mistaking ECN Group Members</strong>
                  Confusing Group A (NSDQ/ARCA) with Group S (NYSE/NSEX) due to physical key proximity. Check the strength heatmap regularly to identify weak links.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Docs;
