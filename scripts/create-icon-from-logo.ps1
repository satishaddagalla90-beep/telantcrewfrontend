Add-Type -AssemblyName System.Drawing

# Function to extract globe mark from full logo
$src = "public\logo_black.png"
if (-not (Test-Path $src)) {
    Write-Host "Source logo not found"
    exit 1
}

# Load the full logo
$fullLogo = [System.Drawing.Image]::FromFile($src)

# Extract just the globe/planet mark - more precise crop
# The globe is approximately at coordinates: x~10-210, y~50-270 (relative to 1024x512 size estimate)
# We'll crop a square around it

$size = 300  # Square crop size
$startX = 5
$startY = 40

# Crop to square around globe
$croppedBmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($croppedBmp)
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($fullLogo, 0, 0, (New-Object System.Drawing.Rectangle $startX, $startY, $size, $size), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Scale to 512x512 for master icon
$master = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($master)
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($croppedBmp, 0, 0, 512, 512)
$g.Dispose()

$master.Save("public\icon-mark-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$master.Dispose()
$croppedBmp.Dispose()

# Now generate all sizes from the clean mark
$sizes = 72,96,128,144,152,180,192,256,384,512
$out = "public\icons"
if (-not (Test-Path $out)) {
    New-Item -ItemType Directory -Path $out | Out-Null
}

$master = [System.Drawing.Image]::FromFile("public\icon-mark-512.png")

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($master, 0, 0, $s, $s)
    $g.Dispose()
    $bmp.Save("$out\icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# Create maskable icon for Android Adaptive Icons
$mask = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($mask)
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.DrawImage($master, 40, 40, 432, 432)
$g.Dispose()
$mask.Save("$out\maskable-icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$mask.Dispose()
$master.Dispose()

Write-Host "[OK] Icon set generated from globe mark only"
Write-Host "[OK] All sizes: 72px-512px"
Write-Host "[OK] Maskable icon for Android adaptive icons"
