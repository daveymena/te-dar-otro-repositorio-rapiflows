import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, Share2, Info, MessageSquare, AlertTriangle, X, Check, MapPin, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SafetyCenterProps {
    rideId?: string;
    driverId?: string;
    onShare?: () => void;
    onSOS?: () => void;
}

export function SafetyCenter({ rideId, driverId, onShare, onSOS }: SafetyCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const safetyActions = [
        {
            id: 'sos',
            name: 'Botón de Emergencia',
            icon: AlertTriangle,
            color: 'bg-red-500',
            action: () => {
                onSOS?.();
                setIsOpen(false);
            },
            desc: 'Llamada directa al 123 y alerta local'
        },
        {
            id: 'share',
            name: 'Compartir Viaje',
            icon: Share2,
            color: 'bg-blue-500',
            action: () => {
                onShare?.();
                setIsOpen(false);
            },
            desc: 'Envía tu ubicación en vivo por WhatsApp'
        },
        {
            id: 'monitor',
            name: 'Monitoreo en Tiempo Real',
            icon: Radio,
            color: 'bg-green-500',
            action: () => {
                toast({
                    title: "Monitoreo Activo",
                    description: "Tu viaje está siendo monitoreado por nuestro sistema 24/7.",
                });
            },
            desc: 'Seguimiento por GPS garantizado'
        },
        {
            id: 'support',
            name: 'Soporte 24/7',
            icon: MessageSquare,
            color: 'bg-purple-500',
            action: () => {
                toast({
                    title: "Soporte Rapicarm",
                    description: "Un agente se conectará contigo en breve vía chat.",
                });
            },
            desc: 'Chatea con nuestro equipo de seguridad'
        }
    ];

    return (
        <>
            {/* Floating Shield Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-2 border-primary overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                <Shield className="w-6 h-6 text-primary relative z-10" />
            </motion.button>

            {/* Safety Center Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-[2.5rem] border-t border-border p-6 sm:p-8"
                        >
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-display font-bold">Centro de Seguridad</h2>
                                            <p className="text-xs text-muted-foreground">Tu protección es nuestra prioridad</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {safetyActions.map((action) => (
                                        <button
                                            key={action.id}
                                            onClick={action.action}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 transition-all text-left group"
                                        >
                                            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                                                <action.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm tracking-tight">{action.name}</div>
                                                <div className="text-[11px] text-muted-foreground">{action.desc}</div>
                                            </div>
                                            <Info className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Rapicarm utiliza tecnología de seguimiento cifrado. En caso de emergencia, compartimos tu ubicación y datos del vehículo automáticamente con las autoridades locales.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
