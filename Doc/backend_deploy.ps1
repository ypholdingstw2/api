@'
Write-Host "開始部署生產環境..." -ForegroundColor Green

cd C:\Shares\Coding\EqWizard_03\backend

# 啟動虛擬環境
.\venv\Scripts\activate

# 收集靜態文件
python manage.py collectstatic --noinput

# 執行資料庫遷移
python manage.py migrate

# 建立快取表格
python manage.py createcachetable

Write-Host "部署完成！" -ForegroundColor Green
Write-Host "請使用 Gunicorn 或 uWSGI 啟動服務" -ForegroundColor Yellow
'@ | Out-File -FilePath deploy.ps1 -Encoding UTF8