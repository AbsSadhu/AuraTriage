'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import SplitText from '@/components/reactbits/SplitText';

const Beams = dynamic(() => import('@/components/landing/Beams'), { ssr: false });

// Clinical DNA + pulse logo mark as inline SVG
const ClinicalLogo = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <filter id="logoGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
        </defs>
        {/* Outer ring */}
        <circle cx="18" cy="18" r="16.5" stroke="url(#logoGrad)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
        {/* ECG / Pulse waveform */}
        <polyline
            points="4,18 8,18 10,11 12,25 14,14 16,22 18,10 20,26 22,16 24,20 28,18 32,18"
            stroke="url(#logoGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#logoGlow)"
        />
        {/* Subtle center dot */}
        <circle cx="18" cy="18" r="2" fill="url(#logoGrad)" opacity="0.8" />
    </svg>
);

// Glassmorphism liquid-metal primary button
const GlassButton = ({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) => {
    const ref = useRef<HTMLAnchorElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mx', `${x}%`);
        el.style.setProperty('--my', `${y}%`);
    };

    if (primary) {
        return (
            <a
                ref={ref}
                href={href}
                onMouseMove={handleMouseMove}
                className="glass-btn-primary group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-sm overflow-hidden"
                style={{ '--mx': '50%', '--my': '50%' } as React.CSSProperties}
            >
                {/* Liquid metal gradient core */}
                <span className="absolute inset-0 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(20,184,166,0.9) 0%, rgba(124,58,237,0.9) 100%)',
                    }}
                />
                {/* Sheen overlay that tracks mouse */}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: 'radial-gradient(ellipse 80px 40px at var(--mx) var(--my), rgba(255,255,255,0.25), transparent)',
                    }}
                />
                {/* Frosted glass inner highlight */}
                <span className="absolute inset-[1px] rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
                    }}
                />
                {/* Chrome border */}
                <span className="absolute inset-0 rounded-full"
                    style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.25), 0 4px 24px rgba(20,184,166,0.35), 0 2px 8px rgba(124,58,237,0.2)' }}
                />
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </span>
            </a>
        );
    }

    return (
        <a
            ref={ref}
            href={href}
            onMouseMove={handleMouseMove}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-zinc-300 font-medium text-sm overflow-hidden"
            style={{ '--mx': '50%', '--my': '50%' } as React.CSSProperties}
        >
            {/* Frosted glass base */}
            <span className="absolute inset-0 rounded-full backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.04)' }}
            />
            {/* Mouse-tracking inner glow */}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'radial-gradient(ellipse 60px 40px at var(--mx) var(--my), rgba(20,184,166,0.15), transparent)',
                }}
            />
            {/* Aurora border */}
            <span className="absolute inset-0 rounded-full"
                style={{
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.4), rgba(124,58,237,0.4)) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'destination-out',
                    mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    border: '1px solid transparent',
                    boxShadow: '0 0 0 1px rgba(20,184,166,0.2)',
                }}
            />
            <span className="relative z-10 group-hover:text-white transition-colors">{children}</span>
        </a>
    );
};

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });

    const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <section ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden bg-black">
            {/* WebGL Beams Background */}
            <div className="absolute inset-0 z-0">
                <Beams
                    beamWidth={3}
                    beamHeight={30}
                    beamNumber={20}
                    lightColor="#fbeeee"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={0.2}
                    rotation={30}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
            </div>

            {/* Floating nav */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="fixed top-0 left-0 right-0 z-50"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3">
                        {/* Clinical logo mark */}
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(20,184,166,0.2)' }}>
                            <ClinicalLogo />
                        </div>
                        <span className="font-display font-semibold tracking-wide text-[15px] text-white">AuraTriage</span>
                        <span className="hidden sm:block text-[9px] font-mono text-zinc-600 tracking-widest uppercase mt-0.5">🇮🇳 ABDM</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-[13px] text-zinc-400 font-medium">
                        <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
                        <a href="#testimonials" className="hover:text-white transition-colors duration-200">Testimonials</a>
                        <a href="#" className="hover:text-white transition-colors duration-200">Research</a>
                        <GlassButton href="/auth" primary>Get Access</GlassButton>
                    </div>
                </div>
            </motion.nav>

            {/* Hero content */}
            <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-8">
                {/* Beta badge */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mb-8">
                    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full"
                        style={{ border: '1px solid rgba(20,184,166,0.2)', background: 'rgba(20,184,166,0.06)', backdropFilter: 'blur(8px)' }}>
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-sm shadow-teal-400/50" />
                        <span className="text-xs font-medium text-teal-300 tracking-wider uppercase">Now in Private Beta v0.9</span>
                    </div>
                </motion.div>

                {/* Main headline */}
                <div className="text-center max-w-5xl mb-6">
                    <div className="mb-1">
                        <SplitText text="Healthcare," className="font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-white"
                            delay={40} duration={0.7} ease="power3.out" splitType="chars"
                            from={{ opacity: 0, y: 60, rotateX: -30 }} to={{ opacity: 1, y: 0, rotateX: 0 }}
                            threshold={0.01} rootMargin="0px" textAlign="center" tag="h1" />
                    </div>
                    <SplitText text="Orchestrated." className="font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-gradient"
                        delay={40} duration={0.7} ease="power3.out" splitType="chars"
                        from={{ opacity: 0, y: 60, rotateX: -30 }} to={{ opacity: 1, y: 0, rotateX: 0 }}
                        threshold={0.01} rootMargin="0px" textAlign="center" tag="h1" />
                </div>

                {/* Subtitle */}
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }}
                    className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed text-center mb-10">
                    The AI Clinical Orchestrator for modern medicine. Streamline diagnostics,
                    predict patient outcomes, and optimize triage with military-grade precision.
                </motion.p>

                {/* Glassmorphism CTA buttons */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.3 }}
                    className="flex items-center gap-4">
                    <GlassButton href="/auth" primary>Start Triage</GlassButton>
                    <GlassButton href="#features">Documentation</GlassButton>
                </motion.div>
            </motion.div>

            {/* Bottom feature pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="relative z-10 pb-12">
                <div className="flex flex-wrap items-center justify-center gap-8 text-[13px] text-zinc-500 font-medium">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Cognitive Diagnosis
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                        Predictive Triage
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Sovereign Security
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
