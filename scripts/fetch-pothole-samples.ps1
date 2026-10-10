$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$annotationRoot = Join-Path $projectRoot 'data/pothole-samples'
$imageRoot = Join-Path $projectRoot 'public/dataset-potholes'
New-Item -ItemType Directory -Force -Path $annotationRoot, $imageRoot | Out-Null
$datasetRef = 'yamqwe/potholes-object-detection'
$metadata = Invoke-RestMethod -Uri "https://www.kaggle.com/api/v1/datasets/view/$datasetRef" -TimeoutSec 30
if ($metadata.licenseName -ne 'CC0: Public Domain') { throw 'Dataset license changed. Review it before importing.' }
$samples = @()
foreach ($number in @(1, 10, 100, 103, 105, 108)) {
    $baseName = "potholes$number"
    $annotationPath = Join-Path $annotationRoot "$baseName.xml"
    $annotationUrl = "https://www.kaggle.com/api/v1/datasets/download/${datasetRef}?file_name=annotations%2F${baseName}.xml"
    Invoke-WebRequest -Uri $annotationUrl -OutFile $annotationPath -TimeoutSec 30
    $settings = [System.Xml.XmlReaderSettings]::new()
    $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
    $settings.XmlResolver = $null
    $reader = [System.Xml.XmlReader]::Create($annotationPath, $settings)
    $annotation = [System.Xml.XmlDocument]::new()
    $annotation.XmlResolver = $null
    try { $annotation.Load($reader) } finally { $reader.Dispose() }
    $filename = [string]$annotation.annotation.filename
    if ($filename -notmatch '^potholes[0-9]+\.png$') { throw 'Unexpected dataset image filename.' }
    $width = [int]$annotation.annotation.size.width
    $height = [int]$annotation.annotation.size.height
    if ($width -le 0 -or $height -le 0) { throw 'Invalid image dimensions.' }
    $boxes = @($annotation.annotation.object | ForEach-Object {
        $box = $_.bndbox
        $xmin = [int]$box.xmin; $ymin = [int]$box.ymin
        $xmax = [int]$box.xmax; $ymax = [int]$box.ymax
        if ($_.name -ne 'pothole' -or $xmin -lt 0 -or $ymin -lt 0 -or $xmax -gt $width -or $ymax -gt $height -or $xmax -le $xmin -or $ymax -le $ymin) { throw 'Invalid pothole annotation.' }
        [ordered]@{ label = 'pothole'; xmin = $xmin; ymin = $ymin; xmax = $xmax; ymax = $ymax }
    })
    $imagePath = Join-Path $imageRoot $filename
    Invoke-WebRequest -Uri "https://www.kaggle.com/api/v1/datasets/download/${datasetRef}?file_name=images%2F${filename}" -OutFile $imagePath -TimeoutSec 30
    $bytes = [System.IO.File]::ReadAllBytes($imagePath)
    if ($bytes.Length -lt 24 -or [Convert]::ToHexString($bytes[0..7]) -ne '89504E470D0A1A0A') { throw 'Download is not a PNG.' }
    $samples += [ordered]@{ id = $baseName; image = "/dataset-potholes/$filename"; originalFile = "images/$filename"; annotationFile = "data/pothole-samples/$baseName.xml"; width = $width; height = $height; boxes = $boxes; sha256 = (Get-FileHash -LiteralPath $imagePath -Algorithm SHA256).Hash.ToLowerInvariant() }
    Write-Output "Imported $baseName with $($boxes.Count) annotated potholes."
}
$manifest = [ordered]@{
    dataset = $datasetRef; version = $metadata.currentVersionNumber
    title = $metadata.title; sourceUrl = "https://www.kaggle.com/datasets/$datasetRef"
    originalAuthor = 'Make ML'; originalSourceUrl = 'https://makeml.app/datasets/potholes'
    license = $metadata.licenseName; licenseUrl = 'https://creativecommons.org/publicdomain/zero/1.0/'
    retrievedAt = [DateTime]::UtcNow.ToString('o'); datasetLastUpdated = $metadata.lastUpdated
    annotationFormat = 'PASCAL VOC'; totalImagesDeclared = 600
    limitations = 'Dataset samples are not verified Chennai complaints. Coordinates, dates, severity, contractors and repair histories in the demo are simulated. Boxes are dataset annotations, not RoadWatch predictions. No model has been trained or evaluated on this sample.'
    samples = $samples
}
$manifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $projectRoot 'data/pothole-samples.json') -Encoding utf8
