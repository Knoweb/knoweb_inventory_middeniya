# Quick Start Script
Write-Host "Installing Frontend Dependencies..." -ForegroundColor Green
Set-Location inventory-frontend
npm install

Write-Host "`nStarting Frontend Development Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd inventory-frontend; npm run dev"

Write-Host "`n✅ Frontend will be available at http://localhost:5173" -ForegroundColor Green
