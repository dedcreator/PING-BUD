'use client';

import React, { useRef, useEffect } from 'react';
import { MonitorType } from '../types';

interface ThreeDProtocolHologramProps {
  type: MonitorType;
  isTesting?: boolean;
  testResult?: { ok: boolean; latency_ms: number } | null;
  className?: string;
}

export default function ThreeDProtocolHologram({
  type,
  isTesting = false,
  testResult = null,
  className = '',
}: ThreeDProtocolHologramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef({ x: 0.3, y: 0.2, vx: 0.008, vy: 0.012 });
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });

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

    // 3D Point Projection Helper
    const project = (x: number, y: number, z: number, rx: number, ry: number, cx: number, cy: number, scale: number) => {
      // Rotate around Y
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate around X
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Perspective divide
      const fl = 320;
      const depth = fl / (fl + z2 + 180);
      return {
        px: cx + x1 * depth * scale,
        py: cy + y2 * depth * scale,
        depth,
        z: z2,
      };
    };

    const render = () => {
      t += 0.025;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Auto rotation
      if (!mouseRef.current.isDown) {
        rotRef.current.x += rotRef.current.vx;
        rotRef.current.y += rotRef.current.vy;
      }

      const rx = rotRef.current.x;
      const ry = rotRef.current.y;
      const baseScale = Math.min(w, h) * 0.42;

      // Primary color based on state
      let colorPrimary = 'rgba(13, 148, 136, '; // teal
      let colorAccent = 'rgba(99, 102, 241, ';  // indigo

      if (isTesting) {
        colorPrimary = 'rgba(234, 179, 8, '; // yellow/scanning
        colorAccent = 'rgba(249, 115, 22, '; // orange
      } else if (testResult) {
        if (testResult.ok) {
          colorPrimary = 'rgba(16, 185, 129, '; // emerald
          colorAccent = 'rgba(20, 184, 166, ';
        } else {
          colorPrimary = 'rgba(239, 68, 68, '; // rose
          colorAccent = 'rgba(244, 63, 94, ';
        }
      } else if (type === 'ssl') {
        colorPrimary = 'rgba(16, 185, 129, ';
        colorAccent = 'rgba(56, 189, 248, ';
      } else if (type === 'ping') {
        colorPrimary = 'rgba(139, 92, 246, ';
        colorAccent = 'rgba(236, 72, 153, ';
      } else if (type === 'port') {
        colorPrimary = 'rgba(249, 115, 22, ';
        colorAccent = 'rgba(234, 179, 8, ';
      } else if (type === 'heartbeat') {
        colorPrimary = 'rgba(236, 72, 153, ';
        colorAccent = 'rgba(168, 85, 247, ';
      }

      // Draw background 3D depth grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      for (let r = 20; r <= baseScale * 1.3; r += 26) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.3) {
          const pt = project(Math.cos(a) * r, 30, Math.sin(a) * r, rx * 0.2, ry * 0.2, cx, cy + 30, 1);
          if (a === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // PROTOCOL SPECIFIC 3D MODELS
      if (type === 'http' || type === 'keyword') {
        // --- 3D WIREFRAME SPHERE + ORBITING SATELLITE NODES ---
        const rings = 5;
        const ptsPerRing = 18;
        const sphereRadius = baseScale * 0.75;

        // Longitude rings
        for (let ring = 0; ring < rings; ring++) {
          const phi = (Math.PI / (rings + 1)) * (ring + 1);
          const rRing = sphereRadius * Math.sin(phi);
          const yRing = sphereRadius * Math.cos(phi);

          ctx.beginPath();
          ctx.strokeStyle = colorPrimary + '0.35)';
          for (let p = 0; p <= ptsPerRing; p++) {
            const th = (p / ptsPerRing) * Math.PI * 2;
            const pt = project(Math.cos(th) * rRing, yRing, Math.sin(th) * rRing, rx, ry, cx, cy, 1);
            if (p === 0) ctx.moveTo(pt.px, pt.py);
            else ctx.lineTo(pt.px, pt.py);
          }
          ctx.stroke();
        }

        // Orbiting ping satellites
        const numSats = isTesting ? 6 : 3;
        for (let s = 0; s < numSats; s++) {
          const sAngle = t * 1.6 + (s * Math.PI * 2) / numSats;
          const sRad = sphereRadius * 1.35;
          const sx = Math.cos(sAngle) * sRad;
          const sy = Math.sin(sAngle * 0.8) * (sphereRadius * 0.6);
          const sz = Math.sin(sAngle) * sRad;
          const pSat = project(sx, sy, sz, rx, ry, cx, cy, 1);

          // Satellite glow
          const grad = ctx.createRadialGradient(pSat.px, pSat.py, 0, pSat.px, pSat.py, 12 * pSat.depth);
          grad.addColorStop(0, colorAccent + '0.9)');
          grad.addColorStop(1, colorAccent + '0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pSat.px, pSat.py, 12 * pSat.depth, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pSat.px, pSat.py, 3.5 * pSat.depth, 0, Math.PI * 2);
          ctx.fill();

          // Ping line to center
          if (isTesting || s === 0) {
            const pCenter = project(0, 0, 0, rx, ry, cx, cy, 1);
            ctx.strokeStyle = colorPrimary + '0.6)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pCenter.px, pCenter.py);
            ctx.lineTo(pSat.px, pSat.py);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      } else if (type === 'ping') {
        // --- 3D RADAR CONCENTRIC SONAR DISKS ---
        const numDisks = 5;
        const maxRad = baseScale * 0.95;

        for (let i = 0; i < numDisks; i++) {
          const phase = (t * 0.8 + i / numDisks) % 1;
          const curRad = phase * maxRad;
          const curY = Math.sin(phase * Math.PI) * 20 - 10;
          const alpha = (1 - phase) * 0.7;

          ctx.beginPath();
          ctx.strokeStyle = colorPrimary + `${alpha})`;
          ctx.lineWidth = 1.5;

          const steps = 32;
          for (let s = 0; s <= steps; s++) {
            const a = (s / steps) * Math.PI * 2;
            const pt = project(Math.cos(a) * curRad, curY, Math.sin(a) * curRad, rx, ry, cx, cy, 1);
            if (s === 0) ctx.moveTo(pt.px, pt.py);
            else ctx.lineTo(pt.px, pt.py);
          }
          ctx.stroke();
        }

        // 3D Sweeping Radar Beam
        const sweepAngle = t * 2.8;
        const beamEnd = project(Math.cos(sweepAngle) * maxRad, 0, Math.sin(sweepAngle) * maxRad, rx, ry, cx, cy, 1);
        const beamCenter = project(0, 0, 0, rx, ry, cx, cy, 1);

        ctx.beginPath();
        ctx.strokeStyle = colorAccent + '0.95)';
        ctx.lineWidth = 2;
        ctx.moveTo(beamCenter.px, beamCenter.py);
        ctx.lineTo(beamEnd.px, beamEnd.py);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(beamEnd.px, beamEnd.py, 4 * beamEnd.depth, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'ssl') {
        // --- 3D DUAL-AXIS CRYPTOGRAPHIC GYROSCOPE RINGS ---
        const ringRadius = baseScale * 0.8;
        const steps = 36;

        // Ring 1: Horizontal tilt
        ctx.beginPath();
        ctx.strokeStyle = colorPrimary + '0.8)';
        ctx.lineWidth = 2;
        for (let s = 0; s <= steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          const pt = project(Math.cos(a) * ringRadius, Math.sin(a) * (ringRadius * 0.3), Math.sin(a) * ringRadius, rx, ry, cx, cy, 1);
          if (s === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();

        // Ring 2: Vertical tilt
        ctx.beginPath();
        ctx.strokeStyle = colorAccent + '0.8)';
        ctx.lineWidth = 2;
        for (let s = 0; s <= steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          const pt = project(Math.sin(a) * (ringRadius * 0.2), Math.cos(a) * ringRadius, Math.sin(a) * ringRadius, rx + Math.PI / 3, ry + t * 0.5, cx, cy, 1);
          if (s === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();

        // Central Shield Lock Core
        const pCore = project(0, 0, 0, rx, ry, cx, cy, 1);
        ctx.fillStyle = colorPrimary + '0.9)';
        ctx.beginPath();
        ctx.arc(pCore.px, pCore.py, 8 * pCore.depth, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'port') {
        // --- 3D ROTATING ISOMETRIC SOCKET CUBE ---
        const s = baseScale * 0.55;
        const vertices = [
          [-s, -s, -s],
          [s, -s, -s],
          [s, s, -s],
          [-s, s, -s],
          [-s, -s, s],
          [s, -s, s],
          [s, s, s],
          [-s, s, s],
        ];

        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ];

        const projVerts = vertices.map(([vx, vy, vz]) => project(vx, vy, vz, rx, ry, cx, cy, 1));

        ctx.strokeStyle = colorPrimary + '0.75)';
        ctx.lineWidth = 1.8;
        edges.forEach(([v1, v2]) => {
          ctx.beginPath();
          ctx.moveTo(projVerts[v1].px, projVerts[v1].py);
          ctx.lineTo(projVerts[v2].px, projVerts[v2].py);
          ctx.stroke();
        });

        // Pulsing Socket Nodes on Vertices
        projVerts.forEach((pv, idx) => {
          const pulse = (Math.sin(t * 3 + idx) + 1) * 0.5;
          ctx.fillStyle = idx % 2 === 0 ? colorAccent + '0.9)' : '#ffffff';
          ctx.beginPath();
          ctx.arc(pv.px, pv.py, (3 + pulse * 2) * pv.depth, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (type === 'heartbeat') {
        // --- 3D OSCILLATING CARDIOGRAM WAVE SPHERE ---
        const rSphere = baseScale * 0.75;
        const count = 48;
        ctx.beginPath();
        ctx.strokeStyle = colorPrimary + '0.9)';
        ctx.lineWidth = 2.2;

        for (let i = 0; i <= count; i++) {
          const a = (i / count) * Math.PI * 2;
          const ekgPulse = Math.sin(i * 12 + t * 6) > 0.7 ? Math.sin(t * 8) * 28 : 0;
          const rad = rSphere + ekgPulse;
          const pt = project(Math.cos(a) * rad, Math.sin(a * 2 + t) * 15, Math.sin(a) * rad, rx, ry, cx, cy, 1);
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
      } else {
        // --- 3D OCTAHEDRON LATTICE (DNS & Default) ---
        const rad = baseScale * 0.75;
        const octVerts = [
          [0, -rad, 0],
          [rad, 0, 0],
          [0, 0, rad],
          [-rad, 0, 0],
          [0, 0, -rad],
          [0, rad, 0],
        ];

        const octEdges = [
          [0, 1], [0, 2], [0, 3], [0, 4],
          [5, 1], [5, 2], [5, 3], [5, 4],
          [1, 2], [2, 3], [3, 4], [4, 1],
        ];

        const proj = octVerts.map(([vx, vy, vz]) => project(vx, vy, vz, rx, ry, cx, cy, 1));
        ctx.strokeStyle = colorPrimary + '0.7)';
        ctx.lineWidth = 1.5;
        octEdges.forEach(([v1, v2]) => {
          ctx.beginPath();
          ctx.moveTo(proj[v1].px, proj[v1].py);
          ctx.lineTo(proj[v2].px, proj[v2].py);
          ctx.stroke();
        });

        proj.forEach((pv) => {
          ctx.fillStyle = colorAccent + '0.95)';
          ctx.beginPath();
          ctx.arc(pv.px, pv.py, 4 * pv.depth, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Central glowing core
      const corePt = project(0, 0, 0, rx, ry, cx, cy, 1);
      const coreGrad = ctx.createRadialGradient(corePt.px, corePt.py, 0, corePt.px, corePt.py, 22 * corePt.depth);
      coreGrad.addColorStop(0, colorPrimary + '0.55)');
      coreGrad.addColorStop(1, colorPrimary + '0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(corePt.px, corePt.py, 22 * corePt.depth, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    // Mouse drag handlers
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
  }, [type, isTesting, testResult]);

  return (
    <div className={`relative overflow-hidden rounded-2xl select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
    </div>
  );
}
