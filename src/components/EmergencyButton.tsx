import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmergency } from '@/hooks/useEmergency';

interface EmergencyButtonProps {
    rideId: string;
    userId: string;
    currentLocation: { lat: number; lng: number } | null;
}

export function EmergencyButton({ rideId, userId, currentLocation }: EmergencyButtonProps) {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const { isEmergencyActive, isProcessing, triggerEmergency, cancelEmergency } = useEmergency();

    const handleEmergencyPress = () => {
        setShowConfirmation(true);
        let count = 5;
        const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(interval);
                activateEmergency();
            }
        }, 1000);

        // Store interval ID to clear if cancelled
        (window as any).emergencyInterval = interval;
    };

    const handleCancel = () => {
        if ((window as any).emergencyInterval) {
            clearInterval((window as any).emergencyInterval);
        }
        setShowConfirmation(false);
        setCountdown(5);
    };

    const activateEmergency = async () => {
        if (!currentLocation) return;

        await triggerEmergency({
            rideId,
            userId,
            location: currentLocation,
            timestamp: new Date().toISOString(),
            reason: 'Emergency button activated by user',
        });

        setShowConfirmation(false);
        setCountdown(5);
    };

    if (isEmergencyActive) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-strong border-2 border-destructive rounded-2xl p-4 shadow-2xl max-w-sm w-full mx-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center animate-pulse">
                        <Shield className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-destructive">EMERGENCIA ACTIVA</h3>
                        <p className="text-xs text-muted-foreground">Autoridades notificadas</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelEmergency(rideId)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Cancelar
                    </Button>
                </div>
            </motion.div>
        );
    }

    if (showConfirmation) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="glass-strong border-2 border-destructive rounded-3xl p-8 max-w-sm w-full text-center"
                >
                    <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                    </div>

                    <h2 className="text-2xl font-bold text-destructive mb-2">
                        ¿ACTIVAR EMERGENCIA?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Se notificará a las autoridades y tus contactos de emergencia
                    </p>

                    <div className="text-6xl font-bold text-destructive mb-6 tabular-nums">
                        {countdown}
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCancel}
                        className="w-full border-2 border-border hover:bg-secondary"
                    >
                        <X className="w-5 h-5 mr-2" />
                        Cancelar
                    </Button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.button
            id="sos-trigger-btn"
            whileTap={{ scale: 0.95 }}
            onClick={handleEmergencyPress}
            disabled={isProcessing}
            className="fixed bottom-40 right-4 z-40 w-16 h-16 bg-destructive rounded-full shadow-2xl flex items-center justify-center border-4 border-background hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
            style={{
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.3)',
            }}
        >
            <Shield className="w-8 h-8 text-white" />
        </motion.button>
    );
}
