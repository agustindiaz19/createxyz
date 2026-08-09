-- Actualizar el trigger para manejar roles desde metadata del usuario
-- Ejecutar este SQL en Supabase SQL Editor

-- Primero, eliminar el trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear función actualizada que maneja metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text := 'citizen'; -- valor por defecto
BEGIN
  -- Intentar obtener el rol desde metadata del usuario
  -- Si no existe, usar 'citizen' por defecto
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'role' THEN
    user_role := NEW.raw_user_meta_data->>'role';
  END IF;
  
  -- Validar que el rol sea válido
  IF user_role NOT IN ('citizen', 'collector') THEN
    user_role := 'citizen';
  END IF;
  
  -- Insertar en profiles con el rol correcto
  INSERT INTO public.profiles (id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    user_role::user_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, crear perfil con rol por defecto
    INSERT INTO public.profiles (id, role, created_at, updated_at)
    VALUES (
      NEW.id,
      'citizen'::user_role,
      NOW(),
      NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
