'use client';

import React from 'react';
import { UptimeBarTick } from '../types';

interface LatencySparklineProps {
  ticks: UptimeBarTick[];
  width?: number;
  height?: number;
  color?: string;
}

export default function LatencySparkline({
  ticks,
  width = 120,
  height = 24,
  color = '#4F46E5',
}: LatencySparklineProps) {
  const points = (ticks || [])
    .filter((t) => t.latency_ms > 0)
    .slice(-20)
    .map((t) => t.latency_ms);

  if (points.length < 2) {
    return <span className="text-xs text-slate-400 font-mono">--</span>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pathCoords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${pathCoords.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
