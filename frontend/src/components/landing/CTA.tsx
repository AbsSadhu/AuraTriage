'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function CTA() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end end'],
    });

    const glowScale = useTransform(scrollYProgress, [0, 1], [0.8, 1.2]);
    const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);

    return (
        <section ref={sectionRef} className="relative py-32 px-6 bg-[#04060a] overflow-hidden">
            {/* Ambient glow - pulses & scales up on scroll */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <motion.div
                    style={{ scale: glowScale, opacity: glowOpacity }}
                    className="w-[600px] h-[400px] rounded-full bg-teal-500/[0.04] blur-[150px]"
                />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-xs font-mono text-teal-400/80 tracking-[0.2em] uppercase mb-5">Ready to orchestrate?</p>
                    <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-5">
                        Start your clinical <span className="text-gradient">intelligence</span> journey
                    </h2>
                    <p className="text-zinc-400 text-base mb-10 max-w-lg mx-auto leading-relaxed">
                        Join the next generation of clinicians using AI-powered triage to save time and improve outcomes.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <a
                        href="/auth"
                        className="group relative inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold text-[15px] hover:from-teal-400 hover:to-teal-300 transition-all shadow-2xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Initialize Triage
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {/* Shimmer */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </div>
                    </a>
                </motion.div>

                {/* Compliance footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 flex flex-wrap items-center justify-center gap-6 text-[12px] text-zinc-600 font-mono"
                >
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        No credit card required
                    </span>
                    <span className="text-zinc-800">·</span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        HIPAA compliant
                    </span>
                    <span className="text-zinc-800">·</span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                        SOC2 certified
                    </span>
                </motion.div>

                {/* Footer links */}
                <div className="mt-20 pt-8 border-t border-white/[0.04]">
                    <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
                        <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-zinc-400 transition-colors">Contact</a>
                    </div>
                    <p className="text-[11px] text-zinc-700 mt-4">© 2024 AuraTriage Systems Inc. All rights reserved.</p>
                </div>
            </div>
        </section>
    );
}
