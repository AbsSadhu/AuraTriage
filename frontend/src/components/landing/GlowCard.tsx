'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
    children: React.ReactNode;
    color?: 'teal' | 'violet' | 'emerald' | 'rose';
    className?: string;
    delay?: number;
}

const colorMap = {
    teal: { glow: '0, 240, 200', border: 'rgba(0,240,200,0.7)', bg: 'rgba(0,240,200,0.04)' },
    violet: { glow: '139, 92, 246', border: 'rgba(139,92,246,0.7)', bg: 'rgba(139,92,246,0.04)' },
    emerald: { glow: '52, 211, 153', border: 'rgba(52,211,153,0.7)', bg: 'rgba(52,211,153,0.04)' },
    rose: { glow: '251, 113, 133', border: 'rgba(251,113,133,0.7)', bg: 'rgba(251,113,133,0.04)' },
};

export default function GlowCard({ children, color = 'teal', className = '', delay = 0 }: GlowCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>(0);
    const c = colorMap[color];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let t = Math.random() * 100;

        const resize = () => {
            const container = containerRef.current;
            if (!container) return;
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };
        resize();
        const ro = new ResizeObserver(resize);
        if (containerRef.current) ro.observe(containerRef.current);

        const draw = () => {
            const w = canvas.width;
            const h = canvas.height;
            if (!w || !h) { animRef.current = requestAnimationFrame(draw); return; }

            ctx.clearRect(0, 0, w, h);
            t += 0.008;

            // Animated glow dot position along border
            const perimeter = 2 * (w + h);
            const pos = ((t * 0.4 % 1) + 1) % 1;
            const dist = pos * perimeter;

            let dotX = 0; let dotY = 0;
            if (dist < w) { dotX = dist; dotY = 0; }
            else if (dist < w + h) { dotX = w; dotY = dist - w; }
            else if (dist < 2 * w + h) { dotX = w - (dist - w - h); dotY = h; }
            else { dotX = 0; dotY = h - (dist - 2 * w - h); }

            // Draw border with gradient corners
            const r = 16; // border-radius
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, `rgba(${c.glow}, 0.15)`);
            grad.addColorStop(0.5, `rgba(${c.glow}, 0.25)`);
            grad.addColorStop(1, `rgba(${c.glow}, 0.12)`);

            ctx.save();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            roundRect(ctx, 0.75, 0.75, w - 1.5, h - 1.5, r);
            ctx.stroke();
            ctx.restore();

            // Glowing orb along the border
            const orbGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 60);
            orbGrad.addColorStop(0, `rgba(${c.glow}, 0.9)`);
            orbGrad.addColorStop(0.3, `rgba(${c.glow}, 0.4)`);
            orbGrad.addColorStop(1, `rgba(${c.glow}, 0)`);
            ctx.save();
            ctx.fillStyle = orbGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animRef.current);
            ro.disconnect();
        };
    }, [color, c.glow]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
            className={`relative rounded-2xl overflow-hidden cursor-default group ${className}`}
            style={{ background: 'rgba(7, 9, 14, 0.85)', backdropFilter: 'blur(12px)' }}
        >
            {/* WebGL-style canvas border */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                style={{ borderRadius: '1rem' }}
            />

            {/* Inner background glow on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                style={{ background: `radial-gradient(ellipse at 50% 50%, ${c.bg} 0%, transparent 70%)` }}
            />

            {/* Static dim border baseline */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none z-0"
                style={{ boxShadow: `inset 0 0 0 1px rgba(${c.glow}, 0.15)` }}
            />

            {/* Content */}
            <div className="relative z-10 p-8">
                {children}
            </div>
        </motion.div>
    );
}

// Helper: rounded rect path
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
