import React, { useState } from 'react';

interface HeatmapCell {
  dateStr: string;
  count: number;
  minutes: number;
  prompts: number;
}

interface CalendarHeatmapProps {
  heatmapData: HeatmapCell[];
  totalActiveDays: number;
}

const formatDuration = (mins: number): string => {
  if (!mins || mins <= 0) return '0s';
  const totalSecs = Math.floor(mins * 60);
  const hrs = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};

const formatDateLong = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ heatmapData, totalActiveDays }) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Group heatmapData into weeks (columns of 7 days)
  const columns: HeatmapCell[][] = [];
  const numWeeks = 53;

  for (let col = 0; col < numWeeks; col++) {
    const week: HeatmapCell[] = [];
    for (let row = 0; row < 7; row++) {
      const index = col * 7 + row;
      if (index < heatmapData.length) {
        week.push(heatmapData[index]);
      }
    }
    if (week.length > 0) {
      columns.push(week);
    }
  }

  // Calculate Month label column positions
  const monthLabels: { text: string; colIndex: number }[] = [];
  let lastMonth = -1;
  columns.forEach((week, colIdx) => {
    if (week.length > 0) {
      const d = new Date(week[0].dateStr + 'T00:00:00');
      const month = d.getMonth();
      if (month !== lastMonth) {
        const monthName = d.toLocaleString(undefined, { month: 'short' }).toUpperCase();
        monthLabels.push({ text: monthName, colIndex: colIdx });
        lastMonth = month;
      }
    }
  });

  // Cell dimensions (enlarged for visibility)
  const cellSize = 12;
  const gap = 3;
  const leftPadding = 34;
  const topPadding = 22;

  const getCellColor = (cell: HeatmapCell) => {
    const mins = cell.minutes;
    if (cell.count === 0 || mins <= 0) return 'fill-terminal-border/20 stroke-terminal-border/40';
    if (mins < 1) return 'fill-success-green/20 stroke-success-green/30';
    if (mins < 5) return 'fill-success-green/45 stroke-success-green/55';
    if (mins < 15) return 'fill-success-green/75 stroke-success-green/85';
    return 'fill-success-green stroke-success-green/80';
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border p-4 font-mono text-xs space-y-3">
      <div className="flex justify-between items-center border-b border-terminal-border pb-2.5">
        <h3 className="text-xs font-bold text-terminal-text uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-3 bg-success-green inline-block"></span>
          Practice Habit Consistency Grid
        </h3>
        
        {/* Heatmap intensity legend */}
        <div className="flex items-center gap-1.5 text-[9px] text-terminal-muted uppercase">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-terminal-border/20 border border-terminal-border/40 inline-block"></div>
          <div className="w-2.5 h-2.5 bg-success-green/20 border border-success-green/30 inline-block"></div>
          <div className="w-2.5 h-2.5 bg-success-green/45 border border-success-green/55 inline-block"></div>
          <div className="w-2.5 h-2.5 bg-success-green/75 border border-success-green/85 inline-block"></div>
          <div className="w-2.5 h-2.5 bg-success-green border border-success-green/80 inline-block"></div>
          <span>More</span>
        </div>
      </div>

      {/* SVG Container for Heatmap Grid */}
      <div className="overflow-x-auto pb-1.5">
        <svg
          viewBox="0 0 830 128"
          className="w-full min-w-[780px] h-auto overflow-visible select-none"
        >
          {/* Month Labels */}
          {monthLabels.map((m, idx) => {
            const x = leftPadding + m.colIndex * (cellSize + gap);
            return (
              <text
                key={idx}
                x={x}
                y={14}
                fill="#8B949E"
                fontSize="9px"
                className="font-bold"
              >
                {m.text}
              </text>
            );
          })}

          {/* Day of Week Labels */}
          {['Mon', 'Wed', 'Fri'].map((day, idx) => {
            // Rows for Mon = 1, Wed = 3, Fri = 5 (0-indexed Sunday)
            const rowIdx = idx * 2 + 1;
            const y = topPadding + rowIdx * (cellSize + gap) + cellSize - 2;
            return (
              <text
                key={day}
                x={6}
                y={y}
                fill="#8B949E"
                fontSize="9px"
                className="text-right font-bold"
              >
                {day}
              </text>
            );
          })}

          {/* Grid of Cells */}
          {columns.map((week, colIdx) => {
            const x = leftPadding + colIdx * (cellSize + gap);
            return (
              <g key={colIdx}>
                {week.map((cell, rowIdx) => {
                  const y = topPadding + rowIdx * (cellSize + gap);
                  return (
                    <rect
                      key={cell.dateStr}
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx={1}
                      ry={1}
                      className={`cursor-crosshair transition-colors stroke-[0.5px] ${getCellColor(cell)}`}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Terminal audit console status line */}
      <div className="bg-terminal-bg border border-terminal-border/80 p-2.5 font-mono text-[10px] text-terminal-muted flex items-center justify-between min-h-[36px]">
        {hoveredCell ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 w-full">
            <span className="text-terminal-text font-bold">
              📅 {formatDateLong(hoveredCell.dateStr)}
            </span>
            <span className="text-terminal-border">|</span>
            <span>
              Sessions: <strong className="text-info-blue font-bold">{hoveredCell.count} runs</strong>
            </span>
            <span className="text-terminal-border">|</span>
            <span>
              Practice: <strong className="text-success-green font-bold">{formatDuration(hoveredCell.minutes)}</strong>
            </span>
            <span className="text-terminal-border">|</span>
            <span>
              Prompts: <strong className="text-warning-amber font-bold">{hoveredCell.prompts}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span>
              &gt; HOVER OVER A HABIT CELL TO VIEW TARGET DATE AUDIT LOGS.
            </span>
            <span className="text-terminal-muted/60 text-[9px]">
              LIFETIME ACTIVE PRACTICE DAYS: <strong className="text-success-green">{totalActiveDays}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
