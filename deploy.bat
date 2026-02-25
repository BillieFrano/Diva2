@echo off
echo ==========================================
echo   DIVA Smart Try-On - Deploy Script
echo ==========================================
echo.

REM Verificar si git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no esta instalado.
    echo Por favor instala Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/5] Inicializando repositorio Git...
git init
git add .
git commit -m "Initial commit - DIVA Smart Try-On"

echo.
echo [2/5] Creando repositorio en GitHub...
echo.
echo Para crear el repo en GitHub, ejecuta uno de estos comandos:
echo.
echo Opcion A - Con GitHub CLI (instalar desde https://cli.github.com):
echo   gh repo create diva-smart-tryon --public --source=. --push
echo.
echo Opcion B - Manual:
echo   1. Ve a https://github.com/new
echo   2. Nombre: diva-smart-tryon
echo   3. Clic en "Create repository"
echo   4. Ejecuta estos comandos:
echo      git remote add origin https://github.com/TU_USUARIO/diva-smart-tryon.git
echo      git push -u origin main
echo.
pause

echo.
echo [3/5] Verificando Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo Instalando Vercel CLI...
    npm install -g vercel
)

echo.
echo [4/5] Desplegando en Vercel...
echo Se abrira una ventana para que inicies sesion en Vercel...
vercel --prod

echo.
echo ==========================================
echo   Deploy completado!
echo ==========================================
pause
