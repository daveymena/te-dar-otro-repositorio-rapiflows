@echo off
echo ========================================
echo   ANTIGRAVITY - SETUP AUTOMATICO
echo ========================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js detectado

echo.
echo [2/4] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [3/4] Verificando archivo .env...
if not exist .env (
    echo Creando archivo .env...
    (
        echo # Supabase Configuration
        echo VITE_SUPABASE_URL=tu_supabase_url_aqui
        echo VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
        echo.
        echo # Mapbox Configuration
        echo VITE_MAPBOX_TOKEN=pk.eyJ1IjoiYW50aWdyYXZpdHkiLCJhIjoiY2x0ZXN0In0.test
    ) > .env
    echo ✓ Archivo .env creado
    echo.
    echo IMPORTANTE: Edita el archivo .env con tus credenciales reales
    echo 1. VITE_SUPABASE_URL - URL de tu proyecto Supabase
    echo 2. VITE_SUPABASE_ANON_KEY - Clave publica de Supabase
    echo 3. VITE_MAPBOX_TOKEN - Token de Mapbox (obtenlo en mapbox.com)
    echo.
) else (
    echo ✓ Archivo .env ya existe
)

echo.
echo [4/4] Verificando migraciones SQL...
if exist "supabase\migrations\20260202_professional_features.sql" (
    echo ✓ Archivo de migracion encontrado
    echo.
    echo IMPORTANTE: Ejecuta este SQL en Supabase:
    echo 1. Ve a https://supabase.com/dashboard
    echo 2. Abre SQL Editor
    echo 3. Copia el contenido de: supabase\migrations\20260202_professional_features.sql
    echo 4. Pegalo y ejecuta (Run)
    echo.
) else (
    echo ADVERTENCIA: Archivo de migracion no encontrado
)

echo.
echo ========================================
echo   SETUP COMPLETADO
echo ========================================
echo.
echo Proximos pasos:
echo 1. Edita .env con tus credenciales
echo 2. Ejecuta el SQL en Supabase
echo 3. Ejecuta: npm run dev
echo.
echo ¡AntiGravity esta listo para despegar! 🚀
echo.
pause
