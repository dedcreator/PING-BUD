'use client';

import React, { useRef, useEffect } from 'react';
import { Project } from '../types';

interface ThreeDWorkspaceClusterProps {
  projects: Project[];
  activeSlug: string;
  isSubmitting?: boolean;
}

export default function ThreeDWorkspaceCluster({
  projects,
  activeSlug,
  isSubmitting = false,
}: ThreeDWorkspaceClusterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef({ x: 0.55, y: -0.65, vx: 0.004, vy: 0.007 });

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

    const project3D = (x: number, y: number, z: number, rx: number, ry: number, cx: number, cy: number, scale: number) => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fl = 300;
      const depth = fl / (fl + z2 + 200);
      return {
        px: cx + x1 * depth * scale,
        py: cy + y2 * depth * scale,
        depth,
        z: z2,
      };
    };

    const drawIsoBox = (
      bx: number,
      by: number,
      bz: number,
      bs: number,
      rx: number,
      ry: number,
      cx: number,
      cy: number,
      color: string,
      isActive: boolean
    ) => {
      const h = bs * 0.45;
      const w = bs * 0.9;
      const d = bs * 0.9;

      const v = [
        [-w, -h, -d], [w, -h, -d], [w, -h, d], [-w, -h, d], // top
        [-w, h, -d], [w, h, -d], [w, h, d], [-w, h, d],       // bottom
      ];

      const proj = v.map(([vx, vy, vz]) => project3D(bx + vx, by + vy, bz + vz, rx, ry, cx, cy, 1));

      // Draw Top Face
      ctx.fillStyle = isActive ? 'rgba(20, 184, 166, 0.45)' : 'rgba(99, 102, 241, 0.2)';
      ctx.beginPath();
      ctx.moveTo(proj[0].px, proj[0].py);
      ctx.lineTo(proj[1].px, proj[1].py);
      ctx.lineTo(proj[2].px, proj[2].py);
      ctx.lineTo(proj[3].px, proj[3].py);
      ctx.closePath();
      ctx.fill();

      // Edges
      ctx.strokeStyle = isActive ? '#14b8a6' : color;
      ctx.lineWidth = isActive ? 2 : 1.2;
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];
      edges.forEach(([v1, v2]) => {
        ctx.beginPath();
        ctx.moveTo(proj[v1].px, proj[v1].py);
        ctx.lineTo(proj[v2].px, proj[v2].py);
        ctx.stroke();
      });

      // Beacon beam on active workspace
      if (isActive) {
        const topCenter = project3D(bx, by - h, bz, rx, ry, cx, cy, 1);
        const beamTop = project3D(bx, by - h - 35, bz, rx, ry, cx, cy, 1);
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(topCenter.px, topCenter.py);
        ctx.lineTo(beamTop.px, beamTop.py);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(beamTop.px, beamTop.py, 3.5 * beamTop.depth, 0, Math.PI * 2);
        ctx.fill();
      }
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

      rotRef.current.x += rotRef.current.vx;
      rotRef.current.y += rotRef.current.vy;

      const rx = rotRef.current.x;
      const ry = rotRef.current.y;

      const count = Math.max(projects.length, 1);
      const spacing = 45;

      // Draw multi-tenant workspace blocks in 3D grid
      projects.forEach((proj, i) => {
        const isActive = proj.slug === activeSlug;
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bx = (col - 1) * spacing;
        const bz = (row - 0.5) * spacing;
        const by = Math.sin(t * 2 + i) * 6;

        drawIsoBox(
          bx,
          by,
          bz,
          26,
          rx,
          ry,
          cx,
          cy,
          isActive ? '#14b8a6' : 'rgba(148, 163, 184, 0.5)',
          isActive
        );
      });

      // If submitting, render a new assembling holographic box
      if (isSubmitting) {
        const spawnY = -60 + Math.sin(t * 8) * 10;
        drawIsoBox(0, spawnY, 0, 26, rx, ry, cx, cy, '#f59e0b', true);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [projects, activeSlug, isSubmitting]);

  return (
    <div className="relative h-28 w-full rounded-xl bg-slate-900/5 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden select-none mb-3">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
