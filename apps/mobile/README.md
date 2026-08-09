# 🚀 Configuración Simple de Supabase

## 📋 Pasos para Configurar

### 1. **Configurar Variables de Entorno**
1. Copia `env.example` como `.env`
2. Configura tus valores de Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

### 2. **Configurar Base de Datos**
1. Ve a Supabase Dashboard > SQL Editor
2. Ejecuta el contenido de `supabase-setup.sql`
3. Verifica que no hay errores

### 3. **Probar la App**
1. Ejecuta la app
2. Deberías ver el modal de autenticación
3. Crea una cuenta o inicia sesión
4. Prueba crear cajas en el mapa

## 🎯 Funcionalidades

- ✅ **Autenticación**: Registro e inicio de sesión
- ✅ **Crear Cajas**: Toca en el mapa para crear
- ✅ **Ver Cajas**: Lista todas las cajas creadas
- ✅ **Actualizar Cajas**: Cambiar número de contenedores
- ✅ **Eliminar Cajas**: Remover cajas del mapa

## 🔧 Estructura

- `src/lib/supabase.js` - Cliente de Supabase
- `src/lib/boxes-service.js` - Servicios para cajas
- `src/utils/auth.js` - Autenticación
- `src/components/AuthModal.jsx` - Modal de autenticación

## 🎉 ¡Listo!

Con esta configuración simple tendrás una app completamente funcional con Supabase.
