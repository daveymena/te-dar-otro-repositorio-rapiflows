import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShareRideProps {
    rideId: string;
    userId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ShareRide({ rideId, userId, isOpen, onClose }: ShareRideProps) {
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const generateShareLink = async () => {
        setIsGenerating(true);
        try {
            // Generate unique token
            const token = `${rideId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Create share record
            const { error } = await supabase.from('ride_shares').insert({
                ride_id: rideId,
                share_token: token,
                created_by: userId,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                is_active: true,
            });

            if (error) throw error;

            // Generate shareable URL
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/track/${token}`;
            setShareLink(link);

            toast({
                title: 'Link generado',
                description: 'Comparte este link con tus contactos de confianza',
            });
        } catch (error) {
            console.error('Error generating share link:', error);
            toast({
                title: 'Error',
                description: 'No se pudo generar el link',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async () => {
        if (!shareLink) return;

        try {
            await navigator.clipboard.writeText(shareLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);

            toast({
                title: 'Link copiado',
                description: 'Ahora puedes compartirlo por WhatsApp, SMS, etc.',
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const shareViaWhatsApp = () => {
        if (!shareLink) return;
        const message = encodeURIComponent(
            `🚗 Estoy en un viaje con Rapicarm. Sígueme en tiempo real: ${shareLink}`
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Compartir Viaje</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="mb-6">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Share2 className="w-10 h-10 text-primary" />
                                </div>
                                <p className="text-center text-muted-foreground">
                                    Comparte tu ubicación en tiempo real con familiares o amigos de confianza
                                </p>
                            </div>

                            {!shareLink ? (
                                <Button
                                    variant="neon"
                                    size="lg"
                                    className="w-full rounded-xl"
                                    onClick={generateShareLink}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? 'Generando...' : 'Generar Link de Seguimiento'}
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                                        <p className="text-xs text-muted-foreground mb-2">Link de seguimiento:</p>
                                        <p className="text-sm font-mono break-all text-foreground">{shareLink}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={copyToClipboard}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                                    Copiado
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Copiar
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="neon"
                                            className="rounded-xl"
                                            onClick={shareViaWhatsApp}
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            WhatsApp
                                        </Button>
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground">
                                        El link expira en 24 horas
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
