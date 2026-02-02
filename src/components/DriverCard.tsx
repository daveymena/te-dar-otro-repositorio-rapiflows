import { motion } from 'framer-motion';
import { Star, Phone, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DriverCardProps {
    driverName: string;
    rating: number;
    totalRides: number;
    vehicleModel?: string;
    vehiclePlate?: string;
    vehicleColor?: string;
    photoUrl?: string;
    isVerified?: boolean;
    onMessageClick?: () => void;
    onCallClick?: () => void;
    className?: string;
}

export function DriverCard({
    driverName,
    rating,
    totalRides,
    vehicleModel,
    vehiclePlate,
    vehicleColor,
    photoUrl,
    isVerified = true,
    onMessageClick,
    onCallClick,
    className,
}: DriverCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'glass-strong rounded-3xl p-5 border border-primary/20 shadow-2xl',
                className
            )}
        >
            <div className="flex items-start gap-4">
                {/* Driver Photo */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-secondary border-2 border-primary/30">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={driverName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <span className="text-3xl font-bold text-primary">
                                    {driverName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                            <Shield className="w-4 h-4 text-primary-foreground" />
                        </div>
                    )}
                </div>

                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 className="font-bold text-lg text-foreground truncate">
                                {driverName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-semibold text-foreground">
                                        {rating.toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    • {totalRides} viajes
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    {vehicleModel && (
                        <div className="bg-secondary/50 rounded-xl p-3 mt-3 space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-sm font-medium text-foreground">
                                    {vehicleModel}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground ml-4">
                                {vehiclePlate && (
                                    <span className="font-mono font-semibold bg-background px-2 py-1 rounded">
                                        {vehiclePlate}
                                    </span>
                                )}
                                {vehicleColor && (
                                    <span className="capitalize">{vehicleColor}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {(onMessageClick || onCallClick) && (
                <div className="flex gap-2 mt-4">
                    {onMessageClick && (
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl border-primary/50 hover:bg-primary/10 h-12"
                            onClick={onMessageClick}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Mensaje
                        </Button>
                    )}
                    {onCallClick && (
                        <Button
                            variant="neon"
                            className="flex-1 rounded-xl h-12"
                            onClick={onCallClick}
                        >
                            <Phone className="w-5 h-5 mr-2" />
                            Llamar
                        </Button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
