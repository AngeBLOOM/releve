# Inicializa y configura PostgreSQL (instalado via Scoop)
param([switch]$NoPrompt)

$env:PATH = "C:\Users\angel\scoop\apps\postgresql\current\bin;$env:PATH"

$dataDir = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$pgBin   = "$env:USERPROFILE\scoop\apps\postgresql\current\bin"

if (-not (Test-Path "$pgBin\pg_ctl.exe")) {
    Write-Host "❌ PostgreSQL no encontrado en Scoop. Verifica la instalacion." -ForegroundColor Red
    exit 1
}

$env:PATH = "$pgBin;$env:PATH"
Write-Host "✅ PostgreSQL encontrado: $pgBin" -ForegroundColor Green

# 1. Inicializar el cluster de datos si no existe
if (-not (Test-Path "$dataDir\PG_VERSION")) {
    Write-Host "Inicializando cluster PostgreSQL en $dataDir ..."
    & "$pgBin\initdb.exe" -D "$dataDir" -U postgres -E UTF8 --locale=es_VE.UTF-8 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Intentando con locale C..."
        & "$pgBin\initdb.exe" -D "$dataDir" -U postgres -E UTF8 -A trust 2>&1
    }
    Write-Host "✅ Cluster inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Cluster ya existente en $dataDir" -ForegroundColor Green
}

# 2. Iniciar PostgreSQL
Write-Host "Iniciando PostgreSQL..."
& "$pgBin\pg_ctl.exe" start -D "$dataDir" -l "$dataDir\postgresql.log" 2>&1
Start-Sleep -Seconds 3

# 3. Crear usuario y base de datos
Write-Host "Creando usuario 'sublimation' y DB 'sublimation_store'..."

$createUser = "DO `$`$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='sublimation') THEN CREATE USER sublimation WITH PASSWORD 'sublimation_secret'; END IF; END`$`$;"
& "$pgBin\psql.exe" -U postgres -c $createUser 2>&1

$createDb = "SELECT 'CREATE DATABASE sublimation_store OWNER sublimation' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='sublimation_store')\gexec"
& "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE sublimation_store OWNER sublimation;" 2>&1

& "$pgBin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sublimation_store TO sublimation;" 2>&1

Write-Host "`n✅ Base de datos lista:" -ForegroundColor Green
Write-Host "   postgresql://sublimation:sublimation_secret@localhost:5432/sublimation_store" -ForegroundColor Cyan
