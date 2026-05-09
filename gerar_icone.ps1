Add-Type -AssemblyName System.Drawing

$source = "c:\venda-facil-master\venda-facil-master\logo.png"
$dest   = "c:\venda-facil-master\venda-facil-master\installer\icon.ico"
$dest2  = "c:\venda-facil-master\venda-facil-master\backend\icon.ico"

$img = [System.Drawing.Image]::FromFile($source)

$sizes = @(16, 32, 48, 64, 128, 256)
$images = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($img, $size, $size)
    $ms  = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $images += , $ms.ToArray()
    $bmp.Dispose()
    $ms.Dispose()
}

$img.Dispose()

function Write-Ico {
    param($path, $imgs)
    $fs = New-Object System.IO.FileStream($path, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # ICO Header
    $bw.Write([Int16]0)              # Reserved
    $bw.Write([Int16]1)              # Type: ICO
    $bw.Write([Int16]$imgs.Count)   # Image count

    $offset = 6 + $imgs.Count * 16

    for ($i = 0; $i -lt $imgs.Count; $i++) {
        $s = $sizes[$i]
        $byteSize = [byte]$(if ($s -ge 256) { 0 } else { $s })
        $bw.Write($byteSize)           # Width
        $bw.Write($byteSize)           # Height
        $bw.Write([byte]0)             # Color count
        $bw.Write([byte]0)             # Reserved
        $bw.Write([Int16]1)            # Planes
        $bw.Write([Int16]32)           # Bit count
        $bw.Write([Int32]$imgs[$i].Length)  # Size of image data
        $bw.Write([Int32]$offset)            # Offset to image data
        $offset += $imgs[$i].Length
    }

    foreach ($imgData in $imgs) {
        $bw.Write($imgData)
    }

    $bw.Close()
    $fs.Close()
    Write-Host "ICO criado: $path"
}

Write-Ico -path $dest  -imgs $images
Write-Ico -path $dest2 -imgs $images

Write-Host "Concluido! Icone gerado com sucesso."
