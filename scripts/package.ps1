$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$files = @('src', 'docs', 'scripts', 'tests', 'playwright.config.ts', '.env.example', '.gitignore', 'package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'next-env.d.ts', 'postcss.config.mjs', 'README.md') | ForEach-Object { Join-Path $projectRoot $_ }
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$archivePath = Join-Path $destination 'dolphy-project-onboard-hostinger.zip'
$stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($itemPath in $files) {
        $item = Get-Item -LiteralPath $itemPath -Force
        $entries = if ($item.PSIsContainer) { Get-ChildItem -LiteralPath $itemPath -Recurse -File -Force } else { @($item) }
        foreach ($entry in $entries) {
            $relative = $entry.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $entry.FullName, $relative) | Out-Null
        }
    }
} finally {
    $archive.Dispose()
    $stream.Dispose()
}
Write-Output $archivePath
