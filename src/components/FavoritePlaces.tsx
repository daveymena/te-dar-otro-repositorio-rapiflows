import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Briefcase, Heart, MapPin, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FavoritePlace {
    id: string;
    label: string;
    address: string;
    lat: number;
    lng: number;
    icon: string;
}

interface FavoritePlacesProps {
    userId: string;
    onSelectPlace?: (place: FavoritePlace) => void;
}

const iconMap = {
    home: Home,
    work: Briefcase,
    heart: Heart,
    pin: MapPin,
};

export function FavoritePlaces({ userId, onSelectPlace }: FavoritePlacesProps) {
    const [places, setPlaces] = useState<FavoritePlace[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newPlace, setNewPlace] = useState({
        label: '',
        address: '',
        icon: 'pin',
    });
    const { toast } = useToast();

    useEffect(() => {
        loadFavoritePlaces();
    }, [userId]);

    const loadFavoritePlaces = async () => {
        const { data, error } = await supabase
            .from('favorite_places')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setPlaces(data);
        }
    };

    const addPlace = async () => {
        if (!newPlace.label || !newPlace.address) {
            toast({
                title: 'Campos requeridos',
                description: 'Por favor completa todos los campos',
                variant: 'destructive',
            });
            return;
        }

        // In production, geocode the address to get lat/lng
        // For now, using placeholder coordinates
        const { error } = await supabase.from('favorite_places').insert({
            user_id: userId,
            label: newPlace.label,
            address: newPlace.address,
            lat: 19.4326, // Placeholder
            lng: -99.1332, // Placeholder
            icon: newPlace.icon,
        });

        if (error) {
            toast({
                title: 'Error',
                description: 'No se pudo guardar el lugar',
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Lugar guardado',
            description: 'Ahora puedes acceder rápidamente a este destino',
        });

        setNewPlace({ label: '', address: '', icon: 'pin' });
        setIsAdding(false);
        loadFavoritePlaces();
    };

    const deletePlace = async (id: string) => {
        const { error } = await supabase
            .from('favorite_places')
            .delete()
            .eq('id', id);

        if (!error) {
            loadFavoritePlaces();
            toast({
                title: 'Lugar eliminado',
            });
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Lugares Favoritos
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-primary hover:text-primary/80"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                </Button>
            </div>

            {isAdding && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass-strong rounded-2xl p-4 border border-primary/20 space-y-3"
                >
                    <div className="flex gap-2">
                        {Object.entries(iconMap).map(([key, Icon]) => (
                            <button
                                key={key}
                                onClick={() => setNewPlace({ ...newPlace, icon: key })}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${newPlace.icon === key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>

                    <Input
                        placeholder="Nombre (ej: Casa, Trabajo)"
                        value={newPlace.label}
                        onChange={(e) => setNewPlace({ ...newPlace, label: e.target.value })}
                        className="bg-secondary/50 border-border rounded-xl"
                    />

                    <Input
                        placeholder="Dirección completa"
                        value={newPlace.address}
                        onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                        className="bg-secondary/50 border-border rounded-xl"
                    />

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAdding(false)}
                            className="flex-1 rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="neon"
                            size="sm"
                            onClick={addPlace}
                            className="flex-1 rounded-xl"
                        >
                            Guardar
                        </Button>
                    </div>
                </motion.div>
            )}

            {places.map((place) => {
                const Icon = iconMap[place.icon as keyof typeof iconMap] || MapPin;
                return (
                    <motion.button
                        key={place.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onSelectPlace?.(place)}
                        className="w-full glass rounded-xl p-4 hover:bg-primary/5 transition-colors group text-left relative"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground truncate">
                                    {place.label}
                                </h4>
                                <p className="text-sm text-muted-foreground truncate">
                                    {place.address}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deletePlace(place.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                    </motion.button>
                );
            })}

            {places.length === 0 && !isAdding && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No tienes lugares guardados
                </div>
            )}
        </div>
    );
}
