'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const testimonials = [
    {
        name: 'Dr. S. K.',
        role: 'Chief of Medicine',
        quote: '"AuraTriage drastically reduced our triage backlog within the first week of deployment. The accuracy is frighteningly good."',
        initials: 'SK',
        gradient: 'from-teal-400 to-cyan-400',
    },
    {
        name: 'Dr. A. M.',
        role: 'Emergency Dept. Head',
        quote: '"The zero latency promise is real. We get differentials before the patient is even fully registered. It\'s a game changer."',
        initials: 'AM',
        gradient: 'from-violet-400 to-fuchsia-400',
    },
    {
        name: 'Dr. J. R.',
        role: 'Clinical Director',
        quote: '"Integration with Epic was seamless. We didn\'t have to change our workflow, Aura just works in the background."',
        initials: 'JR',
        gradient: 'from-emerald-400 to-teal-400',
    },
    {
        name: 'Dr. L. M.',
        role: 'Neurology Lead',
        quote: '"The multi-agent swarm catches nuances that tired residents might miss at 3 AM. It\'s like having a second board-certified opinion instantly."',
        initials: 'LM',
        gradient: 'from-amber-400 to-orange-400',
    },
];

export default function Testimonials() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    });

    const marqueeY = useTransform(scrollYProgress, [0, 1], ['5%', '-5%']);

    return (
        <section ref={sectionRef} id="testimonials" className="relative py-28 px-6 bg-[#04060a]">
            <div className="max-w-6xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                        Trusted by leading <span className="text-gradient">clinicians</span>
                    </h2>
                </div>

                {/* Testimonial cards - scrolling marquee with parallax */}
                <motion.div style={{ y: marqueeY }} className="relative overflow-hidden">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#04060a] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#04060a] to-transparent z-10 pointer-events-none" />

                    <div className="flex animate-marquee gap-6" style={{ width: 'max-content' }}>
                        {[...testimonials, ...testimonials].map((t, i) => (
                            <div
                                key={`${t.name}-${i}`}
                                className="w-[340px] flex-shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{t.name}</p>
                                        <p className="text-xs text-zinc-500">{t.role}</p>
                                    </div>
                                </div>
                                <p className="text-[13px] text-zinc-400 leading-relaxed">{t.quote}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
