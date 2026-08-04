import React, { useState } from 'react';

interface BarData {
  dateStr: string;
  label: string;
  minutes: number;
}

interface ActivityBarChartProps {
  data: BarData[];
  title: string;
}

export const ActivityBarChart: React.FC<ActivityBarChartProps> = ({ data, title }) => {
  const [hoveredBar, setHoveredBar] = useState<BarData | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-terminal-border bg-terminal-bg/50 font-mono text-xs text-terminal-muted">
        NO ACTIVITY DATA
      </div>
    );
  }

  const width = 800;
  const height = 150;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute maximum minutes to scale the chart y-axis
  const maxMinsObj = data.reduce((max, d) => (d.minutes > max ? d.minutes : max), 0);
  // Default to at least 5 minutes to prevent flat 0 division
  const yMax = Math.max(5, Math.ceil(maxMinsObj / 5) * 5);
  const yMin = 0;
  const spread = yMax - yMin;

  // Grid lines (e.g. 0, max/2, max)
  const gridLinesY = [0, yMax / 2, yMax];

  // Bar spacing calculations (widened for full-width layout)
  const numBars = data.length;
  const totalBarWidth = chartWidth / numBars;
  const barWidth = Math.max(8, totalBarWidth * 0.5); // 50% width, 50% gap
  const barGap = totalBarWidth - barWidth;

  const formatMinSec = (minsVal: number): string => {
    const totalSec = Math.round(minsVal * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border p-4 font-mono text-xs space-y-2 relative h-full flex flex-col">
      <div className="flex justify-between items-center text-[10px] text-terminal-muted uppercase tracking-wider font-bold border-b border-terminal-border pb-2.5">
        <span>{title}</span>
        <span className="text-terminal-text text-[11px] font-mono h-4">
          {hoveredBar ? (
            <span className="text-success-green">
              {hoveredBar.label}: {formatMinSec(hoveredBar.minutes)}
            </span>
          ) : (
            `Max: ${yMax.toFixed(0)} mins/day`
          )}
        </span>
      </div>

      <div className="relative pt-2 flex-1 flex items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C853" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00C853" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2196F3" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2196F3" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis labels */}
          {gridLinesY.map((yVal, i) => {
            const y = paddingTop + (1 - yVal / spread) * chartHeight;
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
                  fontSize="9px"
                  textAnchor="end"
                  className="font-bold"
                >
                  {yVal.toFixed(0)}m
                </text>
              </g>
            );
          })}

          {/* X axis line */}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#2A3441"
            strokeWidth="1"
          />

          {/* Bars */}
          {data.map((bar, idx) => {
            const x = paddingLeft + idx * totalBarWidth + barGap / 2;
            const scaledHeight = (bar.minutes / spread) * chartHeight;
            const y = height - paddingBottom - scaledHeight;
            const isHovered = hoveredBar && hoveredBar.dateStr === bar.dateStr;

            // Draw a tiny placeholder dot or base line if minutes is 0
            const barHeight = Math.max(1.5, scaledHeight);
            const barY = Math.min(height - paddingBottom - 1.5, y);

            return (
              <g key={bar.dateStr}>
                {/* Invisible hover helper rect */}
                <rect
                  x={paddingLeft + idx * totalBarWidth}
                  y={paddingTop}
                  width={totalBarWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredBar(bar)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                
                {/* The actual visual bar */}
                <rect
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                  stroke={isHovered ? "#2196F3" : "#00C853"}
                  strokeWidth={isHovered ? "1" : "0.5"}
                  className="transition-all duration-150 pointer-events-none"
                  rx={1}
                />
              </g>
            );
          })}

          {/* X labels (Show label for every single day) */}
          {data.map((bar, idx) => {
            const x = paddingLeft + idx * totalBarWidth + totalBarWidth / 2;
            return (
              <text
                key={bar.dateStr}
                x={x}
                y={height - 8}
                fill="#8B949E"
                fontSize="9px"
                textAnchor="middle"
                className="font-bold font-mono"
              >
                {bar.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
