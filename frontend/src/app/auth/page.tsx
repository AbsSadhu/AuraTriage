'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [tab, setTab] = useState<'clinician' | 'patient'>('clinician');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(tab === 'clinician' ? '/dashboard' : '/portal');
    };

    return (
        <div className="min-h-screen bg-[#04060a] flex items-center justify-center px-6 relative overflow-hidden">
            {/* Ambient mesh blobs */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 50, -30, 0],
                        y: [0, -40, 20, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
                    className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full bg-teal-500/[0.03] blur-[150px]"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 30, 0],
                        y: [0, 30, -50, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 25, ease: 'easeInOut' }}
                    className="absolute bottom-[15%] right-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-[150px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo + header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/20">
                        A
                    </div>
                    <h1 className="font-display text-2xl font-bold text-white tracking-tight">Welcome to AuraTriage</h1>
                    <p className="text-sm text-zinc-500 mt-1.5">Secure Access Portal</p>
                </div>

                {/* Auth card */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl p-8 shadow-2xl">
                    {/* Tab toggle */}
                    <div className="flex bg-zinc-900/80 rounded-xl p-1 mb-8 border border-white/[0.04]">
                        <button
                            onClick={() => setTab('clinician')}
                            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${tab === 'clinician'
                                ? 'bg-white/10 text-white shadow-sm backdrop-blur-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            Clinician Access
                        </button>
                        <button
                            onClick={() => setTab('patient')}
                            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${tab === 'patient'
                                ? 'bg-white/10 text-white shadow-sm backdrop-blur-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            Patient Portal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Field 1 */}
                        <div>
                            <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                                {tab === 'clinician' ? 'NPI Number' : 'Email Address'}
                            </label>
                            <div className="relative">
                                <input
                                    type={tab === 'clinician' ? 'text' : 'email'}
                                    placeholder={tab === 'clinician' ? 'Enter 10-digit ID' : 'name@hospital.org'}
                                    className="w-full bg-transparent border-0 border-b border-zinc-800 px-0 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                                />
                                {tab === 'clinician' && (
                                    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Field 2 */}
                        <div>
                            <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    className="w-full bg-transparent border-0 border-b border-zinc-800 px-0 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                                />
                                <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 cursor-pointer hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex justify-end mt-2">
                                <a href="#" className="text-[11px] text-teal-400/70 hover:text-teal-400 transition-colors">Forgot password?</a>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold text-sm hover:from-teal-400 hover:to-teal-300 transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-400/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            {tab === 'clinician' ? 'Authenticate Dashboard' : 'Access Records'}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-zinc-800" />
                        <span className="text-[11px] text-zinc-600 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-zinc-800" />
                    </div>

                    {/* Google SSO */}
                    <button className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-medium hover:border-zinc-600 hover:text-zinc-200 transition-all flex items-center justify-center gap-2.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google SSO
                    </button>
                </div>

                {/* Security footer */}
                <div className="mt-6 text-center">
                    <p className="text-[11px] text-zinc-700 flex items-center justify-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Protected by 256-bit encryption · HIPAA Compliant
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
