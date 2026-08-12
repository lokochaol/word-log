"use client";

import { useEffect, useRef } from "react";
import type { WordGraph } from "@/lib/words";

interface Particle {
  id: string;
  text: string;
  degree: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function WordGraphBackground({ graph }: { graph: WordGraph }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || graph.nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = window.innerWidth;
    let height = window.innerHeight;
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const maxDegree = Math.max(1, ...graph.nodes.map((n) => n.degree));
    const hubThreshold = Math.max(2, maxDegree * 0.6);

    const particles: Particle[] = graph.nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * width * 0.8,
      y: height / 2 + (Math.random() - 0.5) * height * 0.8,
      vx: 0,
      vy: 0,
    }));
    const byId = new Map(particles.map((p) => [p.id, p]));
    const edges = graph.edges
      .map((e) => ({ a: byId.get(e.source), b: byId.get(e.target) }))
      .filter((e): e is { a: Particle; b: Particle } => !!e.a && !!e.b);

    let raf = 0;
    let t = 0;

    function tick() {
      t += 1;
      const cx = width / 2;
      const cy = height / 2;

      for (const p of particles) {
        // gentle pull toward center
        p.vx += (cx - p.x) * 0.0006;
        p.vy += (cy - p.y) * 0.0006;
      }

      // repulsion between all pairs (cheap enough for personal-dictionary-sized graphs)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = Math.max(dx * dx + dy * dy, 400);
          const force = 2400 / distSq;
          const dist = Math.sqrt(distSq);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // spring attraction along edges
      for (const { a, b } of edges) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const target = 140;
        const force = (dist - target) * 0.0009;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      for (const p of particles) {
        if (!reducedMotion) {
          p.vx += Math.sin(t * 0.006 + p.x * 0.01) * 0.012;
          p.vy += Math.cos(t * 0.006 + p.y * 0.01) * 0.012;
        }
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx;
        p.y += p.vy;
      }

      ctx!.clearRect(0, 0, width, height);

      ctx!.strokeStyle = "rgba(255,255,255,0.06)";
      ctx!.lineWidth = 1;
      for (const { a, b } of edges) {
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }

      for (const p of particles) {
        const isHub = p.degree >= hubThreshold;
        const r = 2 + Math.min(p.degree, 6) * 0.9;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = isHub ? "rgba(255,61,26,0.75)" : "rgba(255,255,255,0.22)";
        ctx!.fill();

        if (isHub) {
          ctx!.font = "12px var(--font-inter, sans-serif)";
          ctx!.fillStyle = "rgba(255,61,26,0.55)";
          ctx!.fillText(p.text, p.x + r + 6, p.y + 4);
        }
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [graph]);

  if (graph.nodes.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
