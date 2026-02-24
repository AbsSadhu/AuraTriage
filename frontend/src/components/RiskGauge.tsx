'use client';

import { motion } from 'framer-motion';

interface RiskGaugeProps {
    score: number;
    level: string;
    color: string;
    label: string;
}

export default function RiskGauge({ score, level, color, label }: RiskGaugeProps) {
    // SVG circular gauge
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="risk-gauge">
            <svg width="130" height="130" viewBox="0 0 130 130">
                {/* Background circle */}
                <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                />
                {/* Score arc */}
                <motion.circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    transform="rotate(-90 65 65)"
                    style={{
                        filter: `drop-shadow(0 0 8px ${color})`,
                    }}
                />
            </svg>
            <div className="gauge-center">
                <motion.span
                    className="gauge-score"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ color }}
                >
                    {score}
                </motion.span>
                <span className="gauge-label">{label}</span>
            </div>
        </div>
    );
}
