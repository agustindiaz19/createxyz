#!/bin/bash

# Script de configuración para el proyecto Uber - Solo App Móvil
echo "🚀 Configurando proyecto Uber - Solo App Móvil con Supabase"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -d "apps/mobile" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

# Navegar al directorio de la app móvil
cd apps/mobile

echo "📦 Instalando dependencias..."
npm install

echo ""
echo "📝 Configurando variables de entorno..."

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Archivo .env creado desde env.example"
        echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de Supabase"
    else
        echo "❌ Error: No se encontró el archivo env.example"
        exit 1
    fi
else
    echo "ℹ️  El archivo .env ya existe"
fi

echo ""
echo "🎯 Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ve a https://supabase.com y crea un nuevo proyecto"
echo "2. Copia la URL y la clave anónima a tu archivo .env"
echo "3. Ejecuta el SQL del archivo README-SUPABASE.md en tu proyecto de Supabase"
echo "4. Ejecuta 'npx expo start' para iniciar la aplicación"
echo ""
echo "📚 Para más información, lee README-SUPABASE.md"
echo ""
echo "¡Listo para desarrollar! 🎉"
