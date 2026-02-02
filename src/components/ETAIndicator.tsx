import { motion } from 'framer-motion';
import { Navigation, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ETAIndicatorProps {
    eta: number | null; // seconds
    distance: string | null;
    status: 'arriving' | 'ongoing' | 'completed';
    className?: string;
}

export function ETAIndicator({ eta, distance, status, className }: ETAIndicatorProps) {
    const formatETA = (seconds: number) => {
        const minutes = Math.round(seconds / 60);
        if (minutes < 1) return '< 1 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'arriving':
                return {
                    icon: Navigation,
                    label: 'Llegando en',
                    color: 'text-primary',
                    bgColor: 'bg-primary/10',
                    borderColor: 'border-primary/30',
                };
            case 'ongoing':
                return {
                    icon: TrendingUp,
                    label: 'Tiempo al destino',
                    color: 'text-accent',
                    bgColor: 'bg-accent/10',
                    borderColor: 'border-accent/30',
                };
            case 'completed':
                return {
                    icon: Clock,
                    label: 'Viaje completado',
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/30',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    if (!eta && !distance) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'glass-strong rounded-2xl p-4 border-2 shadow-xl',
                config.borderColor,
                className
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', config.bgColor)}>
                    <Icon className={cn('w-7 h-7', config.color)} />
                </div>

                <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                        {config.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                        {eta && (
                            <motion.span
                                key={eta}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className={cn('text-2xl font-bold tabular-nums', config.color)}
                            >
                                {formatETA(eta)}
                            </motion.span>
                        )}
                        {distance && (
                            <span className="text-sm text-muted-foreground">• {distance}</span>
                        )}
                    </div>
                </div>

                {status === 'arriving' && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-3 h-3 bg-primary rounded-full"
                    />
                )}
            </div>
        </motion.div>
    );
}
