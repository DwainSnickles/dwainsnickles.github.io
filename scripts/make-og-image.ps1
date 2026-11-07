# Generates assets/og-image.png — the 1200x630 social share card.
#
#   powershell -ExecutionPolicy Bypass -File scripts/make-og-image.ps1
#
# Drawn with GDI+ so the output is exactly 1200x630 regardless of screen or
# browser size. Re-run it after changing the palette or the headline copy.

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root 'assets'
if (-not (Test-Path $assets)) { New-Item -ItemType Directory -Path $assets | Out-Null }
$out = Join-Path $assets 'og-image.png'

$W = 1200
$H = 630

$bmp = [System.Drawing.Bitmap]::new($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function Color([int]$a, [int]$r, [int]$gr, [int]$b) {
    return [System.Drawing.Color]::FromArgb($a, $r, $gr, $b)
}

$ink = Color 255 233 242 255
$inkDim = Color 255 169 188 214
$muted = Color 255 113 134 163
$cyan = Color 255 34 211 238
$cyanSoft = Color 255 127 233 255
$violet = Color 255 160 107 255
$lime = Color 255 154 230 164

# --- base gradient -----------------------------------------------------------
$rect = [System.Drawing.Rectangle]::new(0, 0, $W, $H)
$bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, (Color 255 4 6 12), (Color 255 9 17 32), 35.0)
$g.FillRectangle($bg, $rect)

# --- soft glows --------------------------------------------------------------
function Add-Glow([double]$cx, [double]$cy, [double]$rx, [double]$ry, $tone, [int]$strength) {
    for ($i = 30; $i -ge 1; $i--) {
        $t = $i / 30.0
        $alpha = [int]($strength * (1 - $t))
        if ($alpha -le 0) { continue }
        $brush = [System.Drawing.SolidBrush]::new(([System.Drawing.Color]::FromArgb($alpha, $tone.R, $tone.G, $tone.B)))
        $w = $rx * $t * 2
        $h = $ry * $t * 2
        $g.FillEllipse($brush, [int]($cx - $w / 2), [int]($cy - $h / 2), [int]$w, [int]$h)
        $brush.Dispose()
    }
}

Add-Glow 120 30 820 540 $cyan 26
Add-Glow 1140 60 760 500 $violet 26
Add-Glow 640 700 980 460 ([System.Drawing.Color]::FromArgb(255, 76, 141, 255)) 18

# --- grid --------------------------------------------------------------------
$grid = [System.Drawing.Pen]::new((Color 22 120 170 230), 1)
for ($x = 0; $x -le $W; $x += 62) { $g.DrawLine($grid, $x, 0, $x, $H) }
for ($y = 0; $y -le $H; $y += 62) { $g.DrawLine($grid, 0, $y, $W, $y) }
$grid.Dispose()

# --- left accent bar ---------------------------------------------------------
$barRect = [System.Drawing.Rectangle]::new(0, 0, 7, $H)
$bar = [System.Drawing.Drawing2D.LinearGradientBrush]::new($barRect, $cyan, $violet, 90.0)
$g.FillRectangle($bar, $barRect)
$bar.Dispose()

# --- brand mark --------------------------------------------------------------
$markPen = [System.Drawing.Pen]::new((Color 235 34 211 238), 2.4)
$cx = 108; $cy = 92; $r = 13
$diamond = [System.Drawing.Drawing2D.GraphicsPath]::new()
$diamond.AddPolygon(@(
    [System.Drawing.PointF]::new($cx, $cy - $r),
    [System.Drawing.PointF]::new($cx + $r, $cy),
    [System.Drawing.PointF]::new($cx, $cy + $r),
    [System.Drawing.PointF]::new($cx - $r, $cy)
))
$g.DrawPath($markPen, $diamond)
$markPen.Dispose()
$diamond.Dispose()

$mono = [System.Drawing.Font]::new('Consolas', 19, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$brandBrush = [System.Drawing.SolidBrush]::new($ink)
$g.DrawString('DWAIN.SNICKLES', $mono, $brandBrush, [single]132, [single]78)

# --- eyebrow -----------------------------------------------------------------
$eyebrowFont = [System.Drawing.Font]::new('Consolas', 19, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$eyebrowBrush = [System.Drawing.SolidBrush]::new($cyan)
$g.DrawString('DESKTOP ENGINEERING  /  C#  /  .NET 10', $eyebrowFont, $eyebrowBrush, [single]104, [single]132)
$eyebrowFont.Dispose()
$eyebrowBrush.Dispose()

# --- headline ----------------------------------------------------------------
$titleSize = 86
$titleFont = [System.Drawing.Font]::new('Segoe UI', $titleSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleText = 'Dwain Snickles'
while ($titleSize -gt 56 -and $g.MeasureString($titleText, $titleFont).Width -gt 600) {
    $titleSize -= 4
    $titleFont.Dispose()
    $titleFont = [System.Drawing.Font]::new('Segoe UI', $titleSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
}
$titleRect = [System.Drawing.RectangleF]::new(100, 168, 620, $titleSize + 26)
$titleBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $titleRect,
    (Color 255 255 255 255),
    (Color 255 143 233 255),
    12.0
)
$g.DrawString($titleText, $titleFont, $titleBrush, [single]100, [single]170)
$titleBrush.Dispose()
$titleFont.Dispose()

# --- tagline -----------------------------------------------------------------
$bodyFont = [System.Drawing.Font]::new('Segoe UI', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBrush = [System.Drawing.SolidBrush]::new($inkDim)
$lines = @(
    'Windows desktop tooling in C# and .NET: ribbon',
    'interfaces, design surfaces, media pipelines, and the',
    'small utilities that keep machines honest.'
)
$y = 286
foreach ($line in $lines) {
    $g.DrawString($line, $bodyFont, $bodyBrush, [single]102, [single]$y)
    $y += 40
}
$bodyFont.Dispose()
$bodyBrush.Dispose()

# --- rule + footer -----------------------------------------------------------
$rule = [System.Drawing.Pen]::new((Color 60 140 175 220), 1)
$g.DrawLine($rule, 102, 452, 660, 452)
$rule.Dispose()

$urlFont = [System.Drawing.Font]::new('Consolas', 21, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$urlBrush = [System.Drawing.SolidBrush]::new($cyanSoft)
$g.DrawString('dwainsnickles.github.io', $urlFont, $urlBrush, [single]102, [single]472)
$urlFont.Dispose()
$urlBrush.Dispose()

$metaFont = [System.Drawing.Font]::new('Consolas', 17, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$metaBrush = [System.Drawing.SolidBrush]::new($muted)
$g.DrawString('28 repositories  /  16 stars  /  NuGet: Dwain.RibbonLib', $metaFont, $metaBrush, [single]102, [single]508)
$g.DrawString('GitHub Pages  /  static build  /  no trackers', $metaFont, $metaBrush, [single]102, [single]536)
$metaFont.Dispose()
$metaBrush.Dispose()

# --- console panel -----------------------------------------------------------
function New-RoundRect([int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddArc($x, $y, $r, $r, 180, 90)
    $path.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
    $path.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
    $path.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
    $path.CloseFigure()
    return $path
}

$panelX = 726; $panelY = 148; $panelW = 402; $panelH = 288
$panel = New-RoundRect $panelX $panelY $panelW $panelH 14
$panelFill = [System.Drawing.SolidBrush]::new((Color 232 10 16 28))
$g.FillPath($panelFill, $panel)
$panelFill.Dispose()
$panelPen = [System.Drawing.Pen]::new((Color 74 140 190 240), 1.2)
$g.DrawPath($panelPen, $panel)
$panelPen.Dispose()

$barPen = [System.Drawing.Pen]::new((Color 46 140 175 220), 1)
$g.DrawLine($barPen, $panelX + 1, $panelY + 44, $panelX + $panelW - 1, $panelY + 44)
$barPen.Dispose()

$dotColors = @((Color 255 255 107 107), (Color 255 255 200 107), (Color 255 154 230 164))
for ($i = 0; $i -lt 3; $i++) {
    $db = [System.Drawing.SolidBrush]::new($dotColors[$i])
    $g.FillEllipse($db, $panelX + 22 + ($i * 20), $panelY + 18, 10, 10)
    $db.Dispose()
}

$panelTitleFont = [System.Drawing.Font]::new('Consolas', 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$panelTitleBrush = [System.Drawing.SolidBrush]::new($muted)
$g.DrawString('dwain@workstation - zsh', $panelTitleFont, $panelTitleBrush, [single]($panelX + 96), [single]($panelY + 14))
$panelTitleFont.Dispose()
$panelTitleBrush.Dispose()

$consoleFont = [System.Drawing.Font]::new('Consolas', 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$promptBrush = [System.Drawing.SolidBrush]::new($lime)
$lineBrush = [System.Drawing.SolidBrush]::new((Color 255 185 205 228))
$dimBrush = [System.Drawing.SolidBrush]::new($muted)

$g.DrawString('$', $consoleFont, $promptBrush, [single]($panelX + 24), [single]($panelY + 62))
$g.DrawString('gh repo list DwainSnickles', $consoleFont, $lineBrush, [single]($panelX + 44), [single]($panelY + 62))

$rows = @(
    @('RibbonWinForms', '.NET 10'),
    @('GraphicsWorkshop', 'WinForms'),
    @('MOTW-Cleaner', 'security'),
    @('AutoUpdater XML', 'updater')
)
$rowY = $panelY + 98
foreach ($row in $rows) {
    $g.DrawString($row[0], $consoleFont, $lineBrush, [single]($panelX + 24), [single]$rowY)
    $g.DrawString($row[1], $consoleFont, $dimBrush, [single]($panelX + 250), [single]$rowY)
    $rowY += 30
}

$g.DrawString('OK', $consoleFont, $promptBrush, [single]($panelX + 24), [single]($rowY + 8))
$g.DrawString('28 repositories indexed', $consoleFont, $lineBrush, [single]($panelX + 64), [single]($rowY + 8))

$consoleFont.Dispose()
$promptBrush.Dispose()
$lineBrush.Dispose()
$dimBrush.Dispose()
$panel.Dispose()

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Output "wrote $out (${W}x${H})"
