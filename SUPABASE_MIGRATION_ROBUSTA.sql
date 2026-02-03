-- 🔥 CONFIGURACIÓN ROBUSTA DE BASE DE DATOS PARA RAPICARM
-- Copia este código en el editor SQL de Supabase para asegurar que los registros funcionen al 100%.

-- 1. Asegurar tipos ENUM
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Asegurar Tabla de Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'rider',
    verification_status verification_status DEFAULT 'unverified',
    avatar_url TEXT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    is_online BOOLEAN DEFAULT false,
    vehicle_model TEXT,
    vehicle_plate TEXT,
    vehicle_color TEXT,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_rides INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
DO $$ BEGIN
    CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Conductores son visibles para todos" ON public.profiles
    FOR SELECT USING (role = 'driver');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. FUNCOR ROBUSTA DE REGISTRO (TRIGGER)
-- Esta función se encarga de que CADA VEZ que alguien se registre en Auth, se cree su perfil automáticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, phone, verification_status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'phone',
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'driver' THEN 'unverified'::verification_status
      ELSE 'verified'::verification_status -- Pasajeros empiezan como verificados por defecto
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VINCULAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función para Depuración (Si algo falla, puedes forzar la creación)
CREATE OR REPLACE FUNCTION public.sync_profile(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, verification_status)
  SELECT id, email, raw_user_meta_data->>'full_name', (raw_user_meta_data->>'role')::user_role, 'verified'
  FROM auth.users
  WHERE id = p_user_id
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
