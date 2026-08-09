# Configuración del Proyecto Uber - Solo App Móvil

## Descripción
Este proyecto ha sido simplificado para incluir solo la aplicación móvil con Supabase como backend. Se eliminó toda la parte web y API para simplificar el desarrollo.

## Estructura del Proyecto
```
apps/
└── mobile/                 # Aplicación móvil con Expo
    ├── src/
    │   ├── app/           # Pantallas de la aplicación
    │   ├── components/    # Componentes reutilizables
    │   ├── lib/           # Configuración de Supabase
    │   └── utils/         # Utilidades (auth, etc.)
    ├── assets/            # Imágenes y recursos
    └── package.json       # Dependencias
```

## Tecnologías Utilizadas
- **Frontend**: React Native con Expo
- **Backend**: Supabase (Base de datos PostgreSQL + Auth + Storage)
- **Estado**: Zustand
- **Navegación**: Expo Router
- **UI**: React Native Components

## Configuración Rápida

### 1. Instalar dependencias
```bash
cd apps/mobile
npm install
```

### 2. Configurar Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar `env.example` a `.env`
3. Agregar tus credenciales de Supabase
4. Ejecutar el SQL del README-SUPABASE.md

### 3. Ejecutar la aplicación
```bash
npx expo start
```

## Funcionalidades Implementadas
- ✅ Autenticación completa con Supabase
- ✅ Registro e inicio de sesión
- ✅ Persistencia de sesión
- ✅ Modal de autenticación integrado
- ✅ Manejo de errores
- ✅ Estructura escalable

## Próximos Pasos
1. Configurar tu proyecto de Supabase
2. Personalizar la UI según tus necesidades
3. Agregar las funcionalidades específicas de tu app
4. Configurar notificaciones push si es necesario

## Archivos Importantes
- `src/lib/supabase.js` - Configuración de Supabase
- `src/utils/auth/` - Sistema de autenticación
- `README-SUPABASE.md` - Instrucciones detalladas de configuración
- `env.example` - Variables de entorno de ejemplo

## Soporte
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de React Native](https://reactnative.dev/)
