-- CONFIGURACIÓN DE TABLA DE RECOLECCIONES
-- Ejecuta este SQL en Supabase Dashboard > SQL Editor

-- 1. Crear tabla de recolecciones
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  box_id UUID REFERENCES boxes(id) ON DELETE CASCADE NOT NULL,
  
  -- Información de la recolección
  containers_collected INTEGER NOT NULL CHECK (containers_collected >= 0),
  containers_before INTEGER NOT NULL CHECK (containers_before >= 0),
  containers_after INTEGER DEFAULT 0 NOT NULL CHECK (containers_after >= 0),
  
  -- Notas opcionales
  notes TEXT,
  
  -- Timestamps
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_collections_collector_id ON collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_collections_box_id ON collections(box_id);
CREATE INDEX IF NOT EXISTS idx_collections_collected_at ON collections(collected_at DESC);

-- 3. Habilitar RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Los usuarios autenticados pueden ver todas las recolecciones
CREATE POLICY "Users can view all collections" ON collections
  FOR SELECT USING (auth.role() = 'authenticated');

-- Los usuarios autenticados pueden crear recolecciones
CREATE POLICY "Users can create collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = collector_id);

-- 5. Verificar configuración
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'collections'
ORDER BY ordinal_position;

