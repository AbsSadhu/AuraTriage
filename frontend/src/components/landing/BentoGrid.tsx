'use client';

import GlowCard from './GlowCard';
import { motion } from 'framer-motion';

const features = [
    {
        title: 'Multi-Agent Swarm',
        description: 'Autonomous AI agents collaborating on differential diagnoses in real-time. Our swarm architecture allows specialized agents to debate and converge on high-confidence triage outcomes.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
        ),
        color: 'teal' as const,
        tag: 'AI ORCHESTRATION',
    },
    {
        title: 'Zero Latency',
        description: 'Edge-computed triage results in <50ms. Critical care decisions cannot wait for cloud round-trips.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        color: 'violet' as const,
        tag: 'PERFORMANCE',
    },
    {
        title: 'EHR Deep-Link',
        description: 'Seamless read/write API for Epic and Cerner. Bi-directional sync ensures no data is ever lost in translation.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
        ),
        color: 'emerald' as const,
        tag: 'INTEGRATION',
    },
    {
        title: 'NLP Symptom Extraction',
        description: 'Unstructured patient notes converted into structured clinical codes (ICD-10, SNOMED) with 99.8% accuracy. Supports Hinglish.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.2 48.2 0 005.032-.508c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
        ),
        color: 'rose' as const,
        tag: 'NLP ENGINE',
    },
];

const iconBg: Record<string, string> = {
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
};

const tagColor: Record<string, string> = {
    teal: 'text-teal-400/60',
    violet: 'text-violet-400/60',
    emerald: 'text-emerald-400/60',
    rose: 'text-rose-400/60',
};

export default function BentoGrid() {
    return (
        <section id="features" className="relative py-32 px-6 bg-[#04060a]">
            {/* Subtle noise texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
            />

            <div className="max-w-6xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <p className="text-xs font-mono text-teal-400/80 tracking-[0.2em] uppercase mb-5">System Capabilities</p>
                    <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.02em] leading-tight">
                        Clinical Intelligence, <span className="text-gradient">Orchestrated.</span>
                    </h2>
                    <p className="text-zinc-400 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
                        Deploy autonomous agents that reason like clinicians, act with machine precision, and integrate seamlessly into your existing EHR workflow.
                    </p>
                </motion.div>

                {/* Bento grid — 2x2 with GlowCards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {features.map((f, i) => (
                        <GlowCard key={f.title} color={f.color} delay={i * 0.12}>
                            {/* Tag */}
                            <p className={`text-[9px] font-mono tracking-[0.25em] uppercase mb-4 ${tagColor[f.color]}`}>{f.tag}</p>
                            {/* Icon */}
                            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${iconBg[f.color]}`}>
                                {f.icon}
                            </div>
                            {/* Title */}
                            <h3 className="font-display text-[17px] font-semibold mb-2.5 tracking-tight text-white">{f.title}</h3>
                            {/* Description */}
                            <p className="text-zinc-400 leading-relaxed text-[14px]">{f.description}</p>
                        </GlowCard>
                    ))}
                </div>
            </div>
        </section>
    );
}
