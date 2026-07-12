# ============================================================
#  SUBLICOLOR - Detener todos los servicios
#  Uso:  .\stop.ps1
# ============================================================

$pgBin    = "$env:USERPROFILE\scoop\apps\postgresql\current\bin"
$pgData   = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$redisDir = "$env:USERPROFILE\scoop\apps\redis\current"

Write-Host "Deteniendo SUBLICOLOR..." -ForegroundColor Yellow

# Web + API (procesos node)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "  Node (API + Web) detenido" -ForegroundColor Green

# Redis
& "$redisDir\redis-cli.exe" --no-auth-warning -a redis_secret shutdown nosave 2>$null
Get-Process -Name "redis-server" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "  Redis detenido" -ForegroundColor Green

# PostgreSQL
& "$pgBin\pg_ctl.exe" stop -D "$pgData" -m fast 2>$null
Write-Host "  PostgreSQL detenido" -ForegroundColor Green

Write-Host "Todo detenido." -ForegroundColor Cyan
