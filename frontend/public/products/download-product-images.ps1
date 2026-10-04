# Run from the frontend folder:  powershell -ExecutionPolicy Bypass -File .\download-product-images.ps1
$dir = "public\products"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Invoke-WebRequest -UseBasicParsing -Uri "https://www.autohubnepal.com/wp-content/uploads/2025/07/powerex-1-213x300.jpg" -OutFile "$dir\powerex-5w30-sn.jpg"
Invoke-WebRequest -UseBasicParsing -Uri "https://www.luvyatrading.com/wp-content/uploads/2024/03/ci-4-1.png" -OutFile "$dir\powerex-15w40-ci4.png"
Invoke-WebRequest -UseBasicParsing -Uri "https://www.autohubnepal.com/wp-content/uploads/2025/07/ch-4-1-224x300.png" -OutFile "$dir\powerex-15w40-ch4.png"
Invoke-WebRequest -UseBasicParsing -Uri "https://www.autohubnepal.com/wp-content/uploads/2025/07/1-213x300.jpg" -OutFile "$dir\bluefish-5w30-sn.jpg"
Invoke-WebRequest -UseBasicParsing -Uri "https://www.autohubnepal.com/wp-content/uploads/2025/07/2-262x300.jpg" -OutFile "$dir\bluefish-15w40-ci4.jpg"
Invoke-WebRequest -UseBasicParsing -Uri "https://www.autohubnepal.com/wp-content/uploads/2025/07/20w40-187x300.png" -OutFile "$dir\bluefish-20w40-bikes.png"

Write-Host "Done. Files in $dir"