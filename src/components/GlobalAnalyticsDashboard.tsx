import React, { useState } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { calculateGlobalStats } from '../core/analytics';

// Helper to format training duration
const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '0s';
  const sec = Math.floor(ms / 1000);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
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

const formatShortDate = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
};

// Custom responsive SVG Line Chart
interface SVGChartProps {
  data: number[];
  dates: string[];
  title: string;
  color: string;
  gradientId: string;
  yMin: number;
  yMax: number;
  valueFormatter: (v: number) => string;
}

const SVGChart: React.FC<SVGChartProps> = ({
  data,
  dates,
  title,
  color,
  gradientId,
  yMin,
  yMax,
  valueFormatter
}) => {
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-terminal-border bg-terminal-bg/50 font-mono text-xs text-terminal-muted">
        NO PLOT DATA AVAILABLE
      </div>
    );
  }

  const width = 500;
  const height = 150;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute points
  const points: { x: number; y: number }[] = [];
  const min = yMin;
  const max = yMax;
  const spread = max - min || 1;

  data.forEach((val, idx) => {
    const x = paddingLeft + (idx / Math.max(1, data.length - 1)) * chartWidth;
    const clampedVal = Math.max(min, Math.min(max, val));
    const y = paddingTop + (1 - (clampedVal - min) / spread) * chartHeight;
    points.push({ x, y });
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  // Grid lines
  const gridLinesY = [min, min + spread / 2, max];

  return (
    <div className="bg-terminal-panel border border-terminal-border p-3 space-y-2 font-mono">
      <div className="flex justify-between items-center text-[10px] text-terminal-muted uppercase tracking-wider font-bold">
        <span>{title}</span>
        <span className="text-terminal-text text-xs">
          Last: {valueFormatter(data[data.length - 1])}
        </span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {gridLinesY.map((yVal, i) => {
            const y = paddingTop + (1 - (yVal - min) / spread) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#2A3441"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  fill="#8B949E"
                  fontSize="8"
                  textAnchor="end"
                >
                  {valueFormatter(yVal)}
                </text>
              </g>
            );
          })}

          {/* X Labels (show start, mid, end) */}
          {dates.length > 0 && (
            <>
              {/* Start */}
              <text x={paddingLeft} y={height - 5} fill="#8B949E" fontSize="8" textAnchor="start">
                {dates[0]}
              </text>
              {/* Mid */}
              {dates.length > 2 && (
                <text
                  x={paddingLeft + chartWidth / 2}
                  y={height - 5}
                  fill="#8B949E"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {dates[Math.floor(dates.length / 2)]}
                </text>
              )}
              {/* End */}
              {dates.length > 1 && (
                <text
                  x={width - paddingRight}
                  y={height - 5}
                  fill="#8B949E"
                  fontSize="8"
                  textAnchor="end"
                >
                  {dates[dates.length - 1]}
                </text>
              )}
            </>
          )}

          {/* Area under line */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* The line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive dots */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={points.length > 15 ? "1.5" : "3"}
              fill="#0E1116"
              stroke={color}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export const GlobalAnalyticsDashboard: React.FC = () => {
  const sessions = useTrainerStore((state) => state.sessions);
  const setView = useTrainerStore((state) => state.setView);
  const stats = calculateGlobalStats(sessions);

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const toggleExpandSession = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const chartDates = stats.sessionHistory.map(s => formatShortDate(s.date));
  const accuracyData = stats.sessionHistory.map(s => s.accuracy);
  const speedData = stats.sessionHistory.map(s => s.speedSeconds);

  // Speed boundaries for chart
  const speedMin = speedData.length > 0 ? Math.max(0.1, Math.min(...speedData) - 0.2) : 0.5;
  const speedMax = speedData.length > 0 ? Math.max(1.5, Math.max(...speedData) + 0.2) : 3.0;

  return (
    <div className="w-full space-y-5">
      {/* 1. Dashboard Title banner */}
      <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider text-terminal-text uppercase">
            [SYS_DASHBOARD] - GLOBAL TRAINING AUDIT CONSOLE
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Monitor lifetime stats, progress charts, ECN statistics, and configurations.
          </p>
        </div>
        <button
          onClick={() => setView('trainer')}
          className="px-4 py-2 bg-success-green hover:bg-success-green/90 text-terminal-bg font-black font-mono text-xs cursor-pointer border-0 uppercase"
        >
          Open Arena
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-terminal-panel border border-terminal-border p-12 text-center font-mono space-y-2">
          <p className="text-xs text-terminal-muted">NO METRICS LOADED</p>
          <p className="text-[10px] text-terminal-muted/60">Launch a trainer run to populate logs.</p>
        </div>
      ) : (
        <>
          {/* 2. Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="bg-terminal-panel border border-terminal-border p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-info-blue" />
              <span className="text-[9px] text-terminal-muted uppercase block font-bold">LIFETIME ACCURACY</span>
              <strong className="text-2xl font-bold text-terminal-text block mt-1">
                {stats.overallAccuracy.toFixed(1)}%
              </strong>
              <span className="text-[10px] text-terminal-muted">
                {stats.totalCorrect} correct / {stats.totalPrompts} total
              </span>
            </div>

            <div className="bg-terminal-panel border border-terminal-border p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-warning-amber" />
              <span className="text-[9px] text-terminal-muted uppercase block font-bold">AVERAGE SPEED</span>
              <strong className="text-2xl font-bold text-info-blue block mt-1">
                {stats.overallAverageSpeedSeconds.toFixed(3)}s
              </strong>
              <span className="text-[10px] text-terminal-muted">
                Reaction latency across all trials
              </span>
            </div>

            <div className="bg-terminal-panel border border-terminal-border p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-success-green" />
              <span className="text-[9px] text-terminal-muted uppercase block font-bold">TOTAL TRAINING TIME</span>
              <strong className="text-2xl font-bold text-success-green block mt-1">
                {formatDuration(stats.totalTrainingTimeMs)}
              </strong>
              <span className="text-[10px] text-terminal-muted">
                Across {stats.totalSessions} completed runs
              </span>
            </div>

            <div className="bg-terminal-panel border border-terminal-border p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-terminal-muted" />
              <span className="text-[9px] text-terminal-muted uppercase block font-bold">AVERAGE SESSION</span>
              <strong className="text-2xl font-bold text-terminal-text block mt-1">
                {formatDuration(stats.averageSessionDurationMs)}
              </strong>
              <span className="text-[10px] text-terminal-muted">
                Avg {stats.averagePromptsPerSession.toFixed(0)} prompts per session
              </span>
            </div>
          </div>

          {/* 3. SVG Line Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SVGChart
              data={accuracyData}
              dates={chartDates}
              title="ACCURACY TRENDS OVER TIME"
              color="#00C853" // success green
              gradientId="accuracyGradient"
              yMin={0}
              yMax={100}
              valueFormatter={(v) => `${v.toFixed(0)}%`}
            />

            <SVGChart
              data={speedData}
              dates={chartDates}
              title="SPEED TRENDS OVER TIME (LOWER IS FASTER)"
              color="#2196F3" // info blue
              gradientId="speedGradient"
              yMin={speedMin}
              yMax={speedMax}
              valueFormatter={(v) => `${v.toFixed(2)}s`}
            />
          </div>

          {/* 4. Insights Section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
            {/* Column A: Performance Insights */}
            <div className="lg:col-span-4 bg-terminal-panel border border-terminal-border p-4 space-y-4">
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wider">
                SESSION EXTREMES
              </h3>
              <div className="space-y-3">
                {stats.bestSession && (
                  <div className="flex justify-between items-start border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-success-green font-bold block uppercase text-[10px]">BEST SESSION ACCURACY</span>
                      <span className="text-terminal-muted text-[10px]">
                        {formatDate(stats.bestSession.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-terminal-text text-sm block">{stats.bestSession.accuracy.toFixed(1)}%</strong>
                      <span className="text-terminal-muted text-[10px]">({(stats.bestSession.averageTime / 1000).toFixed(3)}s)</span>
                    </div>
                  </div>
                )}

                {stats.worstSession && (
                  <div className="flex justify-between items-start border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-error-red font-bold block uppercase text-[10px]">WORST SESSION ACCURACY</span>
                      <span className="text-terminal-muted text-[10px]">
                        {formatDate(stats.worstSession.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-terminal-text text-sm block">{stats.worstSession.accuracy.toFixed(1)}%</strong>
                      <span className="text-terminal-muted text-[10px]">({(stats.worstSession.averageTime / 1000).toFixed(3)}s)</span>
                    </div>
                  </div>
                )}

                {stats.fastestSession && (
                  <div className="flex justify-between items-start border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-info-blue font-bold block uppercase text-[10px]">FASTEST SESSION LATENCY</span>
                      <span className="text-terminal-muted text-[10px]">
                        {formatDate(stats.fastestSession.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-terminal-text text-sm block">{(stats.fastestSession.averageTime / 1000).toFixed(3)}s</strong>
                      <span className="text-terminal-muted text-[10px]">({stats.fastestSession.accuracy.toFixed(0)}% Acc)</span>
                    </div>
                  </div>
                )}

                {stats.slowestSession && (
                  <div className="flex justify-between items-start border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-warning-amber font-bold block uppercase text-[10px]">SLOWEST SESSION LATENCY</span>
                      <span className="text-terminal-muted text-[10px]">
                        {formatDate(stats.slowestSession.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-terminal-text text-sm block">{(stats.slowestSession.averageTime / 1000).toFixed(3)}s</strong>
                      <span className="text-terminal-muted text-[10px]">({stats.slowestSession.accuracy.toFixed(0)}% Acc)</span>
                    </div>
                  </div>
                )}

                {stats.longestSession && (
                  <div className="flex justify-between items-start border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-terminal-text font-bold block uppercase text-[10px]">LONGEST SESSION TIME</span>
                      <span className="text-terminal-muted text-[10px]">
                        {formatDate(stats.longestSession.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-terminal-text text-sm block">
                        {formatDuration(stats.longestSession.sessionDurationMs || (stats.longestSession.averageTime * stats.longestSession.events.length))}
                      </strong>
                      <span className="text-terminal-muted text-[10px]">{stats.longestSession.events.length} prompts</span>
                    </div>
                  </div>
                )}

                {stats.shortestSession && (
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-terminal-text font-bold block uppercase text-[10px]">SHORTEST SESSION TIME</span>
                      <span className="text-terminal-muted text-[10px]">
                        {formatDate(stats.shortestSession.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-terminal-text text-sm block">
                        {formatDuration(stats.shortestSession.sessionDurationMs || (stats.shortestSession.averageTime * stats.shortestSession.events.length))}
                      </strong>
                      <span className="text-terminal-muted text-[10px]">{stats.shortestSession.events.length} prompts</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column B: ECN-level Insights */}
            <div className="lg:col-span-4 bg-terminal-panel border border-terminal-border p-4 space-y-4">
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wider">
                ECN PERFORMANCE LEADERBOARD
              </h3>
              <div className="space-y-3">
                {stats.mostPracticedEcn && (
                  <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-terminal-muted block text-[10px] uppercase">MOST PRACTICED ECN</span>
                      <strong className="text-terminal-text text-sm">{stats.mostPracticedEcn.ecn}</strong>
                    </div>
                    <span className="text-terminal-text font-semibold">{stats.mostPracticedEcn.count} trials</span>
                  </div>
                )}

                {stats.leastPracticedEcn && (
                  <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-terminal-muted block text-[10px] uppercase">LEAST PRACTICED ECN</span>
                      <strong className="text-terminal-text text-sm">{stats.leastPracticedEcn.ecn}</strong>
                    </div>
                    <span className="text-terminal-muted">{stats.leastPracticedEcn.count} trials</span>
                  </div>
                )}

                {stats.highestAccuracyEcn && (
                  <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-terminal-muted block text-[10px] uppercase">HIGHEST ACCURACY ECN</span>
                      <strong className="text-terminal-text text-sm">{stats.highestAccuracyEcn.ecn}</strong>
                    </div>
                    <span className="text-success-green font-bold">{stats.highestAccuracyEcn.accuracy.toFixed(1)}%</span>
                  </div>
                )}

                {stats.lowestAccuracyEcn && (
                  <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-terminal-muted block text-[10px] uppercase">LOWEST ACCURACY ECN</span>
                      <strong className="text-terminal-text text-sm">{stats.lowestAccuracyEcn.ecn}</strong>
                    </div>
                    <span className="text-error-red font-bold">{stats.lowestAccuracyEcn.accuracy.toFixed(1)}%</span>
                  </div>
                )}

                {stats.fastestEcn && (
                  <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                    <div>
                      <span className="text-terminal-muted block text-[10px] uppercase">FASTEST RESPONSE ECN</span>
                      <strong className="text-terminal-text text-sm">{stats.fastestEcn.ecn}</strong>
                    </div>
                    <span className="text-info-blue font-bold">{stats.fastestEcn.speedSeconds.toFixed(3)}s</span>
                  </div>
                )}

                {stats.slowestEcn && (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-terminal-muted block text-[10px] uppercase">SLOWEST RESPONSE ECN</span>
                      <strong className="text-terminal-text text-sm">{stats.slowestEcn.ecn}</strong>
                    </div>
                    <span className="text-warning-amber font-bold">{stats.slowestEcn.speedSeconds.toFixed(3)}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column C: Progress Trends & Streaks */}
            <div className="lg:col-span-4 bg-terminal-panel border border-terminal-border p-4 space-y-4">
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wider">
                TRAINING EFFORT & PROGRESS
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                  <span className="text-terminal-muted uppercase text-[10px]">LONGEST CORRECT STREAK</span>
                  <strong className="text-success-green text-sm font-black">{stats.longestStreak} orders</strong>
                </div>

                <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                  <span className="text-terminal-muted uppercase text-[10px]">ACCURACY TREND (LAST 5)</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    stats.accuracyTrend === 'up' ? 'text-success-green' : stats.accuracyTrend === 'down' ? 'text-error-red' : 'text-terminal-text'
                  }`}>
                    {stats.accuracyTrend === 'up' ? '▲' : stats.accuracyTrend === 'down' ? '▼' : '■'}
                    {stats.accuracyTrendValue >= 0 ? `+${stats.accuracyTrendValue.toFixed(1)}%` : `${stats.accuracyTrendValue.toFixed(1)}%`}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                  <span className="text-terminal-muted uppercase text-[10px]">SPEED TREND (LAST 5)</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    stats.speedTrend === 'up' ? 'text-success-green' : stats.speedTrend === 'down' ? 'text-error-red' : 'text-terminal-text'
                  }`}>
                    {stats.speedTrend === 'up' ? '▲ Speeding up' : stats.speedTrend === 'down' ? '▼ Slowing down' : '■ Flat'}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-terminal-border/20 pb-2">
                  <span className="text-terminal-muted uppercase text-[10px]">LIFETIME IMPROVEMENT</span>
                  <div className="text-right">
                    <span className={`font-bold block ${stats.improvementAccuracy >= 0 ? 'text-success-green' : 'text-error-red'}`}>
                      Acc: {stats.improvementAccuracy >= 0 ? '+' : ''}{stats.improvementAccuracy.toFixed(1)}%
                    </span>
                    <span className={`text-[10px] font-bold block ${stats.improvementSpeed >= 0 ? 'text-success-green' : 'text-error-red'}`}>
                      Speed: {stats.improvementSpeed >= 0 ? 'Fast' : 'Slow'} ({stats.improvementSpeed >= 0 ? '+' : ''}{stats.improvementSpeed.toFixed(2)}s)
                    </span>
                  </div>
                </div>

                {sessions.length >= 10 && (
                  <div className="flex justify-between items-center">
                    <span className="text-terminal-muted uppercase text-[10px]">RECENT 10-RUN IMPROVEMENT</span>
                    <div className="text-right">
                      <span className={`font-bold block ${stats.improvementAccuracy10 >= 0 ? 'text-success-green' : 'text-error-red'}`}>
                        Acc: {stats.improvementAccuracy10 >= 0 ? '+' : ''}{stats.improvementAccuracy10.toFixed(1)}%
                      </span>
                      <span className={`text-[10px] font-bold block ${stats.improvementSpeed10 >= 0 ? 'text-success-green' : 'text-error-red'}`}>
                        Speed: {stats.improvementSpeed10 >= 0 ? '+' : ''}{stats.improvementSpeed10.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Configuration Insights & Effectiveness */}
          <div className="bg-terminal-panel border border-terminal-border p-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2.5 uppercase tracking-wider mb-3">
              TRAINING CONFIGURATION EFFECTIVENESS INSIGHTS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-terminal-bg/50 border border-terminal-border/60 p-3 space-y-1">
                <span className="text-[10px] text-terminal-muted uppercase block">Most Effective Mode</span>
                <strong className="text-sm font-bold text-terminal-text block uppercase">
                  {stats.mostEffectiveMode.replace('_', ' ')}
                </strong>
                <span className="text-[10px] text-terminal-muted">Highest accuracy execution</span>
              </div>

              <div className="bg-terminal-bg/50 border border-terminal-border/60 p-3 space-y-1">
                <span className="text-[10px] text-terminal-muted uppercase block">Best Performing Size</span>
                <strong className="text-sm font-bold text-terminal-text block">
                  {stats.bestPerformingPromptCount === 0 ? 'Unlimited' : `${stats.bestPerformingPromptCount} Prompts`}
                </strong>
                <span className="text-[10px] text-terminal-muted">Lowest error configuration</span>
              </div>

              <div className="bg-terminal-bg/50 border border-terminal-border/60 p-3 space-y-1">
                <span className="text-[10px] text-terminal-muted uppercase block">Target ECN Mode Performance</span>
                <strong className="text-sm font-bold text-terminal-text block">
                  {stats.bestTargetEcnModeAccuracy > 0 ? `${stats.bestTargetEcnModeAccuracy.toFixed(1)}%` : '—'}
                </strong>
                <span className="text-[10px] text-terminal-muted">Average Target ECN Mode accuracy</span>
              </div>

              <div className="bg-terminal-bg/50 border border-terminal-border/60 p-3 space-y-1">
                <span className="text-[10px] text-terminal-muted uppercase block">Price Mode Performance</span>
                <strong className="text-sm font-bold text-terminal-text block">
                  {stats.bestPriceModeAccuracy > 0 ? `${stats.bestPriceModeAccuracy.toFixed(1)}%` : '—'}
                </strong>
                <span className="text-[10px] text-terminal-muted">Average price adjust accuracy</span>
              </div>
            </div>
          </div>

          {/* 6. Completed Sessions Logs (Accordion) */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wider">
              SESSION PRACTICE REGISTRY
            </h3>
            <div className="divide-y divide-terminal-border/40 max-h-96 overflow-y-auto pr-1">
              {[...sessions].map((s, idx) => {
                const sIndex = sessions.length - idx;
                const isExpanded = expandedSessionId === s.id;
                const duration = s.sessionDurationMs || (s.averageTime * s.events.length) || 0;
                
                return (
                  <div key={s.id} className="py-2.5">
                    <div
                      onClick={() => toggleExpandSession(s.id)}
                      className="flex justify-between items-center hover:bg-terminal-bg/30 p-1.5 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-terminal-muted text-[10px]">#{sIndex.toString().padStart(2, '0')}</span>
                        <strong className="text-terminal-text">Session Run ({formatDate(s.date)})</strong>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${
                          s.accuracy >= 90 ? 'text-success-green' : s.accuracy >= 75 ? 'text-warning-amber' : 'text-error-red'
                        }`}>
                          {s.accuracy.toFixed(1)}% Acc
                        </span>
                        <span className="text-info-blue">{(s.averageTime / 1000).toFixed(3)}s</span>
                        <span className="text-terminal-muted text-[10px]">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-terminal-bg/40 border border-terminal-border/50 p-3.5 mt-2 space-y-3 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Statistics */}
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-bold text-terminal-text uppercase border-b border-terminal-border/30 pb-1">
                            RUN AUDIT DATA
                          </h4>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Total Trials:</span>
                            <span className="text-terminal-text font-bold">{s.events.length} prompts</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Correct / Incorrect:</span>
                            <span className="text-terminal-text">
                              <span className="text-success-green font-bold">{s.events.filter(e => e.correct).length}</span> / <span className="text-error-red font-bold">{s.events.filter(e => !e.correct).length}</span>
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Total Run Time:</span>
                            <span className="text-terminal-text font-bold">{formatDuration(duration)}</span>
                          </div>
                          {s.priceAccuracy !== undefined && (
                            <div className="flex justify-between py-0.5">
                              <span className="text-terminal-muted">Price Accuracy:</span>
                              <span className="text-success-green font-bold">{s.priceAccuracy.toFixed(1)}%</span>
                            </div>
                          )}
                          {s.fastestTime && (
                            <div className="flex justify-between py-0.5">
                              <span className="text-terminal-muted">Latency extremes:</span>
                              <span className="text-terminal-text">
                                {(s.fastestTime / 1000).toFixed(3)}s / {(s.slowestTime ? s.slowestTime / 1000 : 0).toFixed(3)}s
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Settings Used */}
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-bold text-terminal-text uppercase border-b border-terminal-border/30 pb-1">
                            CONFIGURATION METADATA
                          </h4>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Training Mode:</span>
                            <span className="text-terminal-text uppercase">{s.mode.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Price Training:</span>
                            <span className="text-terminal-text font-bold">{s.priceTrainingEnabled ? 'ENABLED' : 'DISABLED'}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Target ECN Mode:</span>
                            <span className="text-terminal-text font-bold">
                              {s.targetEcnModeEnabled 
                                ? `ENABLED (${s.targetEcns && s.targetEcns.length > 0 ? s.targetEcns.join(', ') : (s.targetEcn || 'N/A')})` 
                                : 'DISABLED'}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-terminal-muted">Pacing Type:</span>
                            <span className="text-terminal-text uppercase">
                              {s.practiceModeType === 'time_limit' ? 'TIME-LIMIT / ADAPTIVE' : 'STABLE / MANUAL'}
                            </span>
                          </div>
                          {s.practiceModeType === 'time_limit' && (
                            <div className="space-y-0.5 pt-1 text-[10px] border-t border-terminal-border/20">
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">Initial Limit:</span>
                                <span>{((s.initialTimeLimitMs || 2000) / 1000).toFixed(1)}s</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">Decay / Penalty:</span>
                                <span>-{((s.speedDecayMs || 50) / 1000).toFixed(2)}s / +{((s.speedPenaltyMs || 200) / 1000).toFixed(2)}s</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">Trigger Threshold:</span>
                                <span>{s.targetStreakLength || 3} correct</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
