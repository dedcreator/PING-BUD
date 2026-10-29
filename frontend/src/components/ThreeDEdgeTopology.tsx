'use client';

import React, { useRef, useEffect } from 'react';
import { MonitorEdgeBreakdown } from '../types';

interface ThreeDEdgeTopologyProps {
  monitorName: string;
  isChecking?: boolean;
  edgeData?: MonitorEdgeBreakdown | null;
  className?: string;
}

export default function ThreeDEdgeTopology({
  monitorName,
  isChecking = false,
  edgeData = null,
  className = '',
}: ThreeDEdgeTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef({ x: 0.35, y: -0.4, vx: 0.003, vy: 0.005 });
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });

  // 4 Global Edge Nodes Coordinates in 3D (Spherical projection)
  const edgeNodes = [
    { name: 'Lagos', flag: '🇳🇬', region: 'Africa-West', theta: 0.1, phi: 1.55, latency: 43 },
    { name: 'Frankfurt', flag: '🇩🇪', region: 'EU-Central', theta: 0.38, phi: 0.85, latency: 64 },
    { name: 'N. Virginia', flag: '🇺🇸', region: 'US-East', theta: -0.85, phi: 1.05, latency: 90 },
    { name: 'Singapore', flag: '🇸🇬', region: 'Asia-SE', theta: 1.82, phi: 1.62, latency: 116 },
  ];

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

    // 3D Projection Helper
    const project = (x: number, y: number, z: number, rx: number, ry: number, cx: number, cy: number, scale: number) => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fl = 320;
      const depth = fl / (fl + z2 + 200);
      return {
        px: cx + x1 * depth * scale,
        py: cy + y2 * depth * scale,
        depth,
        z: z2,
      };
    };

    const render = () => {
      t += isChecking ? 0.06 : 0.02;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      if (!mouseRef.current.isDown) {
        rotRef.current.x += rotRef.current.vx;
        rotRef.current.y += rotRef.current.vy;
      }

      const rx = rotRef.current.x;
      const ry = rotRef.current.y;
      const radius = Math.min(w, h) * 0.38;

      // Draw 3D Globe Latitude Rings
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      const latSteps = 4;
      for (let i = 1; i <= latSteps; i++) {
        const phi = (Math.PI / (latSteps + 1)) * i;
        const ringRad = radius * Math.sin(phi);
        const ringY = radius * Math.cos(phi);

        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.2) {
          const pt = project(Math.cos(a) * ringRad, ringY, Math.sin(a) * ringRad, rx, ry, cx, cy, 1);
          if (a === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
      }

      // Center Target Node
      const pTarget = project(0, 0, 0, rx, ry, cx, cy, 1);
      const targetGrad = ctx.createRadialGradient(pTarget.px, pTarget.py, 0, pTarget.px, pTarget.py, 16 * pTarget.depth);
      targetGrad.addColorStop(0, 'rgba(20, 184, 166, 0.95)');
      targetGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = targetGrad;
      ctx.beginPath();
      ctx.arc(pTarget.px, pTarget.py, 16 * pTarget.depth, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pTarget.px, pTarget.py, 4.5 * pTarget.depth, 0, Math.PI * 2);
      ctx.fill();

      // Render 3D Edge Nodes & Curved Arcs
      edgeNodes.forEach((node, idx) => {
        const nx = radius * Math.sin(node.phi) * Math.cos(node.theta);
        const ny = radius * Math.cos(node.phi);
        const nz = radius * Math.sin(node.phi) * Math.sin(node.theta);

        const pNode = project(nx, ny, nz, rx, ry, cx, cy, 1);

        // 3D Parabolic Curved Arc from Center to Edge Node
        ctx.beginPath();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = isChecking ? 'rgba(245, 158, 11, 0.65)' : 'rgba(99, 102, 241, 0.4)';

        const arcSteps = 24;
        for (let s = 0; s <= arcSteps; s++) {
          const frac = s / arcSteps;
          // Interpolate with parabolic curve height
          const curveElev = Math.sin(frac * Math.PI) * (radius * 0.45);
          const ax = nx * frac;
          const ay = ny * frac - curveElev;
          const az = nz * frac;

          const pArc = project(ax, ay, az, rx, ry, cx, cy, 1);
          if (s === 0) ctx.moveTo(pArc.px, pArc.py);
          else ctx.lineTo(pArc.px, pArc.py);
        }
        ctx.stroke();

        // Traveling Ping Packet along Arc
        const packetFrac = (t * (isChecking ? 1.8 : 0.6) + idx * 0.25) % 1;
        const curveElev = Math.sin(packetFrac * Math.PI) * (radius * 0.45);
        const px = nx * packetFrac;
        const py = ny * packetFrac - curveElev;
        const pz = nz * packetFrac;
        const pPacket = project(px, py, pz, rx, ry, cx, cy, 1);

        // Ping packet glow
        const pGrad = ctx.createRadialGradient(pPacket.px, pPacket.py, 0, pPacket.px, pPacket.py, 9 * pPacket.depth);
        pGrad.addColorStop(0, '#10b981');
        pGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(pPacket.px, pPacket.py, 9 * pPacket.depth, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pPacket.px, pPacket.py, 2.5 * pPacket.depth, 0, Math.PI * 2);
        ctx.fill();

        // Edge Node Marker
        const nodeGrad = ctx.createRadialGradient(pNode.px, pNode.py, 0, pNode.px, pNode.py, 12 * pNode.depth);
        nodeGrad.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
        nodeGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(pNode.px, pNode.py, 12 * pNode.depth, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pNode.px, pNode.py, 3.8 * pNode.depth, 0, Math.PI * 2);
        ctx.fill();

        // 3D Billboard Label
        if (pNode.z > -120) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#64748b';
          const latencyVal = edgeData?.nodes?.[idx]?.latency_ms || node.latency;
          const label = `${node.flag} ${node.name} (${latencyVal}ms)`;
          ctx.fillText(label, pNode.px + 8, pNode.py - 6);
        }
      });

      // Target Name Label at Center
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#0f172a';
      if (document.documentElement.classList.contains('dark')) {
        ctx.fillStyle = '#e2e8f0';
      }
      ctx.fillText(monitorName, pTarget.px - 30, pTarget.py + 18);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    // Mouse Drag handlers
    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;
      rotRef.current.y += dx * 0.01;
      rotRef.current.x += dy * 0.01;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [monitorName, isChecking, edgeData]);

  return (
    <div className={`relative h-44 w-full rounded-xl bg-slate-950/[0.03] dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 overflow-hidden select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
      <div className="absolute top-2 left-2.5 flex items-center gap-2 pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          3D Multi-Region Quorum Topology
        </span>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-2 py-0.5 rounded-full pointer-events-none">
        Drag to inspect 3D Quorum
      </div>
    </div>
  );
}
