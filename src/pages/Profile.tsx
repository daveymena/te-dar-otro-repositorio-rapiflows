import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    User,
    Car,
    Star,
    MapPin,
    Phone,
    Mail,
    ChevronLeft,
    Camera,
    Shield,
    CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { profile, isLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        vehicle_model: '',
        vehicle_plate: '',
        vehicle_color: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                vehicle_model: profile.vehicle_model || '',
                vehicle_plate: profile.vehicle_plate || '',
                vehicle_color: profile.vehicle_color || '',
            });
        }
    }, [profile]);

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update(formData)
                .eq('id', profile.id);

            if (error) throw error;

            toast({
                title: 'Perfil actualizado',
                description: 'Tus cambios han sido guardados con éxito.',
            });
            setIsEditing(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-display font-bold">Mi Perfil</h1>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">
                {/* Profile Card */}
                <div className="relative group">
                    <div className="w-32 h-32 mx-auto bg-secondary rounded-full flex items-center justify-center border-4 border-background shadow-xl overflow-hidden relative">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-muted-foreground" />
                        )}
                        <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </button>
                    </div>
                    <div className="text-center mt-4">
                        <h2 className="text-2xl font-display font-bold">{profile?.full_name}</h2>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <span className="capitalize">{profile?.role === 'driver' ? 'Conductor' : 'Pasajero'}</span>
                            <span>•</span>
                            <div className="flex items-center gap-0.5">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>{profile?.rating || 5.0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-4 rounded-2xl text-center">
                        <div className="text-2xl font-display font-bold text-primary">{profile?.total_rides || 0}</div>
                        <div className="text-xs text-muted-foreground">Viajes totales</div>
                    </div>
                    <div className="glass p-4 rounded-2xl text-center">
                        <div className="text-2xl font-display font-bold text-green-500">
                            {profile?.verification_status === 'verified' ? 'Verificado' : 'Sin verificar'}
                        </div>
                        <div className="text-xs text-muted-foreground">Estado de cuenta</div>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-display font-bold">Información Personal</h3>
                        {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                Editar
                            </Button>
                        )}
                    </div>

                    <div className="glass-strong p-6 rounded-2xl space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10 bg-secondary/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10 bg-secondary/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={profile?.email || ''}
                                    disabled
                                    className="pl-10 bg-secondary/20 opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    {profile?.role === 'driver' && (
                        <>
                            <h3 className="text-lg font-display font-bold mt-8">Detalles del Vehículo</h3>
                            <div className="glass-strong p-6 rounded-2xl space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Modelo del Vehículo</label>
                                    <div className="relative">
                                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={formData.vehicle_model}
                                            onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder="Ej: Toyota Corolla"
                                            className="pl-10 bg-secondary/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-muted-foreground">Placas</label>
                                        <Input
                                            value={formData.vehicle_plate}
                                            onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder="ABC-123"
                                            className="bg-secondary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-muted-foreground">Color</label>
                                        <Input
                                            value={formData.vehicle_color}
                                            onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder="Gris"
                                            className="bg-secondary/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-4 pt-4">
                        <button className="w-full flex items-center justify-between p-4 rounded-xl glass hover:bg-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <span>Métodos de Pago</span>
                            </div>
                            <ChevronLeft className="w-5 h-5 rotate-180 text-muted-foreground" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl glass hover:bg-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-primary" />
                                <span>Seguridad y Datos</span>
                            </div>
                            <ChevronLeft className="w-5 h-5 rotate-180 text-muted-foreground" />
                        </button>
                    </div>

                    {isEditing && (
                        <div className="flex gap-4 mt-8">
                            <Button
                                variant="outline"
                                className="flex-1 h-12"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="neon"
                                className="flex-1 h-12"
                                disabled={isSaving}
                                onClick={handleSave}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
