import React, { useState } from 'react';

// ─── TOOLTIP COMPONENT ────────────────────────────────────────────────────────
function ChartTooltip({ active, content, x, y }) {
  if (!active || !content) return null;
  return (
    <div style={{
      position: 'absolute',
      left: `${x}px`,
      top: `${y - 55}px`,
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '8px',
      padding: '8px 12px',
      pointerEvents: 'none',
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap',
      transition: 'all 0.1s ease-out'
    }}>
      {content}
    </div>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
export function BarChart({ data, dataKey, labelKey, color = 'var(--color-primary)' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>No chart data.</div>;
  }

  const values = data.map(d => d[dataKey]);
  const maxValue = Math.max(...values, 5); // Fallback to 5 to avoid divide by zero/flat charts
  const height = 180;
  const width = 400;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.max(12, (chartWidth / data.length) * 0.55);
  const gap = (chartWidth - barWidth * data.length) / (data.length - 1 || 1);

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`barGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const gridVal = Math.round(maxValue * ratio);
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="1"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="var(--text-muted)" 
                fontSize="10" 
                textAnchor="end"
                fontWeight="500"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const val = item[dataKey];
          const barHeight = (val / maxValue) * chartHeight;
          const x = paddingLeft + idx * (barWidth + gap) + gap/2;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={Math.min(4, barWidth / 2)}
                fill={`url(#barGrad-${dataKey})`}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  filter: hoveredIdx === idx ? 'url(#glow)' : 'none',
                  opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.65
                }}
                onMouseEnter={(e) => {
                  setHoveredIdx(idx);
                  const svgNode = e.currentTarget.ownerSVGElement;
                  const rectBound = e.currentTarget.getBoundingClientRect();
                  const svgBound = svgNode.getBoundingClientRect();
                  setTooltipPos({
                    x: rectBound.left - svgBound.left + rectBound.width / 2,
                    y: rectBound.top - svgBound.top
                  });
                }}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              {/* X Axis labels */}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="middle"
                fontWeight="600"
              >
                {item[labelKey]}
              </text>
            </g>
          );
        })}
        
        {/* Baseline */}
        <line 
          x1={paddingLeft} 
          y1={paddingTop + chartHeight} 
          x2={width - paddingRight} 
          y2={paddingTop + chartHeight} 
          stroke="rgba(255,255,255,0.15)" 
          strokeWidth="1"
        />
      </svg>

      <ChartTooltip
        active={hoveredIdx !== null}
        x={tooltipPos.x}
        y={tooltipPos.y}
        content={
          hoveredIdx !== null ? (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {data[hoveredIdx][labelKey]}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: color, marginTop: '2px' }}>
                {data[hoveredIdx][dataKey]} Bookings
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}

// ─── AREA CHART ───────────────────────────────────────────────────────────────
export function AreaChart({ data, dataKey, labelKey, color = 'var(--color-secondary)', formatVal = (v) => v }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>No chart data.</div>;
  }

  const values = data.map(d => d[dataKey]);
  const maxValue = Math.max(...values, 5);
  const height = 180;
  const width = 450;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate points
  const points = data.map((item, idx) => {
    const x = paddingLeft + (idx / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - (item[dataKey] / maxValue) * chartHeight;
    return { x, y, item, idx };
  });

  // Construct SVG Path
  const linePath = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`areaGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const gridVal = Math.round(maxValue * ratio);
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="1"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="var(--text-muted)" 
                fontSize="10" 
                textAnchor="end"
                fontWeight="500"
              >
                {formatVal(gridVal)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <path 
            d={areaPath} 
            fill={`url(#areaGrad-${dataKey})`} 
          />
        )}

        {/* Line stroke */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.3))' }}
          />
        )}

        {/* Baseline */}
        <line 
          x1={paddingLeft} 
          y1={paddingTop + chartHeight} 
          x2={width - paddingRight} 
          y2={paddingTop + chartHeight} 
          stroke="rgba(255,255,255,0.15)" 
          strokeWidth="1"
        />

        {/* Interactive nodes */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 7 : 4}
              fill={hoveredIdx === idx ? '#fff' : color}
              stroke={color}
              strokeWidth="2.5"
              style={{ 
                cursor: 'pointer', 
                transition: 'all 0.15s ease',
                filter: hoveredIdx === idx ? 'drop-shadow(0 0 5px ' + color + ')' : 'none'
              }}
              onMouseEnter={(e) => {
                setHoveredIdx(idx);
                const svgNode = e.currentTarget.ownerSVGElement;
                const rectBound = e.currentTarget.getBoundingClientRect();
                const svgBound = svgNode.getBoundingClientRect();
                setTooltipPos({
                  x: rectBound.left - svgBound.left + rectBound.width / 2,
                  y: rectBound.top - svgBound.top
                });
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* X Labels */}
            {idx % (data.length > 8 ? 2 : 1) === 0 && (
              <text
                x={p.x}
                y={height - 8}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="middle"
                fontWeight="600"
              >
                {p.item[labelKey]}
              </text>
            )}
          </g>
        ))}
      </svg>

      <ChartTooltip
        active={hoveredIdx !== null}
        x={tooltipPos.x}
        y={tooltipPos.y}
        content={
          hoveredIdx !== null ? (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {data[hoveredIdx][labelKey]}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: color, marginTop: '2px' }}>
                {formatVal(data[hoveredIdx][dataKey])}
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}

// ─── DOUGHNUT CHART ───────────────────────────────────────────────────────────
export function DoughnutChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>No chart data.</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 180;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const colors = [
    '#f59e0b', // Pending (Amber)
    '#3b82f6', // Confirmed (Blue)
    '#10b981', // In Progress (Green)
    '#059669', // Completed (Dark Green)
    '#ef4444'  // Cancelled (Red)
  ];

  let accumulatedPercent = 0;

  // Add percentage and offset to each item
  const slices = data.map((item, idx) => {
    const percent = total > 0 ? item.value / total : 0;
    const strokeLength = percent * circumference;
    const offset = accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...item,
      percent,
      strokeLength,
      offset: circumference - offset, // SVG offset goes counter-clockwise by default
      color: colors[idx % colors.length]
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1.1fr 0.9fr', 
      alignItems: 'center', 
      gap: '16px',
      width: '100%'
    }}>
      
      {/* Visual Ring */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
        <svg 
          viewBox={`0 0 ${size} ${size}`} 
          width="100%" 
          height="100%" 
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Inner ring track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
          />
          
          {slices.map((slice, idx) => {
            if (slice.value === 0) return null;
            const isHovered = hoveredIdx === idx;
            
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${slice.strokeLength} ${circumference}`}
                strokeDashoffset={slice.offset}
                strokeLinecap="round"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: isHovered ? `drop-shadow(0 0 6px ${slice.color}80)` : 'none',
                  opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.6
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          lineHeight: '1.2'
        }}>
          <div style={{ 
            fontSize: '22px', 
            fontWeight: '800', 
            color: activeSlice ? activeSlice.color : 'var(--text-main)',
            transition: 'color 0.2s ease'
          }}>
            {activeSlice ? activeSlice.value : total}
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>
            {activeSlice ? activeSlice.name : 'Total Trips'}
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
        {slices.map((slice, idx) => (
          <div 
            key={idx}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '8px',
              backgroundColor: hoveredIdx === idx ? 'rgba(255,255,255,0.03)' : 'transparent',
              transition: 'background-color 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: slice.color,
                boxShadow: `0 0 6px ${slice.color}`
              }} />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: hoveredIdx === idx ? 'var(--text-main)' : 'var(--text-muted)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                {slice.name}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', paddingLeft: '8px' }}>
              {slice.value} ({total > 0 ? Math.round(slice.percent * 100) : 0}%)
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── HORIZONTAL PROGRESS BAR CHART ────────────────────────────────────────────
export function HorizontalBarChart({ data }) {
  const categories = Object.keys(data);
  const values = Object.values(data);
  const maxValue = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);

  const colors = {
    Sedan: '#2563eb',   // Blue
    SUV: '#10b981',     // Green
    Luxury: '#8b5cf6',  // Purple
    Minivan: '#f97316'  // Orange
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', textAlign: 'left' }}>
      {categories.map((cat, idx) => {
        const val = data[cat] || 0;
        const percent = total > 0 ? (val / total) * 100 : 0;
        const color = colors[cat] || 'var(--color-primary)';
        
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{cat}</span>
              <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>
                {val} bookings <span style={{ color: color, fontSize: '11px', fontWeight: '800', marginLeft: '4px' }}>({Math.round(percent)}%)</span>
              </span>
            </div>
            {/* Progress track */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              <div style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: '4px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 8px ${color}80`
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
