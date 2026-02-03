-- ⚠️ SOLUCIÓN DEFINITIVA (Compatibilidad con Triggers):
-- Este script detecta si ya existe un perfil automático y lo actualiza en lugar de fallar.

create extension if not exists "pgcrypto";

DO $$
DECLARE
  new_web_user_id uuid := gen_random_uuid();
  user_email text := 'conductor_vip2@rapicarm.com'; -- 📧 CAMBIÉ EL CORREO A "vip2" POR SI ACASO
  user_password text := '123456';
  user_full_name text := 'Conductor VIP';
  user_role_text text := 'driver';
BEGIN
  -- 1. Insertar usuario (Esto disparará el trigger automático si existe)
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    new_web_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', user_full_name, 'role', user_role_text),
    now(),
    now(),
    '',
    ''
  );

  -- 2. Actualizar el perfil (En lugar de insertar) para evitar conflicto con el trigger
  -- Si el trigger no existe, esto no hará nada, así que insertamos si hace falta.
  INSERT INTO public.profiles (id, user_id, full_name, role, is_online, email)
  VALUES (
    new_web_user_id,
    new_web_user_id,
    user_full_name,
    user_role_text::user_role,
    true,
    user_email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    is_online = true;

END $$;
