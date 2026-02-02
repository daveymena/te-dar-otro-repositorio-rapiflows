import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
    isOpen: boolean;
    rideId: string;
    driverId: string;
    driverName: string;
    onClose: () => void;
    onComplete?: () => void;
}

export function RatingModal({
    isOpen,
    rideId,
    driverId,
    driverName,
    onClose,
    onComplete,
}: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [tip, setTip] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: 'Calificación requerida',
                description: 'Por favor selecciona una calificación',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Update ride with rating
            const { error: rideError } = await supabase
                .from('rides')
                .update({
                    rating,
                    rating_comment: comment || null,
                    tip_amount: tip,
                })
                .eq('id', rideId);

            if (rideError) throw rideError;

            // Update driver's average rating
            const { data: driverData } = await supabase
                .from('profiles')
                .select('rating, total_rides')
                .eq('id', driverId)
                .single();

            if (driverData) {
                const newTotalRides = (driverData.total_rides || 0) + 1;
                const currentRating = driverData.rating || 5;
                const newRating = ((currentRating * (driverData.total_rides || 0)) + rating) / newTotalRides;

                await supabase
                    .from('profiles')
                    .update({
                        rating: newRating,
                        total_rides: newTotalRides,
                    })
                    .eq('id', driverId);
            }

            // If tip is provided, create transaction
            if (tip > 0) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('transactions').insert({
                        ride_id: rideId,
                        payer_id: user.id,
                        receiver_id: driverId,
                        amount: 0,
                        tip_amount: tip,
                        status: 'completed',
                    });
                }
            }

            toast({
                title: '¡Gracias por tu calificación!',
                description: 'Tu opinión nos ayuda a mejorar el servicio',
            });

            onComplete?.();
            onClose();
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast({
                title: 'Error',
                description: 'No se pudo enviar la calificación',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const tipOptions = [0, 10, 20, 50];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
                    >
                        <div className="glass-strong rounded-3xl p-6 border border-primary/20 shadow-2xl">
                            <h2 className="text-2xl font-bold text-center mb-2">
                                ¿Cómo estuvo tu viaje?
                            </h2>
                            <p className="text-center text-muted-foreground mb-6">
                                con {driverName}
                            </p>

                            {/* Star Rating */}
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`w-12 h-12 transition-colors ${star <= (hoveredRating || rating)
                                                    ? 'text-yellow-500 fill-yellow-500'
                                                    : 'text-muted-foreground'
                                                }`}
                                        />
                                    </motion.button>
                                ))}
                            </div>

                            {/* Comment */}
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Cuéntanos más sobre tu experiencia (opcional)"
                                className="mb-4 bg-secondary/50 border-border rounded-xl min-h-[80px]"
                            />

                            {/* Tip */}
                            <div className="mb-6">
                                <p className="text-sm font-medium mb-3">¿Deseas dar propina?</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {tipOptions.map((amount) => (
                                        <Button
                                            key={amount}
                                            variant={tip === amount ? 'neon' : 'outline'}
                                            onClick={() => setTip(amount)}
                                            className="rounded-xl"
                                        >
                                            {amount === 0 ? 'No' : `$${amount}`}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                variant="neon"
                                size="lg"
                                className="w-full rounded-xl"
                                onClick={handleSubmit}
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
