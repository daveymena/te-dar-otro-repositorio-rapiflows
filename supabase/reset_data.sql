-- SCRIPT DE REINICIO TOTAL (¡CUIDADO!)
-- Borra todos los datos pero mantiene la estructura

-- 1. Limpiar tablas de negocio
TRUNCATE public.rides CASCADE;
TRUNCATE public.bids CASCADE;

-- 2. Limpiar perfiles
TRUNCATE public.profiles CASCADE;

-- 3. OPCIONAL: Limpiar usuarios de Auth de Supabase (Esto debe hacerse desde el panel de Auth o usando el servicio de admin)
-- Nota: No se puede hacer TRUNCATE de auth.users directamente desde SQL sin permisos de superuser.
-- Se recomienda borrar los usuarios manualmente desde la pestaña 'Authentication' en Supabase.
