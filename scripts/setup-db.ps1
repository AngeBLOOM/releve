# Script para configurar PostgreSQL para Sublicolor
# Ejecutar DESPUÉS de que PostgreSQL esté instalado

$env:PATH = "C:\Program Files\nodejs;C:\Users\angel\AppData\Roaming\npm;$env:PATH"

# Detectar instalación de PostgreSQL
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\17\bin"
)

$pgBin = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $pgBin = $path
        break
    }
}

if (-not $pgBin) {
    Write-Host "❌ PostgreSQL no encontrado. Instala primero." -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL encontrado en: $pgBin" -ForegroundColor Green
$env:PATH = "$pgBin;$env:PATH"

# Verificar que el servicio está corriendo
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService -and $pgService.Status -ne 'Running') {
    Write-Host "Iniciando servicio PostgreSQL..." -ForegroundColor Yellow
    Start-Service -Name $pgService.Name
    Start-Sleep -Seconds 3
}

# Crear usuario y base de datos
Write-Host "`nCreando usuario y base de datos..." -ForegroundColor Yellow

# El superuser de PostgreSQL es 'postgres' por defecto
$createScript = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sublimation') THEN
    CREATE USER sublimation WITH PASSWORD 'sublimation_secret';
  END IF;
END
`$`$;

SELECT 'CREATE DATABASE sublimation_store OWNER sublimation'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sublimation_store')\gexec

GRANT ALL PRIVILEGES ON DATABASE sublimation_store TO sublimation;
"@

$createScript | & "$pgBin\psql.exe" -U postgres -c $createScript 2>&1

Write-Host "`n✅ Base de datos configurada" -ForegroundColor Green
Write-Host "   Host: localhost:5432" -ForegroundColor Cyan
Write-Host "   DB:   sublimation_store" -ForegroundColor Cyan
Write-Host "   User: sublimation / sublimation_secret" -ForegroundColor Cyan
