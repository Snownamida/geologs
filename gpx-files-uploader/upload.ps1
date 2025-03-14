# 1. 定义目标文件夹路径（根据实际情况修改）
$folderPath = "G:\LA VIE\Geolog"

# 2. 获取所有GPX文件并按修改时间排序
$latestFile = Get-ChildItem -Path $folderPath -Filter *.gpx | 
              Sort-Object LastWriteTime -Descending | 
              Select-Object -First 1

# 3. 执行上传命令（自动替换最新文件路径）
if ($latestFile) {
    npx -y wrangler r2 object put geologs/gpx/1.gpx -f $latestFile.FullName --remote
    Write-Host "已上传最新文件：$($latestFile.Name)"
} else {
    Write-Host "未找到.gpx文件"
}