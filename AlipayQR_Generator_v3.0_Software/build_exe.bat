@echo off
chcp 65001 >nul
echo ========================================
echo    AlipayQR v3.0 - Windows EXE打包
echo ========================================
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo [!] 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)
echo [*] Python已找到
echo [*] 安装依赖...
python -m pip install --upgrade pip
python -m pip install pyinstaller qrcode[pil] Pillow pycryptodome cryptography requests

echo [*] 打包为EXE...
pyinstaller --noconfirm --onefile --windowed ^
    --name "AlipayQR" ^
    --add-data "src/ui/web/index.html;src/ui/web" ^
    --add-data "src/ui/web/manifest.json;src/ui/web" ^
    --add-data "src/ui/web/sw.js;src/ui/web" ^
    --add-data "src/core;src/core" ^
    --hidden-import qrcode --hidden-import PIL --hidden-import PIL._imagingtk ^
    --hidden-import cryptography --hidden-import Crypto --hidden-import Crypto.PublicKey ^
    --hidden-import Crypto.Signature --hidden-import Crypto.Hash ^
    --hidden-import xml.etree.ElementTree --hidden-import urllib.request ^
    --hidden-import http.server --hidden-import socketserver ^
    main.py

if errorlevel 1 (
    echo [!] 打包失败
    pause
    exit /b 1
)
echo.
echo [+] 打包完成!
echo    输出: dist\AlipayQR.exe
echo    双击即可运行，无需Python环境
echo.
if not exist "AlipayQR_Portable" mkdir "AlipayQR_Portable"
copy "dist\AlipayQR.exe" "AlipayQR_Portable\"
copy "src\ui\web\index.html" "AlipayQR_Portable\"
echo [+] 便携版已创建: AlipayQR_Portable\
pause
