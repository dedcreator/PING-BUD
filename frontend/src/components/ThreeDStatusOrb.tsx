'use client';

import React, { useRef, useEffect } from 'react';

interface ThreeDStatusOrbProps {
  status: 'operational' | 'degraded' | 'down';
  size?: number;
  className?: string;
}

export default function ThreeDStatusOrb({
  status,
  size = 54,
  className = '',
}: ThreeDStatusOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const render = () => {
      t += 0.035;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.38;

      let color = '#10b981'; // emerald
      if (status === 'degraded') color = '#f59e0b'; // amber
      if (status === 'down') color = '#ef4444'; // rose

      // Outer Pulsing Aura
      const pulse = Math.sin(t * 3) * 3;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 8 + pulse);
      grad.addColorStop(0, color + '66');
      grad.addColorStop(0.6, color + '22');
      grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Rotating 3D Rings
      const rx = t * 1.5;
      const ry = t * 2.1;

      // Ring 1
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      for (let s = 0; s <= 28; s++) {
        const a = (s / 28) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * (r * Math.cos(rx));
        if (s === 0) ctx.moveTo(cx + x, cy + y);
        else ctx.lineTo(cx + x, cy + y);
      }
      ctx.stroke();

      // Ring 2
      ctx.beginPath();
      ctx.strokeStyle = color + 'bb';
      ctx.lineWidth = 1.4;
      for (let s = 0; s <= 28; s++) {
        const a = (s / 28) * Math.PI * 2;
        const x = Math.cos(a) * (r * Math.sin(ry));
        const y = Math.sin(a) * r;
        if (s === 0) ctx.moveTo(cx + x, cy + y);
        else ctx.lineTo(cx + x, cy + y);
      }
      ctx.stroke();

      // Core Glowing Sphere
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [status, size]);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} className="block" />
    </div>
  );
}
