# 在專案根目錄建立 start_dev.ps1
cd C:\Shares\Coding\EqWizard_03

@'
Write-Host "啟動開發環境..." -ForegroundColor Green

# 啟動後端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Shares\Coding\EqWizard_03; .\venv\Scripts\activate; cd backend; python manage.py runserver"

Start-Sleep -Seconds 2

# 啟動前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Shares\Coding\EqWizard_03\frontend; npm run dev"

Write-Host "開發環境已啟動！" -ForegroundColor Cyan
Write-Host "後端: http://localhost:8000" -ForegroundColor Yellow
Write-Host "前端: http://localhost:5173" -ForegroundColor Yellow
Write-Host "管理後台: http://localhost:8000/admin" -ForegroundColor Yellow
'@ | Out-File -FilePath start_dev.ps1 -Encoding UTF8