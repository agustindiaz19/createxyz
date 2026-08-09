@echo off
REM Script de configuración para el proyecto Uber - Solo App Móvil
echo 🚀 Configurando proyecto Uber - Solo App Móvil con Supabase
echo.

REM Verificar si estamos en el directorio correcto
if not exist "apps\mobile" (
    echo ❌ Error: Este script debe ejecutarse desde la raíz del proyecto
    pause
    exit /b 1
)

REM Navegar al directorio de la app móvil
cd apps\mobile

echo 📦 Instalando dependencias...
npm install

echo.
echo 📝 Configurando variables de entorno...

REM Crear archivo .env si no existe
if not exist ".env" (
    if exist "env.example" (
        copy env.example .env
        echo ✅ Archivo .env creado desde env.example
        echo ⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de Supabase
    ) else (
        echo ❌ Error: No se encontró el archivo env.example
        pause
        exit /b 1
    )
) else (
    echo ℹ️  El archivo .env ya existe
)

echo.
echo 🎯 Configuración completada!
echo.
echo 📋 Próximos pasos:
echo 1. Ve a https://supabase.com y crea un nuevo proyecto
echo 2. Copia la URL y la clave anónima a tu archivo .env
echo 3. Ejecuta el SQL del archivo README-SUPABASE.md en tu proyecto de Supabase
echo 4. Ejecuta 'npx expo start' para iniciar la aplicación
echo.
echo 📚 Para más información, lee README-SUPABASE.md
echo.
echo ¡Listo para desarrollar! 🎉
pause
