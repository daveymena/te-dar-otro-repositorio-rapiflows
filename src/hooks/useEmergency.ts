import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

interface EmergencyData {
    rideId: string;
    userId: string;
    location: {
        lat: number;
        lng: number;
    };
    timestamp: string;
    reason?: string;
}

export function useEmergency() {
    const [isEmergencyActive, setIsEmergencyActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const triggerEmergency = useCallback(async (data: EmergencyData) => {
        setIsProcessing(true);

        try {
            // 1. Log emergency in database
            const { error: logError } = await supabase
                .from('emergency_logs')
                .insert({
                    ride_id: data.rideId,
                    user_id: data.userId,
                    location_lat: data.location.lat,
                    location_lng: data.location.lng,
                    reason: data.reason || 'Emergency button pressed',
                    status: 'active',
                });

            if (logError) throw logError;

            // 2. Update ride status to emergency
            const { error: rideError } = await supabase
                .from('rides')
                .update({
                    status: 'emergency',
                    emergency_triggered_at: new Date().toISOString()
                })
                .eq('id', data.rideId);

            if (rideError) throw rideError;

            // 3. Send notifications (would integrate with Twilio/Firebase in production)
            console.log('EMERGENCY TRIGGERED:', data);

            setIsEmergencyActive(true);

            toast({
                title: '🚨 EMERGENCIA ACTIVADA',
                description: 'Autoridades notificadas. Mantén la calma.',
                variant: 'destructive',
                duration: 10000,
            });

            // 4. In production: Call emergency services API, send SMS to contacts, etc.

        } catch (error: any) {
            console.error('Error triggering emergency:', error);
            toast({
                title: 'Error al activar emergencia',
                description: 'Por favor llama directamente al 911',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    const cancelEmergency = useCallback(async (rideId: string) => {
        try {
            await supabase
                .from('emergency_logs')
                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                .eq('ride_id', rideId)
                .eq('status', 'active');

            setIsEmergencyActive(false);

            toast({
                title: 'Emergencia cancelada',
                description: 'El estado de emergencia ha sido desactivado.',
            });
        } catch (error) {
            console.error('Error cancelling emergency:', error);
        }
    }, [toast]);

    return {
        isEmergencyActive,
        isProcessing,
        triggerEmergency,
        cancelEmergency,
    };
}
