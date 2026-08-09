-- VERIFICACIÓN DE CONFIGURACIÓN DE RECOLECCIONES
-- Ejecuta este SQL para verificar que todo esté configurado correctamente

-- 1. Verificar que la tabla existe y tiene todas las columnas
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'collections'
ORDER BY ordinal_position;

-- 2. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'collections';

-- 3. Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'collections'
ORDER BY policyname;

-- 4. Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'collections';

