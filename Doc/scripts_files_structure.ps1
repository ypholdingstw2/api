# EqWizard 專案目錄自動產生腳本
# 執行後會在 C:\Shares\Coding\EqWizard 建立前後端完整資料夾結構

$root = "C:\Shares\Coding\EqWizard_03"

# 定義所有要建立的資料夾
$folders = @(
    # Backend Django
    "$root\backend\backend",
    "$root\backend\orders\migrations",

    # Frontend Vue
    "$root\frontend\src\api",
    "$root\frontend\src\stores",
    "$root\frontend\src\router",
    "$root\frontend\src\views",
    "$root\frontend\src\components"
)

# 建立資料夾
foreach ($f in $folders) {
    New-Item -Path $f -ItemType Directory -Force | Out-Null
}

# 建立必要空檔案（讓目錄結構完整可用）
$files = @(
    # Backend
    "$root\backend\.env",
    "$root\backend\.gitignore",
    "$root\backend\db.sqlite3",
    "$root\backend\manage.py",
    "$root\backend\backend\__init__.py",
    "$root\backend\backend\settings.py",
    "$root\backend\backend\urls.py",
    "$root\backend\backend\wsgi.py",
    "$root\backend\orders\__init__.py",
    "$root\backend\orders\admin.py",
    "$root\backend\orders\apps.py",
    "$root\backend\orders\models.py",
    "$root\backend\orders\serializers.py",
    "$root\backend\orders\urls.py",
    "$root\backend\orders\views.py",
    "$root\backend\orders\migrations\__init__.py",

    # Frontend
    "$root\frontend\.gitignore",
    "$root\frontend\index.html",
    "$root\frontend\package.json",
    "$root\frontend\vite.config.js",
    "$root\frontend\src\App.vue",
    "$root\frontend\src\main.js",
    "$root\frontend\src\api\index.js",
    "$root\frontend\src\api\order.js",
    "$root\frontend\src\stores\order.js",
    "$root\frontend\src\router\index.js",
    "$root\frontend\src\views\OrderForm.vue",
    "$root\frontend\src\views\OrderList.vue"
)

# 建立空檔案
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        New-Item -Path $file -ItemType File -Force | Out-Null
    }
}

# 完成
Write-Host "`n✅ 專案目結構建立完成！`n路徑：$root`n" -ForegroundColor Green