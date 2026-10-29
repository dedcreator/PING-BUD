'use client';

import React, { useRef, useEffect, useState } from 'react';
import { RotateCw, Play } from 'lucide-react';

interface Node3D {
  name: string;
  region: string;
  flag: string;
  code: string;
  latency: number;
  theta: number;
  phi: number;
  radius: number;
  status: 'operational' | 'checking';
}

export default function Interactive3DHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rotation angles (radians)
  const rotationRef = useRef({ x: 0.22, y: -0.35, vx: 0.002, vy: 0.0035 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Hovered or active node state
  const [activeNode, setActiveNode] = useState<Node3D | null>(null);
  const [simulatingQuorum, setSimulatingQuorum] = useState(false);
  const [quorumMessage, setQuorumMessage] = useState('4-Node Multi-Region Quorum Active');

  // The 4 Core Consensus Probing Regions (Enlarged Radius)
  const nodes: Node3D[] = [
    {
      name: 'Lagos, NG',
      region: 'Africa-West',
      code: 'LOS-1',
      flag: '🇳🇬',
      latency: 18,
      theta: 0.15,
      phi: 1.55,
      radius: 195,
      status: 'operational',
    },
    {
      name: 'Frankfurt, DE',
      region: 'EU-Central',
      code: 'FRA-1',
      flag: '🇩🇪',
      latency: 34,
      theta: 0.35,
      phi: 0.78,
      radius: 195,
      status: 'operational',
    },
    {
      name: 'Virginia, US',
      region: 'US-East',
      code: 'IAD-1',
      flag: '🇺🇸',
      latency: 28,
      theta: -1.35,
      phi: 0.98,
      radius: 195,
      status: 'operational',
    },
    {
      name: 'Mumbai, IN',
      region: 'AP-South',
      code: 'BOM-1',
      flag: '🇮🇳',
      latency: 72,
      theta: 1.45,
      phi: 1.28,
      radius: 195,
      status: 'operational',
    },
  ];

  // Generate background topological lattice points
  const latticePointsRef = useRef<
    Array<{ x: number; y: number; z: number; size: number }>
  >([]);

  useEffect(() => {
    const pts = [];
    const numPoints = 130;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      const r = 192;
      pts.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta),
        size: Math.random() > 0.65 ? 2.8 : 1.6,
      });
    }
    latticePointsRef.current = pts;
  }, []);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseAngle = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;
      const focalLength = 480;

      ctx.clearRect(0, 0, width, height);

      // Auto-rotation when not dragging
      if (!isDraggingRef.current) {
        rotationRef.current.y += rotationRef.current.vy;
        rotationRef.current.x += rotationRef.current.vx * 0.2;
      }

      pulseAngle += 0.035;

      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;

      const project = (x: number, y: number, z: number) => {
        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        const y1 = y;
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

        const x2 = x1;
        const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);

        const scale = focalLength / (focalLength + z2);
        return {
          px: cx + x2 * scale,
          py: cy + y2 * scale,
          scale,
          depth: z2,
        };
      };

      // 1. Draw glowing background aura
      const glowGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 260);
      glowGrad.addColorStop(0, 'rgba(13, 148, 136, 0.16)');
      glowGrad.addColorStop(0.5, 'rgba(13, 148, 136, 0.05)');
      glowGrad.addColorStop(1, 'rgba(13, 148, 136, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 260, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw rotating wireframe latitude rings
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.16)';
      ctx.lineWidth = 1;

      [-80, -40, 0, 40, 80].forEach((latY) => {
        ctx.beginPath();
        const latRadius = Math.sqrt(Math.max(0, 195 * 195 - latY * latY));
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const px3d = latRadius * Math.cos(a);
          const py3d = latY;
          const pz3d = latRadius * Math.sin(a);
          const { px, py } = project(px3d, py3d, pz3d);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });

      // 3. Draw background lattice points
      latticePointsRef.current.forEach((pt) => {
        const { px, py, scale, depth } = project(pt.x, pt.y, pt.z);
        const alpha = Math.max(0.12, (depth + 195) / 390);
        ctx.fillStyle = `rgba(15, 118, 110, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, pt.size * scale), 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Calculate 3D projected positions of the 4 Consensus Nodes
      const projectedNodes = nodes.map((node) => {
        const x = node.radius * Math.sin(node.phi) * Math.cos(node.theta);
        const y = node.radius * Math.cos(node.phi);
        const z = node.radius * Math.sin(node.phi) * Math.sin(node.theta);
        const p = project(x, y, z);
        return { ...node, ...p };
      });

      // 5. Draw Consensus Quorum Beams between nodes
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n1 = projectedNodes[i];
          const n2 = projectedNodes[j];

          ctx.beginPath();
          ctx.moveTo(n1.px, n1.py);
          ctx.lineTo(n2.px, n2.py);

          const beamGrad = ctx.createLinearGradient(n1.px, n1.py, n2.px, n2.py);
          beamGrad.addColorStop(0, 'rgba(13, 148, 136, 0.45)');
          beamGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.85)');
          beamGrad.addColorStop(1, 'rgba(13, 148, 136, 0.45)');
          ctx.strokeStyle = beamGrad;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Traveling data packet ping
          const progress = ((pulseAngle + i * 0.75) % Math.PI) / Math.PI;
          const packetX = n1.px + (n2.px - n1.px) * progress;
          const packetY = n1.py + (n2.py - n1.py) * progress;

          ctx.fillStyle = '#14b8a6';
          ctx.shadowColor = '#14b8a6';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 6. Draw each node's glowing vertex and label
      projectedNodes.forEach((node) => {
        const isHovered = activeNode?.code === node.code;
        const nodeSize = (isHovered ? 10 : 7.5) * node.scale;

        const pulseR = nodeSize * (1.6 + Math.sin(pulseAngle * 2 + node.latency) * 0.35);
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(node.px, node.py, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isHovered ? '#0f766e' : '#0d9488';
        ctx.shadowColor = '#14b8a6';
        ctx.shadowBlur = isHovered ? 16 : 9;
        ctx.beginPath();
        ctx.arc(node.px, node.py, nodeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.px, node.py, nodeSize * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 11px monospace';
        const labelText = `${node.flag} ${node.code} (${node.latency}ms)`;
        const textMetrics = ctx.measureText(labelText);
        const badgeW = textMetrics.width + 14;
        const badgeH = 20;
        const badgeX = node.px + 12;
        const badgeY = node.py - 10;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.strokeStyle = 'rgba(13, 148, 136, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - 13, badgeW, badgeH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(labelText, badgeX + 7, badgeY + 1);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeNode]);

  // Mouse & Touch Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;
        rotationRef.current.vy = 0.003 + normX * 0.005;
        rotationRef.current.vx = normY * 0.003;
      }
      return;
    }

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    rotationRef.current.y += dx * 0.008;
    rotationRef.current.x += dy * 0.008;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Quorum Simulation Trigger
  const triggerSimulation = () => {
    setSimulatingQuorum(true);
    setQuorumMessage('Simulating consensus check across 4 regions...');
    setTimeout(() => {
      setQuorumMessage('Consensus Corroborated! Zero false alarms.');
      setSimulatingQuorum(false);
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto overflow-visible select-none"
    >
      {/* Big Seamless Canvas - Zero card styling, zero box-shadow */}
      <div
        className="relative h-[440px] sm:h-[520px] w-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}
