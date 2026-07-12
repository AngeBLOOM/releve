# ============================================================
#  SUBLICOLOR - Script de arranque completo
#  Levanta: PostgreSQL, Redis, API (NestJS) y Web (Next.js)
#  Uso:  .\start.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

# --- Rutas de herramientas ---
$nodePath  = "C:\Program Files\nodejs"
$npmPath   = "$env:APPDATA\npm"
$pgBin     = "$env:USERPROFILE\scoop\apps\postgresql\current\bin"
$pgData    = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$redisDir  = "$env:USERPROFILE\scoop\apps\redis\current"

$env:PATH = "$nodePath;$npmPath;$pgBin;$env:PATH"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SUBLICOLOR - Arranque del sistema" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# --- 1. PostgreSQL ---
Write-Host "`n[1/4] PostgreSQL..." -ForegroundColor Yellow
$pgUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($pgUp) {
    Write-Host "  Ya esta corriendo en :5432" -ForegroundColor Green
} else {
    Start-Process -FilePath "$pgBin\pg_ctl.exe" `
      -ArgumentList "start", "-D", "`"$pgData`"", "-l", "`"$pgData\postgres.log`"", "-w" `
      -WindowStyle Hidden
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2
        $r = & "$pgBin\pg_isready.exe" -h localhost -p 5432 2>&1
        if ($r -match "accepting connections") { break }
    }
    Write-Host "  Iniciado en :5432" -ForegroundColor Green
}

# --- 2. Redis ---
Write-Host "`n[2/4] Redis..." -ForegroundColor Yellow
$rdUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($rdUp) {
    Write-Host "  Ya esta corriendo en :6379" -ForegroundColor Green
} else {
    Start-Process -FilePath "$redisDir\redis-server.exe" `
      -ArgumentList "--port 6379 --requirepass redis_secret --bind 127.0.0.1 --save ''" `
      -WorkingDirectory $redisDir `
      -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "  Iniciado en :6379" -ForegroundColor Green
}

# --- 3. API (NestJS) ---
Write-Host "`n[3/4] API NestJS..." -ForegroundColor Yellow
$apiUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($apiUp) {
    Write-Host "  Ya esta corriendo en :3001" -ForegroundColor Green
} else {
    if (-not (Test-Path "$root\apps\api\dist\main.js")) {
        Write-Host "  Compilando API..." -ForegroundColor Gray
        Push-Location "$root\apps\api"; & "node_modules\.bin\nest" build; Pop-Location
    }
    Start-Process -FilePath "node" `
      -ArgumentList "dist/main.js" `
      -WorkingDirectory "$root\apps\api" `
      -WindowStyle Minimized
    Start-Sleep -Seconds 6
    Write-Host "  Iniciado en :3001" -ForegroundColor Green
}

# --- 4. Web (Next.js) ---
Write-Host "`n[4/4] Web Next.js..." -ForegroundColor Yellow
$webUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($webUp) {
    Write-Host "  Ya esta corriendo en :3000" -ForegroundColor Green
} else {
    Start-Process -FilePath "node" `
      -ArgumentList "node_modules\next\dist\bin\next", "dev" `
      -WorkingDirectory "$root\apps\web" `
      -WindowStyle Minimized
    Write-Host "  Iniciando en :3000 (la 1ra vez tarda ~30s)..." -ForegroundColor Green
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "   TODO LISTO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Panel:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:    http://localhost:3001" -ForegroundColor White
Write-Host "  Login:  admin@sublicolor.com / admin1234" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan

Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"
