'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ShieldCheck, Check, Sparkles } from 'lucide-react';

interface ThreeDDeployingOverlayProps {
  monitorName: string;
  target: string;
  regions: string[];
}

export default function ThreeDDeployingOverlay({
  monitorName,
  target,
  regions,
}: ThreeDDeployingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState(0);

  const stages = [
    { text: 'Synthesizing Synthetic Edge Prober...', sub: 'Allocating low-overhead SQLite WAL thread pool', progress: 20 },
    { text: 'Negotiating 4-Node Consensus Quorum...', sub: `Edge targets: Lagos 🇳🇬, Frankfurt 🇩🇪, N. Virginia 🇺🇸, Singapore 🇸🇬`, progress: 55 },
    { text: 'Verifying Latency Bounds & Jitter Filters...', sub: 'Target: ' + target, progress: 85 },
    { text: 'Monitor Deployed & Active!', sub: 'Continuous probing initialized at sub-second intervals', progress: 100 },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => setStage(2), 1400);
    const t3 = setTimeout(() => setStage(3), 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    // 3D Particles
    const particles: { x: number; y: number; z: number; color: string; speed: number; size: number }[] = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 800 + 50,
        color: i % 3 === 0 ? '#14b8a6' : i % 3 === 1 ? '#6366f1' : '#10b981',
        speed: Math.random() * 8 + 4,
        size: Math.random() * 2.5 + 1.2,
      });
    }

    const render = () => {
      t += 0.03;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Draw 3D Warp Tunnel Rings
      const fl = 300;
      const numRings = 7;
      for (let r = 0; r < numRings; r++) {
        const ringZ = ((t * 80 + r * 110) % 770) + 20;
        const scale = fl / (fl + ringZ);
        const radius = 280 * scale;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(13, 148, 136, ${(1 - ringZ / 800) * 0.45})`;
        ctx.lineWidth = 2 * scale;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 3D crosshair ticks on ring
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI) / 2 + t * 0.5;
          const x1 = cx + Math.cos(ang) * (radius - 12 * scale);
          const y1 = cy + Math.sin(ang) * (radius - 12 * scale);
          const x2 = cx + Math.cos(ang) * (radius + 12 * scale);
          const y2 = cy + Math.sin(ang) * (radius + 12 * scale);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Draw 3D Flying Particles
      particles.forEach((p) => {
        p.z -= p.speed;
        if (p.z <= 10) {
          p.z = 800;
          p.x = (Math.random() - 0.5) * 600;
          p.y = (Math.random() - 0.5) * 600;
        }

        const scale = fl / (fl + p.z);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;

        if (px >= 0 && px <= w && py >= 0 && py <= h) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, p.size * scale * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Rotating Central Gyro Ring
      const gyroRad = 70;
      const rotAngle = t * 2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.85)';
      ctx.lineWidth = 3;
      for (let s = 0; s <= 32; s++) {
        const a = (s / 32) * Math.PI * 2;
        const gx = Math.cos(a) * gyroRad;
        const gy = Math.sin(a) * (gyroRad * Math.cos(rotAngle));
        const px = cx + gx;
        const py = cy + gy;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Second Gyro ring
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.75)';
      ctx.lineWidth = 2.5;
      for (let s = 0; s <= 32; s++) {
        const a = (s / 32) * Math.PI * 2;
        const gx = Math.cos(a) * (gyroRad * Math.sin(rotAngle));
        const gy = Math.sin(a) * gyroRad;
        const px = cx + gx;
        const py = cy + gy;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Pulsing Glowing Center Core
      const pulse = Math.sin(t * 6) * 6 + 18;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 2.5);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
      grad.addColorStop(0.5, 'rgba(13, 148, 136, 0.5)');
      grad.addColorStop(1, 'rgba(13, 148, 136, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, pulse * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const currentStage = stages[Math.min(stage, stages.length - 1)];

  return (
    <div className="absolute inset-0 z-50 rounded-2xl overflow-hidden bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white select-none animate-in fade-in zoom-in-95 duration-200">
      {/* 3D Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Futuristic HUD Card Content */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center">
        {/* Holographic Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-mono font-bold uppercase tracking-wider mb-5 shadow-lg shadow-teal-500/10">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>3D Synthetic Deployment Pipeline</span>
        </div>

        {/* Dynamic Title */}
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 drop-shadow-md">
          {currentStage.text}
        </h3>
        <p className="text-xs text-slate-300 font-mono mb-6 max-w-sm truncate">
          {currentStage.sub}
        </p>

        {/* Progress Bar with 3D Specular Sheen */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 p-0.5 border border-slate-700/80 mb-6 overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-400 transition-all duration-500 relative"
            style={{ width: `${currentStage.progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>
        </div>

        {/* Regional Consensus Verification Badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          {[
            { flag: '🇳🇬', city: 'Lagos' },
            { flag: '🇩🇪', city: 'Frankfurt' },
            { flag: '🇺🇸', city: 'Virginia' },
            { flag: '🇸🇬', city: 'Singapore' },
          ].map((node, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all duration-300 ${
                stage >= 1
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <span>{node.flag}</span>
              <span>{node.city}</span>
              {stage >= 1 && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Deploying: <span className="text-teal-300 font-bold">{monitorName}</span>
        </div>
      </div>
    </div>
  );
}
