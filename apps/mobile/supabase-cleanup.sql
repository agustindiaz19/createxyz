-- Eliminar tabla profiles y trigger
-- Ejecutar este SQL en Supabase SQL Editor

-- Eliminar el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar la función
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Eliminar la tabla profiles
DROP TABLE IF EXISTS public.profiles;

-- Eliminar el tipo enum user_role
DROP TYPE IF EXISTS user_role;
