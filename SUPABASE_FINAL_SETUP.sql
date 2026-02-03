-- ==========================================
-- 🚀 SISTEMA DE REGISTRO ROBUSTO (POSTGRESQL)
-- ==========================================
-- PASO 1: Ejecuta esto en el SQL Editor de Supabase.
-- Garantiza que los perfiles se creen siempre y que el Dashboard no se quede en negro.

-- Crear tipos si no existen
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
    END IF;
END $$;

-- Crear tabla de perfiles con integridad referencial fuerte
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'rider',
    verification_status verification_status DEFAULT 'unverified',
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Función de Trigger automática para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
    default_role user_role;
    default_status verification_status;
BEGIN
    -- Extraer rol de los metadatos de registro
    default_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'rider'::user_role);
    
    -- Los pasajeros son verificados al instante, conductores quedan pendientes
    IF default_role = 'driver' THEN
        default_status := 'unverified'::verification_status;
    ELSE
        default_status := 'verified'::verification_status;
    END IF;

    INSERT INTO public.profiles (user_id, email, full_name, role, phone, verification_status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
        default_role,
        new.raw_user_meta_data->>'phone',
        default_status
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = EXCLUDED.role;
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activar el Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Función de ayuda para sincronizar manualmente (por si falla el trigger)
CREATE OR REPLACE FUNCTION public.repair_profile(target_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role, verification_status)
    SELECT 
        id, 
        email, 
        raw_user_meta_data->>'full_name', 
        (raw_user_meta_data->>'role')::user_role,
        'verified'
    FROM auth.users
    WHERE id = target_user_id
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
