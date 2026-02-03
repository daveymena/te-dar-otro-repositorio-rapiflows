import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, ArrowUpRight, History, CreditCard } from 'lucide-react';
import { Button } from './ui/button';

interface WalletCardProps {
    balance: number;
    userName: string;
}

export function WalletCard({ balance, userName }: WalletCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl"
            style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
            }}
        >
            {/* Decorative background elements */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">RapiWallet</span>
                    </div>
                    <CreditCard className="w-6 h-6 opacity-40" />
                </div>

                <div className="mb-8">
                    <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Saldo Disponible</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-display font-black tracking-tight">
                            ${balance.toLocaleString('es-CO')}
                        </span>
                        <span className="text-xs font-bold text-primary">COP</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60 mb-0.5">Titular</div>
                        <div className="text-sm font-bold tracking-tight">{userName}</div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Recargar
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10"
                        >
                            <History className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Glowing bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        </motion.div>
    );
}
