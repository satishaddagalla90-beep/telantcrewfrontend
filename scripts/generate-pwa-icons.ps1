Add-Type -AssemblyName System.Drawing
$src = "public\logo512.png"
if (-not (Test-Path $src)) {
    Write-Host "MISSING"
    exit 1
}
$img = [System.Drawing.Image]::FromFile($src)
$sizes = 72,96,128,144,152,180,192,256,384,512
$out = "public\icons"
if (-not (Test-Path $out)) {
    New-Item -ItemType Directory -Path $out | Out-Null
}
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $s, $s)
    $g.Dispose()
    $bmp.Save("$out\icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
$mask = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($mask)
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.DrawImage($img, 20, 20, 472, 472)
$g.Dispose()
$mask.Save("$out\maskable-icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$mask.Dispose()
$img.Dispose()
Write-Host "OK"