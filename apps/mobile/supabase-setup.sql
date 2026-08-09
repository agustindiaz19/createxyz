-- CONFIGURACIÓN SIMPLE DE SUPABASE DESDE CERO
-- Ejecuta este SQL en Supabase Dashboard > SQL Editor

-- 1. Crear tabla de cajas (solo lo esencial)
CREATE TABLE boxes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Ubicación
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Información de la caja
  name TEXT,
  description TEXT,
  
  -- Capacidad
  current_containers INTEGER DEFAULT 0 NOT NULL CHECK (current_containers >= 0),
  max_containers INTEGER DEFAULT 10 NOT NULL CHECK (max_containers > 0),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validación
  CONSTRAINT valid_container_count CHECK (current_containers <= max_containers)
);

-- 2. Habilitar RLS
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS simples
-- Los usuarios pueden ver todas las cajas
CREATE POLICY "Users can view all boxes" ON boxes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Los usuarios pueden crear cajas solo con su propio user_id
CREATE POLICY "Users can create boxes" ON boxes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar solo sus propias cajas
CREATE POLICY "Users can update own boxes" ON boxes
  FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar solo sus propias cajas
CREATE POLICY "Users can delete own boxes" ON boxes
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para actualizar updated_at
CREATE TRIGGER handle_updated_at_boxes
  BEFORE UPDATE ON boxes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Verificar configuración
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'boxes'
ORDER BY ordinal_position;

-- 7. Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'boxes'
ORDER BY policyname;
