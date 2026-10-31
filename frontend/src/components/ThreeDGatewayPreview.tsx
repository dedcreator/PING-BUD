'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Bot,
  Activity,
  Globe,
  Radio,
  Zap,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface EdgeNode {
  name: string;
  flag: string;
  latency: number;
  angle: number; // orbital angle (radians)
  dist: number;  // distance from core
  elevation: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number;
  speed: number;
  color: string;
}

export default function ThreeDGatewayPreview() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Card Tilt State
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, s: 1 });
  const [isHovered, setIsHovered] = useState(false);

  // Live Gateway Simulation State
  const [latency, setLatency] = useState(42);
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheck, setLastCheck] = useState('just now');
  const [activeProbeIndex, setActiveProbeIndex] = useState<number | null>(null);

  // Canvas 3D Rotation State
  const rotRef = useRef({ x: 0.38, y: -0.45, vx: 0.003, vy: 0.004 });
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });
  const particlesRef = useRef<Particle[]>([]);

  // 4 Probing Regions
  const nodes: EdgeNode[] = [
    { name: 'Lagos', flag: '🇳🇬', latency: 18, angle: 0, dist: 130, elevation: 12 },
    { name: 'Frankfurt', flag: '🇩🇪', latency: 34, angle: Math.PI * 0.5, dist: 130, elevation: -8 },
    { name: 'Oregon', flag: '🇺🇸', latency: 42, angle: Math.PI, dist: 130, elevation: 15 },
    { name: 'Singapore', flag: '🇸🇬', latency: 86, angle: Math.PI * 1.5, dist: 130, elevation: -10 },
  ];

  // Mouse Move on the 3D Perspective Card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rx = -(y / (rect.height / 2)) * 6; // Max 6 deg
    const ry = (x / (rect.width / 2)) * 6;
    setTilt({ rx, ry, s: 1.01 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0, s: 1 });
    setIsHovered(false);
  }, []);

  // Trigger Instant 3D Synthetic Probe
  const handleTriggerProbe = () => {
    if (isPinging) return;
    setIsPinging(true);
    // Burst particles from all 4 nodes to the core
    for (let i = 0; i < 4; i++) {
      const node = nodes[i];
      for (let p = 0; p < 3; p++) {
        particlesRef.current.push({
          x: Math.cos(node.angle) * node.dist,
          y: node.elevation + (Math.random() * 8 - 4),
          z: Math.sin(node.angle) * node.dist,
          targetX: 0,
          targetY: 0,
          targetZ: 0,
          progress: Math.random() * 0.15,
          speed: 0.025 + Math.random() * 0.015,
          color: '#14b8a6',
        });
      }
    }
    // Micro fluctuate latency
    setTimeout(() => {
      setLatency(38 + Math.floor(Math.random() * 7));
      setLastCheck('seconds ago');
      setIsPinging(false);
    }, 700);
  };

  // 3D Canvas Rendering Engine
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

    // 3D Projector
    const project = (
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
      cx: number,
      cy: number,
      scale: number
    ) => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = 420;
      const p = fov / (fov + z2);
      return {
        x: cx + x1 * p * scale,
        y: cy + y2 * p * scale,
        scale: p * scale,
        z: z2,
      };
    };

    const render = () => {
      t += 0.02;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Auto drift if not dragging
      if (!mouseRef.current.isDown) {
        rotRef.current.y += 0.006;
      }
      const rx = rotRef.current.x;
      const ry = rotRef.current.y;
      const scale = Math.min(w, h) / 340;

      // Draw Orbit Wireframe Ellipses
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.22)';
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        const ox = Math.cos(a) * 130;
        const oz = Math.sin(a) * 130;
        const p = project(ox, 0, oz, rx, ry, cx, cy, scale);
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();

      // Outer radar pulse ring
      const pulseR = (t * 40) % 150;
      ctx.strokeStyle = `rgba(20, 184, 166, ${Math.max(0, 0.35 - pulseR / 150)})`;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.15) {
        const ox = Math.cos(a) * pulseR;
        const oz = Math.sin(a) * pulseR;
        const p = project(ox, 0, oz, rx, ry, cx, cy, scale);
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw Multi-Region Probing Beams (Edge Nodes -> Core)
      nodes.forEach((node) => {
        const nx = Math.cos(node.angle + t * 0.1) * node.dist;
        const nz = Math.sin(node.angle + t * 0.1) * node.dist;
        const ny = node.elevation + Math.sin(t * 2 + node.angle) * 4;

        const np = project(nx, ny, nz, rx, ry, cx, cy, scale);
        const cp = project(0, 0, 0, rx, ry, cx, cy, scale);

        // Gradient line from node to gateway core
        const grad = ctx.createLinearGradient(np.x, np.y, cp.x, cp.y);
        grad.addColorStop(0, 'rgba(20, 184, 166, 0.45)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(np.x, np.y);
        ctx.lineTo(cp.x, cp.y);
        ctx.stroke();

        // Node Glow Beacon
        ctx.fillStyle = '#14b8a6';
        ctx.beginPath();
        ctx.arc(np.x, np.y, 4.5 * np.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(np.x, np.y, 4.5 * np.scale, 0, Math.PI * 2);
        ctx.stroke();

        // Node label
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`${node.flag} ${node.name}`, np.x + 8, np.y + 3);
      });

      // Spawn periodic streaming telemetry particles
      if (Math.random() < 0.28 && particlesRef.current.length < 24) {
        const srcNode = nodes[Math.floor(Math.random() * nodes.length)];
        const nx = Math.cos(srcNode.angle + t * 0.1) * srcNode.dist;
        const nz = Math.sin(srcNode.angle + t * 0.1) * srcNode.dist;
        particlesRef.current.push({
          x: nx,
          y: srcNode.elevation,
          z: nz,
          targetX: 0,
          targetY: 0,
          targetZ: 0,
          progress: 0,
          speed: 0.018 + Math.random() * 0.012,
          color: '#14b8a6',
        });
      }

      // Update and Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.progress += pt.speed;
        if (pt.progress >= 1) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const currX = pt.x + (pt.targetX - pt.x) * pt.progress;
        const currY = pt.y + (pt.targetY - pt.y) * pt.progress;
        const currZ = pt.z + (pt.targetZ - pt.z) * pt.progress;
        const pp = project(currX, currY, currZ, rx, ry, cx, cy, scale);

        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 2.5 * pp.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Core Gateway (Hexagonal Monolith Platform)
      const coreH = 28;
      const coreR = 34;
      const topPts = [];
      const botPts = [];
      const sides = 6;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + t * 0.4;
        const px = Math.cos(a) * coreR;
        const pz = Math.sin(a) * coreR;
        topPts.push(project(px, -coreH / 2, pz, rx, ry, cx, cy, scale));
        botPts.push(project(px, coreH / 2, pz, rx, ry, cx, cy, scale));
      }

      // Draw sides
      for (let s = 0; s < sides; s++) {
        const next = (s + 1) % sides;
        ctx.fillStyle = s % 2 === 0 ? 'rgba(15, 23, 42, 0.7)' : 'rgba(30, 41, 59, 0.8)';
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(topPts[s].x, topPts[s].y);
        ctx.lineTo(topPts[next].x, topPts[next].y);
        ctx.lineTo(botPts[next].x, botPts[next].y);
        ctx.lineTo(botPts[s].x, botPts[s].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw top face
      ctx.fillStyle = 'rgba(20, 184, 166, 0.85)';
      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      for (let s = 1; s < sides; s++) {
        ctx.lineTo(topPts[s].x, topPts[s].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top glowing diamond core
      const corePing = project(0, -coreH / 2 - 8 + Math.sin(t * 3) * 3, 0, rx, ry, cx, cy, scale);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(corePing.x, corePing.y, 4 * corePing.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    // Canvas Mouse Dragging handlers
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;
      rotRef.current.y += dx * 0.008;
      rotRef.current.x = Math.max(0.1, Math.min(1.2, rotRef.current.x + dy * 0.008));
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };
    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 select-none">
      {/* 3D Perspective Wrapper */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: 1200,
        }}
        className="transition-all duration-200 ease-out"
      >
        <div
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(${tilt.s}, ${tilt.s}, 1)`,
            transformStyle: 'preserve-3d',
          }}
          className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800/90 backdrop-blur-2xl bg-white/80 dark:bg-[#0B1120]/85 shadow-2xl p-6 sm:p-8 transition-transform duration-150 ease-out overflow-hidden group"
        >
          {/* Subtle 3D Holographic Ambient Radial Glow behind the Card */}
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Card Top Strip: Primary Production API Gateway + 3D UP • 99.99% Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
            <div className="flex items-center gap-3.5">
              {/* 3D Animated Beacon Icon */}
              <div className="relative w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    Primary Production API Gateway
                  </h3>

                  {/* 3D Animated Badge: UP • 99.99% */}
                  <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs border border-emerald-500/30 shadow-sm hover:scale-105 transition-all">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>UP • 99.99%</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  <span>https://api.sentiro.xyz/v1/health</span>
                  <span>•</span>
                  <span>Interval: 30s</span>
                  <span>•</span>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">4-Edge Quorum</span>
                </div>
              </div>
            </div>

            {/* Right: Latency Gauge & Interactive Synthetic Probe Button */}
            <div className="flex items-center gap-4 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Consensus Latency
                </div>
                <div className="text-lg font-black text-teal-600 dark:text-teal-400 font-mono flex items-center justify-end gap-1.5">
                  <span>{latency} ms</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerProbe}
                disabled={isPinging}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Send interactive synthetic 3D packet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isPinging ? 'Probing...' : 'Test Probe'}</span>
              </button>
            </div>
          </div>

          {/* 3D Holographic Gateway Visualizer Canvas */}
          <div className="relative mt-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0F1D] border border-slate-800 overflow-hidden shadow-inner">
            {/* HUD Status Overlay */}
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="uppercase tracking-wider font-bold text-slate-300">
                Consensus Mesh
              </span>
            </div>

            <div className="absolute top-3 right-4 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400 pointer-events-none">
              <span className="text-emerald-400 font-bold">200 OK</span>
              <span>• Corroborated</span>
            </div>

            {/* The 3D Canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-56 sm:h-64 cursor-grab active:cursor-grabbing block"
            />

            {/* Bottom Regions HUD */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg">
              <span className="flex items-center gap-1">
                <span>🇳🇬 LOS-1 (18ms)</span>
                <span>•</span>
                <span>🇩🇪 FRA-1 (34ms)</span>
                <span>•</span>
                <span>🇺🇸 IAD-1 (42ms)</span>
                <span>•</span>
                <span>🇸🇬 SIN-1 (86ms)</span>
              </span>
              <span className="text-teal-400 font-bold hidden sm:inline">Quorum Verified</span>
            </div>
          </div>

          {/* 60-Probe SLA Matrix Uptime Bars */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Past 60 Synthetic Checks (Edge Consensus)
                </span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                100.0% Uptime
              </span>
            </div>

            {/* 60 Interactive Glowing Blocks with 3D Depth */}
            <div className="grid grid-cols-60 gap-1 h-8 p-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveProbeIndex(i)}
                  onMouseLeave={() => setActiveProbeIndex(null)}
                  className={`rounded-sm transition-all duration-150 cursor-pointer ${
                    activeProbeIndex === i
                      ? 'bg-teal-300 scale-125 z-10 shadow-md shadow-teal-400/50'
                      : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-110'
                  }`}
                  title={`Probe #${i + 1}: 200 OK (${36 + (i % 8)}ms) • Corroborated by 4 edge nodes`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>30 mins ago</span>
              <span>Updated {lastCheck}</span>
              <span>Consensus Active</span>
            </div>
          </div>

          {/* AI RCA & TLS Diagnosis HUD Callout */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-100/70 dark:bg-[#111A2E]/80 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3.5 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  Automated AI Incident Diagnosis
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold">
                  Active
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                SSL certificate valid for 74 days (Let's Encrypt ACME). TLS 1.3 negotiated in 14ms from Lagos edge node. HTTP 200 OK returned with zero packet loss across transatlantic quorum links.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
